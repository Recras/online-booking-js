'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _objectValues(obj) {
    var values = [];
    var keys = Object.keys(obj);

    for (var k = 0; k < keys.length; ++k) values.push(obj[keys[k]]);

    return values;
}

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*******************************
*  Recras integration library  *
*  v 0.10.3                    *
*******************************/

var RecrasBooking = function () {
    function RecrasBooking() {
        var _this = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasBooking);

        this.datePicker = null;

        this.PAYMENT_DIRECT = 'mollie';
        this.PAYMENT_AFTERWARDS = 'factuur';

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        var optionsPromise = this.languageHelper.setOptions(options);

        this.element = this.options.getElement();
        this.element.classList.add('recras-onlinebooking');

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this.options.getApiBase() + url, data, _this.error.bind(_this));
        };

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', ')
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssGlobal());
        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssBooking());
        this.clearAll();

        this.loadingIndicatorShow(this.element);
        optionsPromise.then(function () {
            return RecrasCalendarHelper.loadScript();
        }).then(function () {
            return _this.getTexts();
        }).then(function (texts) {
            _this.texts = texts;
            return _this.getPackages();
        }).then(function (packages) {
            _this.loadingIndicatorHide();
            if (_this.options.getPackageId()) {
                _this.changePackage(_this.options.getPackageId());
            } else {
                _this.showPackages(packages);
            }
        });
    }

    _createClass(RecrasBooking, [{
        key: 'amountsValid',
        value: function amountsValid(pack) {
            var _this2 = this;

            var hasAtLeastOneProduct = false;
            this.getLinesNoBookingSize(pack).forEach(function (line) {
                var aantal = _this2.findElement('[data-package-id="' + line.id + '"]').value;
                if (aantal > 0) {
                    hasAtLeastOneProduct = true;
                }
                if (aantal > 0 && aantal < line.aantal_personen) {
                    return false;
                }
            });
            if (this.shouldShowBookingSize(pack) && this.bookingSize() > 0) {
                if (this.bookingSize() < this.bookingSizeMinimum(pack) || this.bookingSize() > this.bookingSizeMaximum(pack)) {
                    return false;
                }
                hasAtLeastOneProduct = true;
            }
            return hasAtLeastOneProduct;
        }
    }, {
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'applyVoucher',
        value: function applyVoucher(packageID, voucherCode) {
            var _this3 = this;

            if (!voucherCode) {
                this.setDiscountStatus(this.languageHelper.translate('VOUCHER_EMPTY'));
                return false;
            }
            if (this.appliedVouchers[voucherCode]) {
                this.setDiscountStatus(this.languageHelper.translate('VOUCHER_ALREADY_APPLIED'));
                return false;
            }
            if (!this.selectedDate) {
                this.setDiscountStatus(this.languageHelper.translate('DATE_INVALID'));
                return false;
            }

            return this.postJson('onlineboeking/controleervoucher', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(this.selectedDate),
                producten: this.productCounts(),
                vouchers: [voucherCode]
            }).then(function (json) {
                var result = json[voucherCode];
                if (!result.valid) {
                    return false;
                }

                _this3.appliedVouchers[voucherCode] = result.processed;
                _this3.showTotalPrice();

                return true;
            });
        }
    }, {
        key: 'bookingSize',
        value: function bookingSize() {
            var bookingSizeEl = this.findElement('.bookingsize');
            if (!bookingSizeEl) {
                return 0;
            }
            return parseInt(bookingSizeEl.value, 10);
        }
    }, {
        key: 'bookingSizeLines',
        value: function bookingSizeLines(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            });
        }
    }, {
        key: 'bookingSizeMaximum',
        value: function bookingSizeMaximum(pack) {
            return Number.POSITIVE_INFINITY; //TODO: this can't currently be done using the public packages API
        }
    }, {
        key: 'bookingSizeLineMinimum',
        value: function bookingSizeLineMinimum(line) {
            if (line.onlineboeking_aantalbepalingsmethode === 'vast') {
                return 0;
            }
            return line.product.minimum_aantal;
        }
    }, {
        key: 'bookingSizeMinimum',
        value: function bookingSizeMinimum(pack) {
            var _this4 = this;

            var minSize = 0;
            this.bookingSizeLines(pack).forEach(function (line) {
                minSize = Math.max(minSize, _this4.bookingSizeLineMinimum(line));
            });
            return minSize;
        }
    }, {
        key: 'bookingSizePrice',
        value: function bookingSizePrice(pack) {
            var lines = this.bookingSizeLines(pack);
            return lines.reduce(function (acc, line) {
                return parseFloat(line.product.verkoop) + acc;
            }, 0);
        }
    }, {
        key: 'changePackage',
        value: function changePackage(packageID) {
            var _this5 = this;

            var selectedPackage = this.packages.filter(function (p) {
                return p.id === packageID;
            });

            this.appliedVouchers = {};
            this.discount = null;

            if (selectedPackage.length === 0) {
                // Reset form
                this.selectedPackage = null;
                this.clearAll();
                this.showPackages(this.packages);
                RecrasEventHelper.sendEvent('Recras:Booking:Reset');
                return false;
            } else {
                this.clearAllExceptPackageSelection();
                RecrasEventHelper.sendEvent('Recras:Booking:PackageChanged');
            }
            this.selectedPackage = selectedPackage[0];
            this.showProducts(this.selectedPackage).then(function () {
                RecrasEventHelper.sendEvent('Recras:Booking:ProductsShown');
                var scrollOptions = {
                    behavior: 'smooth'
                };
                if (!('scrollBehavior' in document.documentElement.style)) {
                    scrollOptions = true;
                }
                _this5.findElement('.recras-amountsform').scrollIntoView(scrollOptions);

                _this5.checkDependencies();
                _this5.loadingIndicatorShow(_this5.findElement('.recras-amountsform'));
                return _this5.showDateTimeSelection(_this5.selectedPackage);
            }).then(function () {
                _this5.loadingIndicatorHide();
                _this5.showContactForm(_this5.selectedPackage);
            });
        }
    }, {
        key: 'checkBookingSize',
        value: function checkBookingSize(pack) {
            var bookingSize = this.bookingSize();
            if (bookingSize === 0) {
                return;
            }
            var bsMaximum = this.bookingSizeMaximum(pack);
            var bsMinimum = this.bookingSizeMinimum(pack);

            if (bookingSize < bsMinimum) {
                this.setMinMaxAmountWarning('bookingsize', bsMinimum);
            } else if (bookingSize > bsMaximum) {
                this.setMinMaxAmountWarning('bookingsize', bsMaximum, 'maximum');
            }
            this.maybeDisableBookButton();
        }
    }, {
        key: 'checkDependencies',
        value: function checkDependencies() {
            var _this6 = this;

            [].concat(_toConsumableArray(this.findElements('.recras-product-dependency'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.requiresProduct = false;

            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var packageLineID = line.arrangementsregel_id;
                    var product = _this6.findProduct(packageLineID).product;
                    product.vereist_product.forEach(function (vp) {
                        if (!_this6.dependencySatisfied(line.aantal, vp)) {
                            _this6.requiresProduct = true;
                            var requiredAmount = _this6.requiredAmount(line.aantal, vp);
                            var requiredProductName = _this6.getProductByID(vp.vereist_product_id).weergavenaam;
                            var message = _this6.languageHelper.translate('PRODUCT_REQUIRED', {
                                NUM: line.aantal,
                                PRODUCT: product.weergavenaam,
                                REQUIRED_AMOUNT: requiredAmount,
                                REQUIRED_PRODUCT: requiredProductName
                            });
                            _this6.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="recras-product-dependency">' + message + '</span>');
                        }
                    });
                }
            });

            this.maybeDisableBookButton();
        }
    }, {
        key: 'checkDiscountAndVoucher',
        value: function checkDiscountAndVoucher() {
            var _this7 = this;

            var discountStatus = void 0,
                voucherStatus = void 0;
            var discountPromise = this.checkDiscountcode(this.selectedPackage.id, this.findElement('.recras-onlinebooking-date').value, this.findElement('#discountcode').value.trim()).then(function (status) {
                discountStatus = status;
                return status;
            });

            var voucherPromise = this.applyVoucher(this.selectedPackage.id, this.findElement('#discountcode').value.trim()).then(function (status) {
                voucherStatus = status;
                return status;
            });

            Promise.all([discountPromise, voucherPromise]).then(function () {
                if (discountStatus || voucherStatus) {
                    var status = void 0;
                    if (discountStatus) {
                        status = 'DISCOUNT_APPLIED';
                    } else {
                        status = 'VOUCHER_APPLIED';
                    }
                    _this7.setDiscountStatus(_this7.languageHelper.translate(status), false);
                    _this7.findElement('#discountcode').value = '';
                } else {
                    _this7.setDiscountStatus(_this7.languageHelper.translate('DISCOUNT_INVALID'));
                }
            });
        }
    }, {
        key: 'checkDiscountcode',
        value: function checkDiscountcode(packageID, date, code) {
            var _this8 = this;

            return this.fetchJson(this.options.getApiBase() + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code).then(function (discount) {
                if (discount === false) {
                    return false;
                }
                discount.code = code;
                _this8.discount = discount;

                _this8.showTotalPrice();
                return true;
            });
        }
    }, {
        key: 'checkMaximumAmounts',
        value: function checkMaximumAmounts() {
            var _this9 = this;

            var maxPerLine = this.selectedPackage.maximum_aantal_personen_online;
            if (maxPerLine === null) {
                return;
            }

            var showWarning = false;
            var selectedProducts = this.productCounts();
            this.languageHelper.filterTags(this.texts.maximum_aantal_online_boeking_overschreden, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
                selectedProducts.forEach(function (p) {
                    if (p.aantal > maxPerLine && !showWarning) {
                        var input = _this9.findElement('[data-package-id="' + p.arrangementsregel_id + '"]');
                        if (!input) {
                            input = _this9.findElement('#bookingsize');
                        }

                        if (input) {
                            var warningEl = document.createElement('span');
                            warningEl.classList.add('maximum-amount');
                            warningEl.classList.add('recras-full-width');
                            warningEl.innerHTML = msg;
                            input.parentNode.parentNode.insertBefore(warningEl, input.parentNode.nextSibling);
                            input.classList.add('recras-input-invalid');
                        } else {
                            _this9.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="maximum-amount">' + msg + '</span>');
                        }
                        showWarning = true;
                    }
                });
            });
        }
    }, {
        key: 'setMinMaxAmountWarning',
        value: function setMinMaxAmountWarning(lineID, minAmount) {
            var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'minimum';

            var warnEl = document.createElement('span');
            warnEl.classList.add(type + '-amount');
            this.findElement('#' + lineID).classList.add('recras-input-invalid');

            var text = void 0;
            if (type === 'minimum') {
                text = this.languageHelper.translate('PRODUCT_MINIMUM', {
                    MINIMUM: minAmount
                });
            } else {
                text = this.languageHelper.translate('PRODUCT_MAXIMUM', {
                    MAXIMUM: minAmount
                });
            }
            warnEl.innerHTML = text;
            var label = this.findElement('label[for="' + lineID + '"]');
            label.parentNode.appendChild(warnEl);
        }
    }, {
        key: 'checkMinimumAmounts',
        value: function checkMinimumAmounts() {
            var selectedProducts = this.productCounts();
            for (var i = 0; i < selectedProducts.length; i++) {
                var product = selectedProducts[i];
                if (product.aantal < 1) {
                    continue;
                }

                var packageLineID = product.arrangementsregel_id;
                var packageLine = this.findProduct(packageLineID);
                if (product.aantal >= packageLine.product.minimum_aantal) {
                    continue;
                }

                var input = this.findElement('[data-package-id="' + packageLineID + '"]');
                if (!input) {
                    // This is a "booking size" line - this is handled in checkBookingSize
                    continue;
                }

                this.setMinMaxAmountWarning(input.id, packageLine.product.minimum_aantal);
            }
        }
    }, {
        key: 'clearAll',
        value: function clearAll() {
            this.clearElements(this.element.children);
        }
    }, {
        key: 'clearAllExceptPackageSelection',
        value: function clearAllExceptPackageSelection() {
            var elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-package-select)');
            this.clearElements(elements);
        }
    }, {
        key: 'clearElements',
        value: function clearElements(elements) {
            if (this.datePicker) {
                this.datePicker.destroy();
            }
            this.availableDays = [];
            [].concat(_toConsumableArray(elements)).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.appendHtml('<div class="latestError"></div>');
        }
    }, {
        key: 'dependencySatisfied',
        value: function dependencySatisfied(hasNow, requiredProduct) {
            var productLines = this.productCounts();
            for (var i = 0; i < productLines.length; i++) {
                var line = productLines[i];
                if (line.aantal === 0) {
                    continue;
                }

                var product = this.findProduct(line.arrangementsregel_id).product;
                if (product.id !== parseInt(requiredProduct.vereist_product_id, 10)) {
                    continue;
                }

                var requiredAmount = this.requiredAmount(hasNow, requiredProduct);

                return line.aantal >= requiredAmount;
            }
            return false;
        }
    }, {
        key: 'error',
        value: function error(msg) {
            this.loadingIndicatorHide();
            this.findElement('.latestError').innerHTML = '<strong>' + this.languageHelper.translate('ERR_GENERAL') + '</strong><p>' + msg + '</p>';
        }
    }, {
        key: 'findElement',
        value: function findElement(querystring) {
            return this.element.querySelector(querystring);
        }
    }, {
        key: 'findElements',
        value: function findElements(querystring) {
            return this.element.querySelectorAll(querystring);
        }
    }, {
        key: 'findProduct',
        value: function findProduct(packageLineID) {
            return this.selectedPackage.regels.filter(function (line) {
                return line.id === packageLineID;
            })[0];
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return this.languageHelper.formatPrice(price);
        }
    }, {
        key: 'getAvailableDays',
        value: function getAvailableDays(packageID, begin, end) {
            var _this10 = this;

            return this.postJson('onlineboeking/beschikbaredagen', {
                arrangement_id: packageID,
                begin: RecrasDateHelper.datePartOnly(begin),
                eind: RecrasDateHelper.datePartOnly(end),
                producten: this.productCounts()
            }).then(function (json) {
                _this10.availableDays = _this10.availableDays.concat(json);
                return _this10.availableDays;
            });
        }
    }, {
        key: 'getAvailableTimes',
        value: function getAvailableTimes(packageID, date) {
            var _this11 = this;

            return this.postJson('onlineboeking/beschikbaretijden', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(date),
                producten: this.productCounts()
            }).then(function (json) {
                _this11.availableTimes = json;
                return _this11.availableTimes;
            });
        }
    }, {
        key: 'getContactForm',
        value: function getContactForm(pack) {
            var _this12 = this;

            this.options.setOption('form_id', pack.onlineboeking_contactformulier_id);
            var contactForm = new RecrasContactForm(this.options);
            return contactForm.getContactFormFields().then(function () {
                _this12.contactForm = contactForm;
                return contactForm;
            });
        }
    }, {
        key: 'getDiscountPrice',
        value: function getDiscountPrice(discount) {
            if (!discount) {
                return 0;
            }
            return discount.percentage / 100 * this.getSubTotal() * -1;
        }
    }, {
        key: 'getLinesBookingSize',
        value: function getLinesBookingSize(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            });
        }
    }, {
        key: 'getLinesNoBookingSize',
        value: function getLinesNoBookingSize(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte';
            });
        }
    }, {
        key: 'getPackages',
        value: function getPackages() {
            var _this13 = this;

            return this.fetchJson(this.options.getApiBase() + 'arrangementen').then(function (json) {
                _this13.packages = json;
                return _this13.packages;
            });
        }
    }, {
        key: 'getProductByID',
        value: function getProductByID(id) {
            var products = this.selectedPackage.regels.map(function (r) {
                return r.product;
            });
            return products.filter(function (p) {
                return p.id === id;
            })[0];
        }
    }, {
        key: 'getSubTotal',
        value: function getSubTotal() {
            var _this14 = this;

            var total = 0;
            this.productCounts().forEach(function (line) {
                var product = _this14.findProduct(line.arrangementsregel_id).product;
                var aantal = line.aantal;
                if (isNaN(aantal)) {
                    aantal = 0;
                }
                total += aantal * product.verkoop;
            });
            return total;
        }
    }, {
        key: 'getTexts',
        value: function getTexts() {
            var _this15 = this;

            var settings = ['maximum_aantal_online_boeking_overschreden', 'online_boeking_betaalkeuze', 'online_boeking_betaalkeuze_achteraf_titel', 'online_boeking_betaalkeuze_ideal_titel', 'online_boeking_step0_text_pre', 'online_boeking_step0_text_post', 'online_boeking_step1_text_pre', 'online_boeking_step1_text_post', 'online_boeking_step3_text_pre', 'online_boeking_step3_text_post'];
            var promises = [];
            settings.forEach(function (setting) {
                promises.push(_this15.fetchJson(_this15.options.getApiBase() + 'instellingen/' + setting));
            });
            return Promise.all(promises).then(function (settings) {
                var texts = {};
                settings.forEach(function (setting) {
                    texts[setting.slug] = setting.waarde;
                });
                return texts;
            });
        }
    }, {
        key: 'getTotalPrice',
        value: function getTotalPrice() {
            var total = this.getSubTotal();

            total += this.getDiscountPrice(this.discount);
            total += this.getVouchersPrice();

            return total;
        }
    }, {
        key: 'getVouchersPrice',
        value: function getVouchersPrice() {
            var voucherPrice = 0;
            _objectValues(this.appliedVouchers).forEach(function (voucher) {
                _objectValues(voucher).forEach(function (line) {
                    voucherPrice -= line.aantal * line.prijs_per_stuk;
                });
            });

            return voucherPrice;
        }
    }, {
        key: 'loadingIndicatorHide',
        value: function loadingIndicatorHide() {
            [].concat(_toConsumableArray(document.querySelectorAll('.recrasLoadingIndicator'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
        }
    }, {
        key: 'loadingIndicatorShow',
        value: function loadingIndicatorShow(afterEl) {
            if (!afterEl) {
                return;
            }
            afterEl.insertAdjacentHTML('beforeend', '<span class="recrasLoadingIndicator">' + this.languageHelper.translate('LOADING') + '</span>');
        }
    }, {
        key: 'maybeDisableBookButton',
        value: function maybeDisableBookButton() {
            var _this16 = this;

            var button = this.findElement('.bookPackage');
            if (!button) {
                return false;
            }

            var bookingDisabledReasons = [];
            if (this.requiresProduct) {
                bookingDisabledReasons.push('BOOKING_DISABLED_REQUIRED_PRODUCT');
            }
            if (!this.amountsValid(this.selectedPackage)) {
                bookingDisabledReasons.push('BOOKING_DISABLED_AMOUNTS_INVALID');
            }
            if (!this.findElement('.recras-onlinebooking-date').value) {
                bookingDisabledReasons.push('BOOKING_DISABLED_INVALID_DATE');
            }
            if (!this.findElement('.recras-onlinebooking-time').value) {
                bookingDisabledReasons.push('BOOKING_DISABLED_INVALID_TIME');
            }
            if (!this.findElement('.recras-contactform').checkValidity()) {
                bookingDisabledReasons.push('BOOKING_DISABLED_CONTACT_FORM_INVALID');
            }

            var agreeEl = this.findElement('#recrasAgreeToAttachments');
            if (agreeEl && !agreeEl.checked) {
                bookingDisabledReasons.push('BOOKING_DISABLED_AGREEMENT');
            }

            if (bookingDisabledReasons.length > 0) {
                var reasonsList = bookingDisabledReasons.map(function (reason) {
                    return _this16.languageHelper.translate(reason);
                }).join('<li>');
                this.findElement('#bookingErrors').innerHTML = '<ul><li>' + reasonsList + '</ul>';
                button.setAttribute('disabled', 'disabled');
            } else {
                this.findElement('#bookingErrors').innerHTML = '';
                button.removeAttribute('disabled');
            }
        }
    }, {
        key: 'normaliseDate',
        value: function normaliseDate(date, packageStart, bookingStart) {
            var diffSeconds = (date - packageStart) / 1000;
            var tempDate = new Date(bookingStart.getTime());
            return new Date(tempDate.setSeconds(tempDate.getSeconds() + diffSeconds));
        }
    }, {
        key: 'paymentMethods',
        value: function paymentMethods(pack) {
            var methods = [];
            if (pack.mag_online_geboekt_worden_direct_betalen) {
                methods.push(this.PAYMENT_DIRECT);
            }
            if (pack.mag_online_geboekt_worden_achteraf_betalen) {
                methods.push(this.PAYMENT_AFTERWARDS);
            }
            return methods;
        }
    }, {
        key: 'previewTimes',
        value: function previewTimes() {
            var _this17 = this;

            [].concat(_toConsumableArray(this.findElements('.time-preview'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            if (this.selectedTime) {
                var linesWithTime = this.selectedPackage.regels.filter(function (line) {
                    return !!line.begin;
                });
                var linesBegin = linesWithTime.map(function (line) {
                    return new Date(line.begin);
                });
                var packageStart = new Date(Math.min.apply(Math, _toConsumableArray(linesBegin))); // Math.min transforms dates to timestamps

                this.selectedDate = RecrasDateHelper.setTimeForDate(this.selectedDate, this.selectedTime);

                var linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
                linesNoBookingSize.forEach(function (line, idx) {
                    var normalisedStart = _this17.normaliseDate(new Date(line.begin), packageStart, _this17.selectedDate);
                    var normalisedEnd = _this17.normaliseDate(new Date(line.eind), packageStart, _this17.selectedDate);
                    _this17.findElement('label[for="packageline' + idx + '"]').insertAdjacentHTML('afterbegin', '<span class="time-preview">(' + RecrasDateHelper.timePartOnly(normalisedStart) + ' \u2013 ' + RecrasDateHelper.timePartOnly(normalisedEnd) + ')</span>');
                });
            }
        }
    }, {
        key: 'productCounts',
        value: function productCounts() {
            var _this18 = this;

            var counts = [];
            [].concat(_toConsumableArray(this.findElements('[id^="packageline"]'))).forEach(function (line) {
                counts.push({
                    aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
                    arrangementsregel_id: parseInt(line.dataset.packageId, 10)
                });
            });
            this.getLinesBookingSize(this.selectedPackage).forEach(function (line) {
                counts.push({
                    aantal: _this18.bookingSize(),
                    arrangementsregel_id: line.id
                });
            });
            return counts;
        }
    }, {
        key: 'removeWarnings',
        value: function removeWarnings() {
            [].concat(_toConsumableArray(this.findElements('.minimum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            [].concat(_toConsumableArray(this.findElements('.maximum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            [].concat(_toConsumableArray(this.findElements('.recras-input-invalid'))).forEach(function (el) {
                el.classList.remove('recras-input-invalid');
            });
        }
    }, {
        key: 'requiredAmount',
        value: function requiredAmount(hasNow, requiredProduct) {
            var requiredAmount = hasNow / requiredProduct.per_x_aantal;
            if (requiredProduct.afronding === 'boven') {
                requiredAmount = Math.ceil(requiredAmount);
            } else {
                requiredAmount = Math.floor(requiredAmount);
            }
            return requiredAmount;
        }
    }, {
        key: 'resetForm',
        value: function resetForm() {
            this.changePackage(null);
        }
    }, {
        key: 'setDiscountStatus',
        value: function setDiscountStatus(statusText) {
            var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var statusEl = this.findElement('.discount-status');
            if (!statusEl) {
                this.element.querySelector('.recras-discounts').insertAdjacentHTML('beforeend', '<span class="discount-status"></span>');
                statusEl = this.findElement('.discount-status');
            }
            if (isError) {
                statusEl.classList.add('booking-error');
            } else {
                statusEl.classList.remove('booking-error');
            }

            statusEl.innerHTML = statusText;
        }
    }, {
        key: 'setHtml',
        value: function setHtml(msg) {
            this.element.innerHTML = msg;
        }
    }, {
        key: 'showStandardAttachments',
        value: function showStandardAttachments() {
            if (!this.selectedPackage || !this.findElement('.standard-attachments')) {
                return true;
            }

            var attachments = this.standardAttachments(this.selectedPackage);
            var attachmentHtml = '';
            if (Object.keys(attachments).length) {
                attachmentHtml += '<p><label><input type="checkbox" id="recrasAgreeToAttachments" required>' + this.languageHelper.translate('AGREE_ATTACHMENTS') + '</label></p>';
                attachmentHtml += '<ul>';
                _objectValues(attachments).forEach(function (attachment) {
                    attachmentHtml += '<li><a href="' + attachment.filename + '" download target="_blank">' + attachment.naam + '</a></li>';
                });
                attachmentHtml += '</ul>';
            }
            this.findElement('.standard-attachments').innerHTML = attachmentHtml;
            var agreeEl = this.findElement('#recrasAgreeToAttachments');
            if (agreeEl) {
                agreeEl.addEventListener('change', this.maybeDisableBookButton.bind(this));
            }
        }
    }, {
        key: 'showTotalPrice',
        value: function showTotalPrice() {
            [].concat(_toConsumableArray(this.findElements('.discountLine, .voucherLine, .priceWithDiscount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '';

            if (this.discount) {
                html += '<div class="discountLine"><div>' + this.discount.naam + '</div><div>' + this.formatPrice(this.getDiscountPrice(this.discount)) + '</div></div>';
            }
            if (Object.keys(this.appliedVouchers).length) {
                html += '<div class="voucherLine"><div>' + this.languageHelper.translate('VOUCHERS_DISCOUNT') + '</div><div>' + this.formatPrice(this.getVouchersPrice()) + '</div></div>';
            }
            if (this.discount || Object.keys(this.appliedVouchers).length) {
                html += '<div class="priceWithDiscount"><div>' + this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT') + '</div><div>' + this.formatPrice(this.getTotalPrice()) + '</div></div>';
            }

            var elementToInsertBefore = this.findElement('.recras-amountsform p:last-of-type');
            elementToInsertBefore.insertAdjacentHTML('beforebegin', html);
            this.findElement('.priceSubtotal').innerHTML = this.formatPrice(this.getSubTotal());
        }
    }, {
        key: 'sortPackages',
        value: function sortPackages(packages) {
            // Packages from the API are sorted by internal name, not by display name
            // However, display name is not required so fallback to internal name
            return packages.sort(function (a, b) {
                var aName = a.weergavenaam || a.arrangement;
                var bName = b.weergavenaam || b.arrangement;
                if (aName < bName) {
                    return -1;
                }
                if (aName > bName) {
                    return 1;
                }
                return 0;
            });
        }
    }, {
        key: 'shouldShowBookingSize',
        value: function shouldShowBookingSize(pack) {
            return this.bookingSizeLines(pack).length > 0;
        }
    }, {
        key: 'showBookButton',
        value: function showBookButton() {
            var _this19 = this;

            var promises = [];
            var paymentMethods = this.paymentMethods(this.selectedPackage);
            var paymentText = '';
            var textPostBooking = '';
            if (paymentMethods.indexOf(this.PAYMENT_DIRECT) > -1 && paymentMethods.indexOf(this.PAYMENT_AFTERWARDS) > -1) {
                // Let user decide how to pay
                promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze, this.selectedPackage ? this.selectedPackage.id : null));
                promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze_ideal_titel, this.selectedPackage ? this.selectedPackage.id : null));
                promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze_achteraf_titel, this.selectedPackage ? this.selectedPackage.id : null));

                Promise.all(promises).then(function (msgs) {
                    paymentText = '<p>' + msgs[0] + '</p>';
                    paymentText += '<ul>\n                <li><label><input type="radio" name="paymentMethod" checked value="' + _this19.PAYMENT_DIRECT + '"> ' + msgs[1] + '</label>\n                <li><label><input type="radio" name="paymentMethod" value="' + _this19.PAYMENT_AFTERWARDS + '"> ' + msgs[2] + '</label>\n            </ul>';
                });
            } else {
                // One fixed choice
                promises.push(Promise.resolve(''));
            }
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step3_text_post, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
                textPostBooking = msg;
            }));

            Promise.all(promises).then(function () {
                var html = '<div>\n            <p>' + textPostBooking + '</p>\n            <div class="standard-attachments"></div>\n            ' + paymentText + '\n            <button type="submit" class="bookPackage" disabled>' + _this19.languageHelper.translate('BUTTON_BOOK_NOW') + '</button>\n            <div class="booking-error" id="bookingErrors"></div>\n        </div>';
                _this19.appendHtml(html);
                _this19.findElement('.bookPackage').addEventListener('click', _this19.submitBooking.bind(_this19));
            });
        }
    }, {
        key: 'showDiscountFields',
        value: function showDiscountFields() {
            var _this20 = this;

            var existingEl = this.findElement('.recras-discounts');
            if (existingEl) {
                existingEl.parentNode.removeChild(existingEl);
            }

            var html = '\n            <div class="recras-discounts">\n                <label for="discountcode">' + this.languageHelper.translate('DISCOUNT_TITLE') + '</label>\n                <input type="text" id="discountcode" class="discountcode" maxlength="50">\n                <button>' + this.languageHelper.translate('DISCOUNT_CHECK') + '</button>\n            </div>\n        ';
            this.findElement('.recras-contactform').insertAdjacentHTML('beforebegin', html);

            this.findElement('.recras-discounts input').addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    _this20.checkDiscountAndVoucher().bind(_this20);
                }
            });
            this.findElement('.recras-discounts button').addEventListener('click', this.checkDiscountAndVoucher.bind(this));
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(pack) {
            var _this21 = this;

            this.loadingIndicatorShow(this.findElement('.recras-datetime'));
            this.getContactForm(pack).then(function (form) {
                return form.generateForm();
            }).then(function (html) {
                _this21.appendHtml(html);
                _this21.loadingIndicatorHide();
                _this21.showBookButton();
                RecrasEventHelper.sendEvent('Recras:Booking:ContactFormShown');

                [].concat(_toConsumableArray(_this21.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                    el.addEventListener('change', _this21.maybeDisableBookButton.bind(_this21));
                });
            });
        }
    }, {
        key: 'showDateTimeSelection',
        value: function showDateTimeSelection(pack) {
            var _this22 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            return this.getAvailableDays(pack.id, startDate, endDate).then(function () {
                var today = RecrasDateHelper.datePartOnly(new Date());
                var html = '<form class="recras-datetime">';
                html += '<label for="recras-onlinebooking-date">' + _this22.languageHelper.translate('DATE') + '</label><input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="' + today + '" disabled autocomplete="off">';
                html += '<label for="recras-onlinebooking-time">' + _this22.languageHelper.translate('TIME') + '</label><select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled autocomplete="off"></select>';
                html += '</form>';
                _this22.appendHtml(html);
                var pikadayOptions = _extends(RecrasCalendarHelper.defaultOptions(), {
                    disableDayFn: function disableDayFn(day) {
                        var dateFmt = RecrasDateHelper.datePartOnly(day);
                        return _this22.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: _this22.findElement('.recras-onlinebooking-date'),
                    i18n: RecrasCalendarHelper.i18n(_this22.languageHelper),
                    onDraw: function onDraw(pika) {
                        var lastMonthYear = pika.calendars[pika.calendars.length - 1];
                        var lastDay = new Date(lastMonthYear.year, lastMonthYear.month, 31);

                        var lastAvailableDay = _this22.availableDays.reduce(function (acc, curVal) {
                            return curVal > acc ? curVal : acc;
                        }, '');
                        if (!lastAvailableDay) {
                            lastAvailableDay = new Date();
                        } else {
                            lastAvailableDay = new Date(lastAvailableDay);
                        }
                        if (lastAvailableDay > lastDay) {
                            return;
                        }

                        var newEndDate = RecrasDateHelper.clone(lastAvailableDay);
                        newEndDate.setFullYear(lastMonthYear.year);
                        newEndDate.setMonth(lastMonthYear.month + 2);

                        _this22.getAvailableDays(pack.id, lastAvailableDay, newEndDate);
                    },
                    onSelect: function onSelect(date) {
                        RecrasEventHelper.sendEvent('Recras:Booking:DateSelected');
                        _this22.selectedDate = date;
                        _this22.getAvailableTimes(pack.id, date).then(function (times) {
                            times = times.map(function (time) {
                                return RecrasDateHelper.timePartOnly(new Date(time));
                            });
                            _this22.showTimes(times);
                        });
                        _this22.maybeDisableBookButton();
                        _this22.showDiscountFields();
                    }
                });

                _this22.datePicker = new Pikaday(pikadayOptions);

                _this22.findElement('.recras-onlinebooking-time').addEventListener('change', function () {
                    RecrasEventHelper.sendEvent('Recras:Booking:TimeSelected');
                    _this22.selectedTime = _this22.findElement('.recras-onlinebooking-time').value;
                    _this22.previewTimes();
                    _this22.maybeDisableBookButton();
                });
            });
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this23 = this;

            packages = packages.filter(function (p) {
                return p.mag_online;
            });
            var packagesSorted = this.sortPackages(packages);
            var packageOptions = packagesSorted.map(function (pack) {
                return '<option value="' + pack.id + '">' + (pack.weergavenaam || pack.arrangement);
            });

            var html = '<select class="recras-package-selection"><option>' + packageOptions.join('') + '</select>';
            var promises = [];
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_post, this.selectedPackage ? this.selectedPackage.id : null));
            Promise.all(promises).then(function (msgs) {
                _this23.appendHtml('<div class="recras-package-select"><p>' + msgs[0] + '</p>' + html + '<p>' + msgs[1] + '</p></div>');
                RecrasEventHelper.sendEvent('Recras:Booking:PackagesShown');

                var packageSelectEl = _this23.findElement('.recras-package-selection');
                packageSelectEl.addEventListener('change', function () {
                    var selectedPackageId = parseInt(packageSelectEl.value, 10);
                    _this23.changePackage(selectedPackageId);
                });
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this24 = this;

            var promises = [];
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_post, this.selectedPackage ? this.selectedPackage.id : null));

            return Promise.all(promises).then(function (msgs) {
                var html = '<form class="recras-amountsform">';
                html += '<p>' + msgs[0] + '</p>';

                if (_this24.shouldShowBookingSize(pack)) {
                    html += '<div>';
                    html += '<div><label for="bookingsize">' + (pack.weergavenaam || pack.arrangement) + '</label></div>';
                    html += '<input type="number" id="bookingsize" class="bookingsize" min="0" data-price="' + _this24.bookingSizePrice(pack) + '">';
                    html += '<div class="recras-price recrasUnitPrice">' + _this24.formatPrice(_this24.bookingSizePrice(pack)) + '</div>';
                    html += '</div>';
                }

                var linesNoBookingSize = _this24.getLinesNoBookingSize(pack);
                linesNoBookingSize.forEach(function (line, idx) {
                    html += '<div><div>';
                    html += '<label for="packageline' + idx + '">' + line.beschrijving_templated + '</label>';
                    var maxAttr = line.max ? 'max="' + line.max + '"' : '';
                    html += '</div><input id="packageline' + idx + '" type="number" min="0" ' + maxAttr + ' data-package-id="' + line.id + '" data-price="' + line.product.verkoop + '">';
                    html += '<div class="recras-price recrasUnitPrice">' + _this24.formatPrice(line.product.verkoop) + '</div>';
                    html += '</div>';
                });
                html += '<div class="priceWithoutDiscount"><div>' + _this24.languageHelper.translate('PRICE_TOTAL') + '</div><div class="priceSubtotal"></div></div>';

                html += '<p>' + msgs[1] + '</p>';
                html += '</form>';
                _this24.appendHtml(html);

                [].concat(_toConsumableArray(_this24.findElements('[id^="packageline"], .bookingsize'))).forEach(function (el) {
                    el.addEventListener('input', _this24.updateProductAmounts.bind(_this24));
                    el.addEventListener('input', _this24.updateProductPrice.bind(_this24, el));
                });
            });
        }
    }, {
        key: 'showTimes',
        value: function showTimes(times) {
            var html = '<option>';
            times.forEach(function (time) {
                html += '<option value="' + time + '">' + time;
            });
            this.findElement('.recras-onlinebooking-time').innerHTML = html;
            this.findElement('.recras-onlinebooking-time').removeAttribute('disabled');
        }
    }, {
        key: 'clearTimes',
        value: function clearTimes() {
            this.findElement('.recras-onlinebooking-time').innerHTML = '';
            this.findElement('.recras-onlinebooking-time').setAttribute('disabled', 'disabled');
        }
    }, {
        key: 'standardAttachments',
        value: function standardAttachments() {
            var _this25 = this;

            var attachments = {};
            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var product = _this25.findProduct(line.arrangementsregel_id).product;
                    product.standaardbijlagen.forEach(function (attachment) {
                        attachments[attachment.id] = attachment;
                    });
                }
            });

            return attachments;
        }
    }, {
        key: 'submitBooking',
        value: function submitBooking() {
            var _this26 = this;

            RecrasEventHelper.sendEvent('Recras:Booking:BuyInProgress');
            var productCounts = this.productCounts().map(function (line) {
                return line.aantal;
            });
            var productSum = productCounts.reduce(function (a, b) {
                return a + b;
            }, 0);
            if (this.bookingSize() === 0 && productSum === 0) {
                window.alert(this.languageHelper.translate('NO_PRODUCTS'));
                return false;
            }

            var paymentMethod = this.paymentMethods(this.selectedPackage)[0];
            var paymentMethodEl = this.findElement('[name="paymentMethod"]:checked');
            if (paymentMethodEl && this.validPaymentMethod(this.selectedPackage, paymentMethodEl.value)) {
                paymentMethod = paymentMethodEl.value;
            }

            this.loadingIndicatorHide();
            this.loadingIndicatorShow(this.findElement('.bookPackage'));
            var elem = void 0;
            if (null !== (elem = this.findElement('.bookPackage'))) {
                elem.setAttribute('disabled', 'disabled');
            }

            var vouchers = Object.keys(this.appliedVouchers).length > 0 ? Object.keys(this.appliedVouchers) : null;
            var bookingParams = {
                arrangement_id: this.selectedPackage.id,
                begin: this.selectedDate,
                betaalmethode: paymentMethod,
                contactformulier: this.contactForm.generateJson(),
                kortingscode: this.discount && this.discount.code || null,
                producten: this.productCounts(),
                status: null,
                stuur_bevestiging_email: true,
                vouchers: vouchers
            };
            if (this.shouldShowBookingSize(this.selectedPackage)) {
                bookingParams.boekingsgrootte = this.bookingSize();
            }
            if (this.options.getRedirectUrl()) {
                bookingParams.redirect_url = this.options.getRedirectUrl();
            }

            return this.postJson('onlineboeking/reserveer', bookingParams).then(function (json) {
                _this26.loadingIndicatorHide();
                _this26.findElement('.bookPackage').removeAttribute('disabled');

                //TODO: redirect for payment afterwards. This needs to be implemented in Recras first
                if (json.payment_url) {
                    window.top.location.href = json.payment_url;
                } else if (json.message && json.status) {
                    if (bookingParams.redirect_url) {
                        RecrasEventHelper.sendEvent('Recras:Booking:RedirectToPayment');
                        window.top.location.href = bookingParams.redirect_url;
                    } else {
                        _this26.findElement('.recras-amountsform').reset();
                        _this26.findElement('.recras-datetime').reset();
                        _this26.findElement('.recras-contactform').reset();
                        window.alert(json.message);
                    }
                } else {
                    console.log(json);
                }
            });
        }
    }, {
        key: 'updateProductAmounts',
        value: function updateProductAmounts() {
            var _this27 = this;

            this.loadingIndicatorHide();
            this.loadingIndicatorShow(this.findElement('label[for="recras-onlinebooking-date"]'));
            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            this.availableDays = [];
            this.getAvailableDays(this.selectedPackage.id, startDate, endDate).then(function (availableDays) {
                _this27.loadingIndicatorHide();

                var datePickerEl = _this27.findElement('.recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    _this27.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

            this.removeWarnings();
            this.checkDependencies();
            this.checkMinimumAmounts();
            this.checkMaximumAmounts();
            this.checkBookingSize(this.selectedPackage);
            this.showTotalPrice();
            this.showStandardAttachments();
        }
    }, {
        key: 'updateProductPrice',
        value: function updateProductPrice(el) {
            var priceEl = el.parentNode.querySelector('.recras-price');
            var amount = parseInt(el.value, 10);
            if (amount > 0) {
                priceEl.classList.remove('recrasUnitPrice');
            } else {
                priceEl.classList.add('recrasUnitPrice');
            }
            amount = Math.max(amount, 1);
            priceEl.innerHTML = this.formatPrice(amount * el.dataset.price);
        }
    }, {
        key: 'validPaymentMethod',
        value: function validPaymentMethod(pack, method) {
            return this.paymentMethods(pack).indexOf(method) > -1;
        }
    }]);

    return RecrasBooking;
}();

var RecrasCalendarHelper = function () {
    function RecrasCalendarHelper() {
        _classCallCheck(this, RecrasCalendarHelper);
    }

    _createClass(RecrasCalendarHelper, null, [{
        key: 'defaultOptions',
        value: function defaultOptions() {
            return {
                firstDay: 1, // Monday
                minDate: new Date(),
                numberOfMonths: 2,
                reposition: false,
                toString: function toString(date) {
                    return RecrasDateHelper.toString(date);
                }
            };
        }
    }, {
        key: 'i18n',
        value: function i18n(languageHelper) {
            return {
                previousMonth: languageHelper.translate('DATE_PICKER_PREVIOUS_MONTH'),
                nextMonth: languageHelper.translate('DATE_PICKER_NEXT_MONTH'),
                months: [languageHelper.translate('DATE_PICKER_MONTH_JANUARY'), languageHelper.translate('DATE_PICKER_MONTH_FEBRUARY'), languageHelper.translate('DATE_PICKER_MONTH_MARCH'), languageHelper.translate('DATE_PICKER_MONTH_APRIL'), languageHelper.translate('DATE_PICKER_MONTH_MAY'), languageHelper.translate('DATE_PICKER_MONTH_JUNE'), languageHelper.translate('DATE_PICKER_MONTH_JULY'), languageHelper.translate('DATE_PICKER_MONTH_AUGUST'), languageHelper.translate('DATE_PICKER_MONTH_SEPTEMBER'), languageHelper.translate('DATE_PICKER_MONTH_OCTOBER'), languageHelper.translate('DATE_PICKER_MONTH_NOVEMBER'), languageHelper.translate('DATE_PICKER_MONTH_DECEMBER')],
                weekdays: [languageHelper.translate('DATE_PICKER_DAY_SUNDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_MONDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_TUESDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_WEDNESDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_THURSDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_FRIDAY_LONG'), languageHelper.translate('DATE_PICKER_DAY_SATURDAY_LONG')],
                weekdaysShort: [languageHelper.translate('DATE_PICKER_DAY_SUNDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_MONDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_TUESDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_WEDNESDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_THURSDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_FRIDAY_SHORT'), languageHelper.translate('DATE_PICKER_DAY_SATURDAY_SHORT')]
            };
        }
    }, {
        key: 'loadScript',
        value: function loadScript() {
            return new Promise(function (resolve, reject) {
                var scriptID = 'recrasPikaday';

                // Only load script once
                if (document.getElementById(scriptID)) {
                    resolve(true);
                }

                var script = document.createElement('script');
                script.id = scriptID;
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/pikaday.min.js';
                script.addEventListener('load', function () {
                    return resolve(script);
                }, false);
                script.addEventListener('error', function () {
                    return reject(script);
                }, false);
                document.head.appendChild(script);
            });
        }
    }]);

    return RecrasCalendarHelper;
}();

var RecrasContactForm = function () {
    function RecrasContactForm() {
        var _this28 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasContactForm);

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        if (!this.options.getFormId()) {
            throw new Error(this.languageHelper.translate('ERR_NO_FORM'));
        }

        this.element = this.options.getElement();
        this.element.classList.add('recras-contactform-wrapper');

        this.languageHelper.setOptions(options);
        if (RecrasLanguageHelper.isValid(this.options.getLocale())) {
            this.languageHelper.setLocale(this.options.getLocale());
        }

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this28.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this28.options.getApiBase() + url, data, _this28.error);
        };

        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssGlobal());

        this.GENDERS = {
            onbekend: 'GENDER_UNKNOWN',
            man: 'GENDER_MALE',
            vrouw: 'GENDER_FEMALE'
        };
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control
        this.AUTOCOMPLETE_OPTIONS = {
            'contactpersoon.voornaam': 'given-name',
            'contactpersoon.achternaam': 'family-name',
            'contact.landcode': 'country',
            'contact.naam': 'organization',
            'contactpersoon.adres': 'address-line1',
            'contactpersoon.postcode': 'postal-code',
            'contactpersoon.plaats': 'address-level2'
        };
    }

    _createClass(RecrasContactForm, [{
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'error',
        value: function error(msg) {
            console.log('Error', msg); //TODO
        }
    }, {
        key: 'findElement',
        value: function findElement(querystring) {
            return this.element.querySelector(querystring);
        }
    }, {
        key: 'generateForm',
        value: function generateForm() {
            var _this29 = this;

            var extraOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var waitFor = [];

            if (this.hasCountryField()) {
                waitFor.push(this.getCountryList());
            }
            if (this.hasPackageField()) {
                waitFor.push(this.getPackages(this.options.getFormId()));
            }
            return Promise.all(waitFor).then(function () {
                var html = '<form class="recras-contactform">';
                if (extraOptions.voucherQuantitySelector) {
                    html += _this29.quantitySelector();
                }
                _this29.contactFormFields.forEach(function (field, idx) {
                    html += '<div>' + _this29.showField(field, idx) + '</div>';
                });
                if (extraOptions.showSubmit) {
                    html += _this29.submitButtonHtml();
                }
                html += '</form>';

                return html;
            });
        }
    }, {
        key: 'generateJson',
        value: function generateJson() {
            var formEl = this.options.getElement().querySelector('.recras-contactform');
            var elements = formEl.querySelectorAll('[id^="contactformulier-"], input[type="radio"]:checked');
            var contactForm = {};
            [].concat(_toConsumableArray(elements)).forEach(function (field) {
                contactForm[field.dataset.identifier] = field.value;
            });
            return contactForm;
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields() {
            var _this30 = this;

            return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + this.options.getFormId() + '/velden').then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                _this30.contactFormFields = fields;
                return _this30.contactFormFields;
            });
        }
    }, {
        key: 'getCountryList',
        value: function getCountryList() {
            var _this31 = this;

            return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + this.languageHelper.locale + '/country.json').then(function (json) {
                _this31.countries = json;
                return _this31.countries;
            });
        }
    }, {
        key: 'getPackages',
        value: function getPackages(contactFormID) {
            var _this32 = this;

            return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + contactFormID).then(function (json) {
                _this32.packages = json.Arrangementen;
                return _this32.packages;
            });
        }
    }, {
        key: 'hasFieldOfType',
        value: function hasFieldOfType(identifier) {
            return this.contactFormFields.filter(function (field) {
                return field.field_identifier === identifier;
            }).length > 0;
        }
    }, {
        key: 'hasCountryField',
        value: function hasCountryField() {
            return this.hasFieldOfType('contact.landcode');
        }
    }, {
        key: 'hasPackageField',
        value: function hasPackageField() {
            return this.hasFieldOfType('boeking.arrangement');
        }
    }, {
        key: 'loadingIndicatorHide',
        value: function loadingIndicatorHide() {
            [].concat(_toConsumableArray(document.querySelectorAll('.recrasLoadingIndicator'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
        }
    }, {
        key: 'loadingIndicatorShow',
        value: function loadingIndicatorShow(afterEl) {
            if (!afterEl) {
                return;
            }
            afterEl.insertAdjacentHTML('beforeend', '<span class="recrasLoadingIndicator">' + this.languageHelper.translate('LOADING') + '</span>');
        }
    }, {
        key: 'quantitySelector',
        value: function quantitySelector() {
            return '<div><label for="number-of-vouchers">' + this.languageHelper.translate('VOUCHER_QUANTITY') + '</label><input type="number" id="number-of-vouchers" class="number-of-vouchers" min="1" value="1" required></div>';
        }
    }, {
        key: 'showField',
        value: function showField(field, idx) {
            var _this33 = this;

            if (field.soort_invoer === 'header') {
                return '<h3>' + field.naam + '</h3>';
            }

            var label = this.showLabel(field, idx);
            var attrRequired = field.verplicht ? 'required' : '';
            var html = void 0;
            var fixedAttributes = 'id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' data-identifier="' + field.field_identifier + '"';
            switch (field.soort_invoer) {
                case 'contactpersoon.geslacht':
                    html = '<select ' + fixedAttributes + ' autocomplete="sex">';
                    Object.keys(this.GENDERS).forEach(function (key) {
                        html += '<option value="' + key + '">' + _this33.languageHelper.translate(_this33.GENDERS[key]);
                    });
                    html += '</select>';
                    return label + html;
                case 'keuze':
                    html = '<select ' + fixedAttributes + ' multiple>';
                    field.mogelijke_keuzes.forEach(function (choice) {
                        html += '<option value="' + choice + '">' + choice;
                    });
                    html += '</select>';
                    return label + html;
                case 'keuze_enkel':
                    html = '<div class="radioGroup">';
                    field.mogelijke_keuzes.forEach(function (choice) {
                        html += '<label><input type="radio" name="contactformulier' + idx + '" value="' + choice + '"' + attrRequired + ' data-identifier="' + field.field_identifier + '">' + choice + '</label>';
                    });
                    html += '</div>';
                    return label + html;
                case 'veel_tekst':
                    return label + ('<textarea ' + fixedAttributes + '></textarea>');
                case 'contactpersoon.telefoon1':
                    return label + ('<input type="tel" ' + fixedAttributes + ' autocomplete="tel">');
                case 'contactpersoon.email1':
                    return label + ('<input type="email" ' + fixedAttributes + ' autocomplete="email">');
                case 'contactpersoon.nieuwsbrieven':
                    html = '<select ' + fixedAttributes + ' multiple>';
                    Object.keys(field.newsletter_options).forEach(function (key) {
                        html += '<option value="' + key + '">' + field.newsletter_options[key];
                    });
                    html += '</select>';
                    return label + html;
                case 'contact.landcode':
                    html = '<select ' + fixedAttributes + '>';
                    Object.keys(this.countries).forEach(function (code) {
                        var selectedText = code.toUpperCase() === _this33.languageHelper.getCountry() ? ' selected' : '';
                        html += '<option value="' + code + '"' + selectedText + '>' + _this33.countries[code];
                    });
                    html += '</select>';
                    return label + html;
                case 'boeking.datum':
                    //TODO: date picker
                    var today = RecrasDateHelper.toString(new Date());
                    return label + ('<input type="date" ' + fixedAttributes + ' min="' + today + '">');
                case 'boeking.groepsgrootte':
                    return label + ('<input type="number" ' + fixedAttributes + ' min="1">');
                case 'boeking.starttijd':
                    //TODO: time picker
                    return label + ('<input type="time" ' + fixedAttributes + '>');
                case 'boeking.arrangement':
                    html = '<select ' + fixedAttributes + '>';
                    html += '<option value="">';
                    _objectValues(this.packages).forEach(function (pack) {
                        html += '<option value="' + pack.id + '">' + pack.arrangement;
                    });
                    html += '</select>';
                    return label + html;
                default:
                    var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                    return label + ('<input type="text" ' + fixedAttributes + ' autocomplete="' + autocomplete + '">');
            }
        }
    }, {
        key: 'showForm',
        value: function showForm() {
            var _this34 = this;

            this.loadingIndicatorShow(this.element);
            this.getContactFormFields().then(function () {
                return _this34.generateForm({
                    showSubmit: true
                });
            }).then(function (html) {
                _this34.appendHtml(html);
                _this34.findElement('.recras-contactform').addEventListener('submit', _this34.submitForm.bind(_this34));
                _this34.loadingIndicatorHide();
            });
        }
    }, {
        key: 'showLabel',
        value: function showLabel(field, idx) {
            var labelText = field.naam;
            if (field.verplicht) {
                labelText += '<span class="recras-contactform-required" title="' + this.languageHelper.translate('ATTR_REQUIRED') + '"></span>';
            }
            return '<label for="contactformulier-' + idx + '">' + labelText + '</label>';
        }
    }, {
        key: 'submitButtonHtml',
        value: function submitButtonHtml() {
            return '<button type="submit" class="submitForm">' + this.languageHelper.translate('BUTTON_SUBMIT_CONTACT_FORM') + '</button>';
        }
    }, {
        key: 'submitForm',
        value: function submitForm(e) {
            var _this35 = this;

            e.preventDefault();
            RecrasEventHelper.sendEvent('Recras:ContactForm:Submit');
            var submitButton = this.findElement('.submitForm');

            this.loadingIndicatorHide();
            this.loadingIndicatorShow(submitButton);

            submitButton.setAttribute('disabled', 'disabled');

            this.postJson('contactformulieren/' + this.options.getFormId() + '/opslaan', this.generateJson()).then(function (json) {
                submitButton.removeAttribute('disabled');
                _this35.loadingIndicatorHide();

                if (json.success) {
                    if (_this35.options.getRedirectUrl()) {
                        window.top.location.href = _this35.options.getRedirectUrl();
                    } else {
                        window.alert(_this35.languageHelper.translate('CONTACT_FORM_SUBMIT_SUCCESS'));
                        submitButton.parentNode.reset();
                    }
                } else {
                    window.alert(_this35.languageHelper.translate('CONTACT_FORM_SUBMIT_FAILED'));
                }
            });
            return false;
        }
    }]);

    return RecrasContactForm;
}();

var RecrasCSSHelper = function () {
    function RecrasCSSHelper() {
        _classCallCheck(this, RecrasCSSHelper);
    }

    _createClass(RecrasCSSHelper, null, [{
        key: 'cssBooking',
        value: function cssBooking() {
            return '\n@import url(\'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/css/pikaday.min.css\');\n\n.recras-onlinebooking > *:not(:first-child) + * {\n    border-top: 2px solid #dedede; /* Any love for Kirby out there? */\n}\n.recras-input-invalid {\n    border: 1px solid hsl(0, 50%, 50%);\n}\n.booking-error, .minimum-amount {\n    color: hsl(0, 50%, 50%);\n}\n.minimum-amount {\n    padding-left: 0.5em;\n}\n.time-preview {\n    padding-right: 0.5em;\n}\n.recrasUnitPrice {\n    opacity: 0.5;\n}\n';
        }
    }, {
        key: 'cssGlobal',
        value: function cssGlobal() {
            return '\n.recras-onlinebooking > *:not(.latestError):not(.recrasLoadingIndicator) {\n    padding: 1em 0;\n}\n.recras-contactform > div, .recras-amountsform > div {\n    align-items: start;\n    display: flex;\n    justify-content: space-between;\n    padding: 0.25em 0;\n}\n.recras-contactform label {\n    display: block;\n}\n.recras-full-width {\n    flex: 0 0 100%;\n}\n\n.recrasLoadingIndicator {\n    animation: recrasSpinner 1.1s infinite linear;\n    border: 0.2em solid rgba(0, 0, 0, 0.2);\n    border-left-color: rgba(0, 0, 0, 0.5);\n    border-radius: 50%;\n    display: inline-block;\n    height: 2em;\n    overflow: hidden;\n    text-indent: -100vw;\n    width: 2em;\n}\n@keyframes recrasSpinner {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\nbutton .recrasLoadingIndicator {\n    height: 1em;\n    margin-left: 0.5em;\n    vertical-align: middle;\n    width: 1em;\n}\n';
        }
    }, {
        key: 'loadCSS',
        value: function loadCSS(css) {
            var styleEl = document.createElement('style');
            styleEl.innerHTML = css;

            var refNode = document.head;
            refNode.parentNode.insertBefore(styleEl, refNode);
        }
    }]);

    return RecrasCSSHelper;
}();

var RecrasDateHelper = function () {
    function RecrasDateHelper() {
        _classCallCheck(this, RecrasDateHelper);
    }

    _createClass(RecrasDateHelper, null, [{
        key: 'clone',
        value: function clone(date) {
            return new Date(date.getTime());
        }
    }, {
        key: 'datePartOnly',
        value: function datePartOnly(date) {
            var x = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000); // Fix off-by-1 errors
            return x.toISOString().substr(0, 10); // Format as 2018-03-13
        }
    }, {
        key: 'setTimeForDate',
        value: function setTimeForDate(date, timeStr) {
            date.setHours(timeStr.substr(0, 2), timeStr.substr(3, 2));
            return date;
        }
    }, {
        key: 'timePartOnly',
        value: function timePartOnly(date) {
            return date.toTimeString().substr(0, 5); // Format at 09:00
        }
    }, {
        key: 'toString',
        value: function toString(date) {
            var x = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000); // Fix off-by-1 errors
            x = x.toISOString();
            return x.substr(8, 2) + '-' + x.substr(5, 2) + '-' + x.substr(0, 4);
        }
    }]);

    return RecrasDateHelper;
}();

var RecrasEventHelper = function () {
    function RecrasEventHelper() {
        _classCallCheck(this, RecrasEventHelper);
    }

    _createClass(RecrasEventHelper, null, [{
        key: 'sendEvent',
        value: function sendEvent(name) {
            var event = void 0;

            try {
                event = new Event(name);
            } catch (e) {
                // IE
                event = document.createEvent('Event');
                event.initEvent(name, true, true);
            }
            return document.dispatchEvent(event);
        }
    }]);

    return RecrasEventHelper;
}();

var RecrasHttpHelper = function () {
    function RecrasHttpHelper() {
        _classCallCheck(this, RecrasHttpHelper);
    }

    _createClass(RecrasHttpHelper, null, [{
        key: 'call',
        value: function call(url, data, errorHandler) {
            if (!url) {
                throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
            }
            var lastResponse = void 0;
            return fetch(url, data).then(function (response) {
                lastResponse = response;
                return response.json();
            }).then(function (json) {
                if (!lastResponse.ok) {
                    var errorMsg = json.error && json.error.message ? json.error.message : lastResponse.status + ' ' + lastResponse.statusText;
                    errorHandler(errorMsg);
                    return false;
                }
                return json;
            }).catch(function (err) {
                errorHandler(err);
            });
        }
    }, {
        key: 'fetchJson',
        value: function fetchJson(url, errorHandler) {
            return this.call(url, {
                method: 'get'
            }, errorHandler);
        }
    }, {
        key: 'postJson',
        value: function postJson(url, data, errorHandler) {
            return this.call(url, {
                body: JSON.stringify(data),
                method: 'post'
            }, errorHandler);
        }
    }]);

    return RecrasHttpHelper;
}();

var RecrasLanguageHelper = function () {
    function RecrasLanguageHelper() {
        _classCallCheck(this, RecrasLanguageHelper);

        this.defaultLocale = 'nl_NL';
        this.locale = this.defaultLocale;
        this.options = null;

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            de_DE: {
                AGREE_ATTACHMENTS: 'Ich stimme mit den folgenden Unterlagen:',
                ATTR_REQUIRED: 'Erforderlich',
                BOOKING_DISABLED_AGREEMENT: 'You have not agreed to the terms yet',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programme amounts are invalid',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contact form is not filled in completely, or contains invalid values',
                BOOKING_DISABLED_INVALID_DATE: 'No date selected',
                BOOKING_DISABLED_INVALID_TIME: 'No time selected',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Required product not yet selected',
                BUTTON_BOOK_NOW: 'Jetzt buchen',
                BUTTON_BUY_NOW: 'Jetzt kaufen',
                BUTTON_SUBMIT_CONTACT_FORM: 'Submit',
                CONTACT_FORM_SUBMIT_FAILED: 'The contact form could not be sent. Please try again later.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'The contact form was sent successfully.',
                DATE: 'Datum',
                DATE_INVALID: 'Ungültiges datum',
                DATE_PICKER_NEXT_MONTH: 'Nächsten Monat',
                DATE_PICKER_PREVIOUS_MONTH: 'Vorheriger Monat',
                DATE_PICKER_MONTH_JANUARY: 'Januar',
                DATE_PICKER_MONTH_FEBRUARY: 'Februar',
                DATE_PICKER_MONTH_MARCH: 'März',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'Mai',
                DATE_PICKER_MONTH_JUNE: 'Juni',
                DATE_PICKER_MONTH_JULY: 'Juli',
                DATE_PICKER_MONTH_AUGUST: 'August',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'Oktober',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'Dezember',
                DATE_PICKER_DAY_MONDAY_LONG: 'Montag',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Mo',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Dienstag',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Di',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Mittwoch',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Mi',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Donnerstag',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Do',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Freitag',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Fr',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Samstag',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Sa',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Sonntag',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'So',
                DISCOUNT_APPLIED: 'Rabatt eingelöst',
                DISCOUNT_CHECK: 'Überprüfen',
                DISCOUNT_TITLE: 'Rabattcode oder Gutschein',
                DISCOUNT_INVALID: 'Ungültiger Rabattcode oder Gutschein',
                ERR_GENERAL: 'Etwas ist schief gelaufen:',
                ERR_INVALID_ELEMENT: 'Option "Element" ist kein gültiges Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" ist ungültig.',
                ERR_INVALID_LOCALE: 'Ungültiges Gebietsschema. Gültige Optionen sind: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ungültige redirect URL. Stellen Sie sicher, dass es mit http:// or https:// beginnt',
                ERR_NO_ELEMENT: 'Option "element" nicht eingestellt.',
                ERR_NO_FORM: 'Option "form_id" nicht eingestellt.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" nicht eingestellt.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unbekannte',
                GENDER_MALE: 'Mann',
                GENDER_FEMALE: 'Frau',
                LOADING: 'Wird geladen...',
                NO_PRODUCTS: 'Kein Produkt ausgewählt',
                PRICE_TOTAL: 'Insgesamt',
                PRICE_TOTAL_WITH_DISCOUNT: 'Insgesamt inklusive Rabatt',
                PRODUCT_MAXIMUM: '(muss höchstens {MAXIMUM} sein)',
                PRODUCT_MINIMUM: '(muss mindestens {MINIMUM} sein)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} benötigt {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} um auch gebucht zu werden.',
                TIME: 'Zeit',
                VOUCHER_ALREADY_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_EMPTY: 'Leerer Gutscheincode',
                VOUCHER_QUANTITY: 'Anzahl der Gutscheine',
                VOUCHERS_DISCOUNT: 'Rabatt von Gutschein(en)'
            },
            en_GB: {
                AGREE_ATTACHMENTS: 'I agree with the following documents:',
                ATTR_REQUIRED: 'Required',
                BOOKING_DISABLED_AGREEMENT: 'You have not agreed to the terms yet',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programme amounts are invalid',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contact form is not filled in completely, or contains invalid values',
                BOOKING_DISABLED_INVALID_DATE: 'No date selected',
                BOOKING_DISABLED_INVALID_TIME: 'No time selected',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Required product not yet selected',
                BUTTON_BOOK_NOW: 'Book now',
                BUTTON_BUY_NOW: 'Buy now',
                BUTTON_SUBMIT_CONTACT_FORM: 'Submit',
                CONTACT_FORM_SUBMIT_FAILED: 'The contact form could not be sent. Please try again later.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'The contact form was sent successfully.',
                DATE: 'Date',
                DATE_INVALID: 'Invalid date',
                DATE_PICKER_NEXT_MONTH: 'Next month',
                DATE_PICKER_PREVIOUS_MONTH: 'Previous month',
                DATE_PICKER_MONTH_JANUARY: 'January',
                DATE_PICKER_MONTH_FEBRUARY: 'February',
                DATE_PICKER_MONTH_MARCH: 'March',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'May',
                DATE_PICKER_MONTH_JUNE: 'June',
                DATE_PICKER_MONTH_JULY: 'July',
                DATE_PICKER_MONTH_AUGUST: 'August',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'October',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'December',
                DATE_PICKER_DAY_MONDAY_LONG: 'Monday',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Mon',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Tuesday',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Tue',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Wednesday',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Wed',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Thursday',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Thu',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Friday',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Fri',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Saturday',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Sat',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Sunday',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'Sun',
                DISCOUNT_APPLIED: 'Discount applied',
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_TITLE: 'Discount code or voucher',
                DISCOUNT_INVALID: 'Invalid discount code or voucher',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Invalid redirect URL. Make sure you it starts with http:// or https://',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_FORM: 'Option "form_id" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                LOADING: 'Loading...',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_MAXIMUM: '(must be at most {MAXIMUM})',
                PRODUCT_MINIMUM: '(must be at least {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_QUANTITY: 'Number of vouchers',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)'
            },
            nl_NL: {
                AGREE_ATTACHMENTS: 'Ik ga akkoord met de volgende gegevens:',
                ATTR_REQUIRED: 'Vereist',
                BOOKING_DISABLED_AGREEMENT: 'Je bent nog niet akkoord met de voorwaarden',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Aantallen in programma zijn ongeldig',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contactformuler is niet volledig ingevuld, of bevat ongeldige waardes',
                BOOKING_DISABLED_INVALID_DATE: 'Geen datum geselecteerd',
                BOOKING_DISABLED_INVALID_TIME: 'Geen tijd geselecteerd',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Vereist product nog niet geselecteerd',
                BUTTON_BOOK_NOW: 'Nu boeken',
                BUTTON_BUY_NOW: 'Nu kopen',
                BUTTON_SUBMIT_CONTACT_FORM: 'Versturen',
                CONTACT_FORM_SUBMIT_FAILED: 'Het contactformulier kon niet worden verstuurd. Probeer het later nog eens.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'Het contactformulier is succesvol verstuurd.',
                DATE: 'Datum',
                DATE_INVALID: 'Ongeldige datum',
                DATE_PICKER_NEXT_MONTH: 'Volgende maand',
                DATE_PICKER_PREVIOUS_MONTH: 'Vorige maand',
                DATE_PICKER_MONTH_JANUARY: 'Januari',
                DATE_PICKER_MONTH_FEBRUARY: 'Februari',
                DATE_PICKER_MONTH_MARCH: 'Maart',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'Mei',
                DATE_PICKER_MONTH_JUNE: 'Juni',
                DATE_PICKER_MONTH_JULY: 'Juli',
                DATE_PICKER_MONTH_AUGUST: 'Augustus',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'Oktober',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'December',
                DATE_PICKER_DAY_MONDAY_LONG: 'Maandag',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Ma',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Dinsdag',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Di',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Woensdag',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Wo',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Donderdag',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Do',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Vrijdag',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Vr',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Zaterdag',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Za',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Zondag',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'Zo',
                DISCOUNT_APPLIED: 'Kortingscode toegepast',
                DISCOUNT_CHECK: 'Controleren',
                DISCOUNT_TITLE: 'Kortingscode of tegoedbon',
                DISCOUNT_INVALID: 'Ongeldige kortingscode of tegoedbon',
                ERR_GENERAL: 'Er ging iets mis:',
                ERR_INVALID_ELEMENT: 'Optie "element" is geen geldig Element',
                ERR_INVALID_HOSTNAME: 'Optie "recras_hostname" is ongeldig.',
                ERR_INVALID_LOCALE: 'Ongeldige locale. Geldige opties zijn: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ongeldige redirect-URL. Zorg ervoor dat deze begint met http:// of https://',
                ERR_NO_ELEMENT: 'Optie "element" niet ingesteld.',
                ERR_NO_FORM: 'Optie "form_id" niet ingesteld.',
                ERR_NO_HOSTNAME: 'Optie "recras_hostname" niet ingesteld.',
                ERR_OPTIONS_INVALID: 'Opties is geen "RecrasOptions"-object',
                GENDER_UNKNOWN: 'Onbekend',
                GENDER_MALE: 'Man',
                GENDER_FEMALE: 'Vrouw',
                LOADING: 'Laden...',
                NO_PRODUCTS: 'Geen product gekozen',
                PRICE_TOTAL: 'Totaal',
                PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
                PRODUCT_MAXIMUM: '(moet ten hoogste {MAXIMUM} zijn)',
                PRODUCT_MINIMUM: '(moet minstens {MINIMUM} zijn)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
                TIME: 'Tijd',
                VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
                VOUCHER_APPLIED: 'Tegoedbon toegepast',
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_QUANTITY: 'Aantal tegoedbonnen',
                VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)'
            }
        };
    }

    _createClass(RecrasLanguageHelper, [{
        key: 'error',
        value: function error(msg) {
            console.log('Error', msg); //TODO
        }
    }, {
        key: 'extractTags',
        value: function extractTags(msg) {
            var tags = msg.match(/{(.+?)}/g);
            if (!Array.isArray(tags)) {
                return [];
            }
            return tags.map(function (tag) {
                return tag.substring(1, tag.length - 1);
            }); // Strip { and }
        }
    }, {
        key: 'filterTags',
        value: function filterTags(msg, packageID) {
            var tags = this.extractTags(msg);
            if (tags.length === 0) {
                return Promise.resolve(msg);
            }

            return RecrasHttpHelper.postJson(this.options.getApiBase() + 'tagfilter', {
                tags: tags,
                context: {
                    packageID: packageID
                }
            }, this.error).then(function (filtered) {
                Object.keys(filtered).forEach(function (tag) {
                    msg = msg.split('{' + tag + '}').join(filtered[tag]);
                });
                return msg;
            });
        }
    }, {
        key: 'formatLocale',
        value: function formatLocale(what) {
            switch (what) {
                case 'currency':
                    return this.locale.replace('_', '-').toUpperCase();
                default:
                    return this.locale;
            }
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return parseFloat(price).toLocaleString(this.formatLocale('currency'), {
                currency: this.currency,
                style: 'currency'
            });
        }
    }, {
        key: 'getCountry',
        value: function getCountry() {
            return this.locale.substr(3, 2); // nl_NL -> NL
        }
    }, {
        key: 'setCurrency',
        value: function setCurrency() {
            var _this36 = this;

            var errorHandler = function errorHandler(err) {
                _this36.currency = 'eur';
                _this36.error(err);
            };

            return RecrasHttpHelper.fetchJson(this.options.getApiBase() + 'instellingen/currency', errorHandler).then(function (setting) {
                _this36.currency = setting.waarde;
            });
        }
    }, {
        key: 'setLocale',
        value: function setLocale(locale) {
            this.locale = locale;
        }
    }, {
        key: 'setOptions',
        value: function setOptions(options) {
            this.options = options;
            return this.setCurrency();
        }
    }, {
        key: 'translate',
        value: function translate(string) {
            var vars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var translated = void 0;
            if (this.i18n[this.locale] && this.i18n[this.locale][string]) {
                translated = this.i18n[this.locale][string];
            } else if (this.i18n.en_GB[string]) {
                translated = this.i18n.en_GB[string];
            } else {
                translated = string;
                console.warn('String not translated: ' + string);
            }
            if (Object.keys(vars).length > 0) {
                Object.keys(vars).forEach(function (key) {
                    translated = translated.replace('{' + key + '}', vars[key]);
                });
            }
            return translated;
        }
    }], [{
        key: 'isValid',
        value: function isValid(locale) {
            return this.validLocales.indexOf(locale) > -1;
        }
    }]);

    return RecrasLanguageHelper;
}();

RecrasLanguageHelper.validLocales = ['de_DE', 'en_GB', 'nl_NL'];

var RecrasOptions = function () {
    function RecrasOptions(options) {
        _classCallCheck(this, RecrasOptions);

        this.languageHelper = new RecrasLanguageHelper();
        this.validate(options);
        this.options = this.setOptions(options);
    }

    _createClass(RecrasOptions, [{
        key: 'getApiBase',
        value: function getApiBase() {
            return this.getHostname() + '/api2/';
        }
    }, {
        key: 'getElement',
        value: function getElement() {
            return this.options.element;
        }
    }, {
        key: 'getFormId',
        value: function getFormId() {
            return this.options.form_id;
        }
    }, {
        key: 'getHostname',
        value: function getHostname() {
            return this.options.hostname;
        }
    }, {
        key: 'getLocale',
        value: function getLocale() {
            return this.options.locale;
        }
    }, {
        key: 'getPackageId',
        value: function getPackageId() {
            return this.options.package_id;
        }
    }, {
        key: 'getRedirectUrl',
        value: function getRedirectUrl() {
            return this.options.redirect_url;
        }
    }, {
        key: 'getVoucherTemplateId',
        value: function getVoucherTemplateId() {
            return this.options.voucher_template_id;
        }
    }, {
        key: 'setOption',
        value: function setOption(option, value) {
            this.options[option] = value;
        }
    }, {
        key: 'setOptions',
        value: function setOptions(options) {
            var protocol = options.recras_hostname === RecrasOptions.hostnameDebug ? 'http' : 'https';
            options.hostname = protocol + '://' + options.recras_hostname;

            return options;
        }
    }, {
        key: 'validate',
        value: function validate(options) {
            var hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/i);

            if (!options.element) {
                throw new Error(this.languageHelper.translate('ERR_NO_ELEMENT'));
            }
            if (options.element instanceof Element === false) {
                throw new Error(this.languageHelper.translate('ERR_INVALID_ELEMENT'));
            }

            if (!options.recras_hostname) {
                throw new Error(this.languageHelper.translate('ERR_NO_HOSTNAME'));
            }
            if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== RecrasOptions.hostnameDebug) {
                throw new Error(this.languageHelper.translate('ERR_INVALID_HOSTNAME'));
            }
            if (options.redirect_url) {
                if (options.redirect_url.indexOf('http://') === -1 && options.redirect_url.indexOf('https://') === -1) {
                    throw new Error(this.languageHelper.translate('ERR_INVALID_REDIRECT_URL'));
                }
            }
        }
    }]);

    return RecrasOptions;
}();

RecrasOptions.hostnameDebug = '172.16.0.2';

var RecrasVoucher = function () {
    function RecrasVoucher() {
        var _this37 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasVoucher);

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        this.element = this.options.getElement();
        this.element.classList.add('recras-buy-voucher');

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this37.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this37.options.getApiBase() + url, data, _this37.error);
        };

        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssGlobal());

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', ')
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        this.languageHelper.setOptions(options).then(function () {
            return _this37.getVoucherTemplates();
        }).then(function (templates) {
            if (_this37.options.getVoucherTemplateId()) {
                _this37.changeTemplate(_this37.options.getVoucherTemplateId());
            } else {
                _this37.showTemplates(templates);
            }
        });
    }

    _createClass(RecrasVoucher, [{
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'buyTemplate',
        value: function buyTemplate() {
            var _this38 = this;

            RecrasEventHelper.sendEvent('Recras:Voucher:BuyInProgress');
            this.findElement('.buyTemplate').setAttribute('disabled', 'disabled');

            var payload = {
                voucher_template_id: this.selectedTemplate.id,
                number_of_vouchers: parseInt(this.findElement('.number-of-vouchers').value, 10),
                contact_form: this.contactForm.generateJson()
            };
            if (this.options.getRedirectUrl()) {
                payload.redirect_url = this.options.getRedirectUrl();
            }
            this.postJson('vouchers/buy', payload).then(function (json) {
                _this38.findElement('.buyTemplate').removeAttribute('disabled');

                if (json.payment_url) {
                    RecrasEventHelper.sendEvent('Recras:Voucher:RedirectToPayment');
                    window.top.location.href = json.payment_url;
                } else {
                    console.log(json);
                }
            });
        }
    }, {
        key: 'changeTemplate',
        value: function changeTemplate(templateID) {
            this.clearAllExceptTemplateSelection();
            this.showContactForm(templateID);
            RecrasEventHelper.sendEvent('Recras:Voucher:TemplateChanged');
        }
    }, {
        key: 'clearAll',
        value: function clearAll() {
            this.clearElements(this.element.children);
        }
    }, {
        key: 'clearAllExceptTemplateSelection',
        value: function clearAllExceptTemplateSelection() {
            var elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-voucher-templates)');
            this.clearElements(elements);
        }
    }, {
        key: 'clearElements',
        value: function clearElements(elements) {
            [].concat(_toConsumableArray(elements)).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.appendHtml('<div class="latestError"></div>');
        }
    }, {
        key: 'error',
        value: function error(msg) {
            this.findElement('.latestError').innerHTML = '<strong>' + this.languageHelper.translate('ERR_GENERAL') + '</strong><p>' + msg + '</p>';
        }
    }, {
        key: 'findElement',
        value: function findElement(querystring) {
            return this.element.querySelector(querystring);
        }
    }, {
        key: 'findElements',
        value: function findElements(querystring) {
            return this.element.querySelectorAll(querystring);
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return this.languageHelper.formatPrice(price);
        }
    }, {
        key: 'getContactForm',
        value: function getContactForm(template) {
            var _this39 = this;

            this.options.setOption('form_id', template.contactform_id);
            var contactForm = new RecrasContactForm(this.options);
            return contactForm.getContactFormFields().then(function () {
                _this39.contactForm = contactForm;
                return contactForm;
            });
        }
    }, {
        key: 'getVoucherTemplates',
        value: function getVoucherTemplates() {
            var _this40 = this;

            return this.fetchJson(this.options.getApiBase() + 'voucher_templates').then(function (templates) {
                templates = templates.filter(function (template) {
                    return !!template.contactform_id;
                });
                _this40.templates = templates;
                return templates;
            });
        }
    }, {
        key: 'maybeDisableBuyButton',
        value: function maybeDisableBuyButton() {
            var button = this.findElement('.buyTemplate');
            if (!button) {
                return false;
            }

            var shouldDisable = false;
            if (!this.findElement('.recras-contactform').checkValidity()) {
                shouldDisable = true;
            }

            if (this.findElement('.number-of-vouchers').value < 1) {
                shouldDisable = true;
            }

            if (shouldDisable) {
                button.setAttribute('disabled', 'disabled');
            } else {
                button.removeAttribute('disabled');
            }
        }
    }, {
        key: 'showBuyButton',
        value: function showBuyButton() {
            var html = '<div><button type="submit" class="buyTemplate" disabled>' + this.languageHelper.translate('BUTTON_BUY_NOW') + '</button></div>';
            this.appendHtml(html);
            this.findElement('.buyTemplate').addEventListener('click', this.buyTemplate.bind(this));
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(templateId) {
            var _this41 = this;

            this.selectedTemplate = this.templates.filter(function (t) {
                return t.id === templateId;
            })[0];

            this.getContactForm(this.selectedTemplate).then(function (form) {
                return form.generateForm({
                    voucherQuantitySelector: true
                });
            }).then(function (html) {
                _this41.appendHtml(html);
                _this41.showBuyButton();

                [].concat(_toConsumableArray(_this41.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                    el.addEventListener('change', _this41.maybeDisableBuyButton.bind(_this41));
                });
            });
        }
    }, {
        key: 'showTemplates',
        value: function showTemplates(templates) {
            var _this42 = this;

            var templateOptions = templates.map(function (template) {
                return '<option value="' + template.id + '">' + template.name + ' (' + _this42.formatPrice(template.price) + ')';
            });
            var html = '<select class="recrasVoucherTemplates"><option>' + templateOptions.join('') + '</select>';
            this.appendHtml('<div class="recras-voucher-templates">' + html + '</div>');

            var voucherSelectEl = this.findElement('.recrasVoucherTemplates');
            voucherSelectEl.addEventListener('change', function () {
                var selectedTemplateId = parseInt(voucherSelectEl.value, 10);
                _this42.changeTemplate(selectedTemplateId);
            });
        }
    }]);

    return RecrasVoucher;
}();