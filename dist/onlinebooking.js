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

/**********************************
*  Recras Online Booking library  *
*  v 0.7.2                        *
**********************************/

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
            return RecrasHttpHelper.postJson(_this.options.getApiBase() + url, data, _this.error);
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

            var statusEl = this.findElement('.voucher-status');
            if (statusEl) {
                statusEl.innerHTML = '';
            } else {
                this.element.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span class="voucher-status"></span>');
                statusEl = this.findElement('.voucher-status');
            }

            if (!voucherCode) {
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_EMPTY');
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_EMPTY');
                return false;
            }
            if (this.appliedVouchers[voucherCode]) {
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_ALREADY_APPLIED');
                return false;
            }
            var date = this.findElement('.recras-onlinebooking-date').value;
            if (isNaN(Date.parse(date))) {
                statusEl.innerHTML = this.languageHelper.translate('DATE_INVALID');
                return false;
            }

            this.postJson('onlineboeking/controleervoucher', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(new Date(date)),
                producten: this.productCounts(),
                vouchers: [voucherCode]
            }).then(function (json) {
                var result = json[voucherCode];
                if (!result.valid) {
                    statusEl.innerHTML = _this3.languageHelper.translate('VOUCHER_INVALID');
                    return false;
                }

                _this3.appliedVouchers[voucherCode] = result.processed;
                _this3.showTotalPrice();

                statusEl.innerHTML = _this3.languageHelper.translate('VOUCHER_APPLIED');
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
        key: 'bookingSizePrice',
        value: function bookingSizePrice(pack) {
            var lines = this.bookingSizeLines(pack);
            return lines.reduce(function (acc, line) {
                return line.product.verkoop + acc;
            }, 0);
        }
    }, {
        key: 'changePackage',
        value: function changePackage(packageID) {
            var _this4 = this;

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
                _this4.findElement('.recras-amountsform').scrollIntoView(scrollOptions);

                _this4.checkDependencies();
                _this4.loadingIndicatorShow(_this4.findElement('.recras-amountsform'));
                return _this4.showDateTimeSelection(_this4.selectedPackage);
            }).then(function () {
                _this4.loadingIndicatorHide();
                _this4.showContactForm(_this4.selectedPackage);
            });
        }
    }, {
        key: 'checkDependencies',
        value: function checkDependencies() {
            var _this5 = this;

            [].concat(_toConsumableArray(this.findElements('.recras-product-dependency'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.requiresProduct = false;

            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var packageLineID = line.arrangementsregel_id;
                    var product = _this5.findProduct(packageLineID).product;
                    product.vereist_product.forEach(function (vp) {
                        if (!_this5.dependencySatisfied(line.aantal, vp)) {
                            _this5.requiresProduct = true;
                            var requiredAmount = _this5.requiredAmount(line.aantal, vp);
                            var requiredProductName = _this5.getProductByID(vp.vereist_product_id).weergavenaam;
                            var message = _this5.languageHelper.translate('PRODUCT_REQUIRED', {
                                NUM: line.aantal,
                                PRODUCT: product.weergavenaam,
                                REQUIRED_AMOUNT: requiredAmount,
                                REQUIRED_PRODUCT: requiredProductName
                            });
                            _this5.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="recras-product-dependency">' + message + '</span>');
                        }
                    });
                }
            });

            this.maybeDisableBookButton();
        }
    }, {
        key: 'checkDiscountcode',
        value: function checkDiscountcode(packageID, date, code) {
            var _this6 = this;

            var statusEl = this.findElement('.discount-status');
            if (statusEl) {
                statusEl.parentNode.removeChild(statusEl);
            }
            return this.fetchJson(this.options.getApiBase() + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code).then(function (discount) {
                if (discount === false) {
                    _this6.findElement('.recras-discountcode').insertAdjacentHTML('beforeend', '<span class="discount-status">' + _this6.languageHelper.translate('DISCOUNT_INVALID') + '</span>');
                    return;
                }
                discount.code = code;
                _this6.discount = discount;

                _this6.showTotalPrice();
            });
        }
    }, {
        key: 'checkMaximumAmounts',
        value: function checkMaximumAmounts() {
            var _this7 = this;

            [].concat(_toConsumableArray(this.findElements('.maximum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var maxPerLine = this.selectedPackage.maximum_aantal_personen_online;
            if (maxPerLine === null) {
                return;
            }

            var showWarning = false;
            var selectedProducts = this.productCounts();
            this.languageHelper.filterTags(this.texts.maximum_aantal_online_boeking_overschreden, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
                selectedProducts.forEach(function (p) {
                    if (p.aantal > maxPerLine && !showWarning) {
                        _this7.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="maximum-amount">' + msg + '</span>');
                        showWarning = true;
                    }
                });
            });
        }
    }, {
        key: 'checkMinimumAmounts',
        value: function checkMinimumAmounts() {
            [].concat(_toConsumableArray(this.findElements('.minimum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var selectedProducts = this.productCounts();
            for (var i = 0; i < selectedProducts.length; i++) {
                var product = selectedProducts[i];
                if (product.aantal < 1) {
                    continue;
                }

                var packageLineID = product.arrangementsregel_id;
                var packageLine = this.findProduct(packageLineID);
                if (product.aantal >= packageLine.aantal_personen) {
                    continue;
                }

                var input = this.findElement('[data-package-id="' + packageLineID + '"]');
                if (!input) {
                    // This is a "booking size" line - which has no minimum amount
                    continue;
                }

                var warnEl = document.createElement('span');
                warnEl.classList.add('minimum-amount');
                warnEl.innerHTML = this.languageHelper.translate('PRODUCT_MINIMUM', {
                    MINIMUM: packageLine.aantal_personen
                });

                var label = this.findElement('label[for="' + input.id + '"]');
                label.parentNode.appendChild(warnEl);
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
            this.loadingIndicatorHide().bind(this);
            this.findElement('.latestError').innerHTML = '<strong>{ this.languageHelper.translate(\'ERR_GENERAL\') }</strong><p>' + msg + '</p>';
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
            var _this8 = this;

            return this.postJson('onlineboeking/beschikbaredagen', {
                arrangement_id: packageID,
                begin: RecrasDateHelper.datePartOnly(begin),
                eind: RecrasDateHelper.datePartOnly(end),
                producten: this.productCounts()
            }).then(function (json) {
                _this8.availableDays = _this8.availableDays.concat(json);
                return _this8.availableDays;
            });
        }
    }, {
        key: 'getAvailableTimes',
        value: function getAvailableTimes(packageID, date) {
            var _this9 = this;

            return this.postJson('onlineboeking/beschikbaretijden', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(date),
                producten: this.productCounts()
            }).then(function (json) {
                _this9.availableTimes = json;
                return _this9.availableTimes;
            });
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(pack) {
            var _this10 = this;

            var contactForm = new RecrasContactForm(this.options);
            return contactForm.fromPackage(pack).then(function (formFields) {
                _this10.contactForm = contactForm;
                return formFields;
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
            var _this11 = this;

            return this.fetchJson(this.options.getApiBase() + 'arrangementen').then(function (json) {
                _this11.packages = json;
                return _this11.packages;
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
            var _this12 = this;

            var total = 0;
            this.productCounts().forEach(function (line) {
                var product = _this12.findProduct(line.arrangementsregel_id).product;
                total += line.aantal * product.verkoop;
            });
            return total;
        }
    }, {
        key: 'getTexts',
        value: function getTexts() {
            var _this13 = this;

            var settings = ['maximum_aantal_online_boeking_overschreden', 'online_boeking_betaalkeuze', 'online_boeking_betaalkeuze_achteraf_titel', 'online_boeking_betaalkeuze_ideal_titel', 'online_boeking_step0_text_pre', 'online_boeking_step0_text_post', 'online_boeking_step1_text_pre', 'online_boeking_step1_text_post', 'online_boeking_step3_text_pre', 'online_boeking_step3_text_post'];
            var promises = [];
            settings.forEach(function (setting) {
                promises.push(_this13.fetchJson(_this13.options.getApiBase() + 'instellingen/' + setting));
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
            afterEl.insertAdjacentHTML('beforeend', '<span class="recrasLoadingIndicator">' + this.languageHelper.translate('LOADING') + '</span>');
        }
    }, {
        key: 'maybeDisableBookButton',
        value: function maybeDisableBookButton() {
            var _this14 = this;

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

            if (bookingDisabledReasons.length > 0) {
                var reasonsList = bookingDisabledReasons.map(function (reason) {
                    return _this14.languageHelper.translate(reason);
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
            var _this15 = this;

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
                    var normalisedStart = _this15.normaliseDate(new Date(line.begin), packageStart, _this15.selectedDate);
                    var normalisedEnd = _this15.normaliseDate(new Date(line.eind), packageStart, _this15.selectedDate);
                    _this15.findElement('label[for="packageline' + idx + '"]').insertAdjacentHTML('afterbegin', '<span class="time-preview">(' + RecrasDateHelper.timePartOnly(normalisedStart) + ' \u2013 ' + RecrasDateHelper.timePartOnly(normalisedEnd) + ')</span>');
                });
            }
        }
    }, {
        key: 'productCounts',
        value: function productCounts() {
            var _this16 = this;

            var counts = [];
            [].concat(_toConsumableArray(this.findElements('[id^="packageline"]'))).forEach(function (line) {
                counts.push({
                    aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
                    arrangementsregel_id: parseInt(line.dataset.packageId, 10)
                });
            });
            this.getLinesBookingSize(this.selectedPackage).forEach(function (line) {
                counts.push({
                    aantal: _this16.bookingSize(),
                    arrangementsregel_id: line.id
                });
            });
            return counts;
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
                attachmentHtml += '<p><label><input type="checkbox" required>' + this.languageHelper.translate('AGREE_ATTACHMENTS') + '</label></p>';
                attachmentHtml += '<ul>';
                _objectValues(attachments).forEach(function (attachment) {
                    attachmentHtml += '<li><a href="' + attachment.filename + '" download target="_blank">' + attachment.naam + '</a></li>';
                });
                attachmentHtml += '</ul>';
            }
            this.findElement('.standard-attachments').innerHTML = attachmentHtml;
        }
    }, {
        key: 'showTotalPrice',
        value: function showTotalPrice() {
            [].concat(_toConsumableArray(this.findElements('.discountLine, .voucherLine, .priceTotal'))).forEach(function (el) {
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
                html += '<div class="priceTotal"><div>' + this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT') + '</div><div>' + this.formatPrice(this.getTotalPrice()) + '</div></div>';
            }

            this.findElement('.priceLine').parentElement.insertAdjacentHTML('beforeend', html);
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
            var _this17 = this;

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
                    paymentText += '<ul>\n                <li><label><input type="radio" name="paymentMethod" checked value="' + _this17.PAYMENT_DIRECT + '"> ' + msgs[1] + '</label>\n                <li><label><input type="radio" name="paymentMethod" value="' + _this17.PAYMENT_AFTERWARDS + '"> ' + msgs[2] + '</label>\n            </ul>';
                });
            } else {
                // One fixed choice
                promises.push(Promise.resolve(''));
            }
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step3_text_post, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
                textPostBooking = msg;
            }));

            Promise.all(promises).then(function () {
                var html = '<div>\n            <p>' + textPostBooking + '</p>\n            <div class="standard-attachments"></div>\n            ' + paymentText + '\n            <button type="submit" class="bookPackage" disabled>' + _this17.languageHelper.translate('BUTTON_BOOK_NOW') + '</button>\n            <div class="booking-error" id="bookingErrors"></div>\n        </div>';
                _this17.appendHtml(html);
                _this17.findElement('.bookPackage').addEventListener('click', _this17.submitBooking.bind(_this17));
            });
        }
    }, {
        key: 'showDiscountFields',
        value: function showDiscountFields() {
            var _this18 = this;

            [].concat(_toConsumableArray(this.findElements('.recras-discountcode, .recras-vouchers'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '\n            <div class="recras-discountcode">\n                <label for="discountcode">' + this.languageHelper.translate('DISCOUNT_CODE') + '</label>\n                <input type="text" id="discountcode" class="discountcode" maxlength="50">\n                <button>' + this.languageHelper.translate('DISCOUNT_CHECK') + '</button>\n            </div>\n            <div class="recras-vouchers">\n                <div>\n                    <label for="voucher">' + this.languageHelper.translate('VOUCHER') + '</label>\n                    <input type="text" class="voucher" maxlength="50">\n                    <button>' + this.languageHelper.translate('VOUCHER_APPLY') + '</button>\n                </div>\n            </div>\n        ';
            this.findElement('.recras-contactform').insertAdjacentHTML('beforebegin', html);

            this.findElement('.recras-discountcode > button').addEventListener('click', function () {
                _this18.checkDiscountcode(_this18.selectedPackage.id, _this18.findElement('.recras-onlinebooking-date').value, _this18.findElement('.discountcode').value);
            });
            this.findElement('.recras-vouchers button').addEventListener('click', function (e) {
                _this18.applyVoucher(_this18.selectedPackage.id, e.srcElement.parentElement.querySelector('input').value.trim());
            });
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(pack) {
            var _this19 = this;

            this.loadingIndicatorShow(this.findElement('.recras-datetime'));
            this.getContactFormFields(pack).then(function (fields) {
                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this19.contactForm.getCountryList());
                }
                Promise.all(waitFor).then(function () {
                    var html = '<form class="recras-contactform">';
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this19.contactForm.showField(field, idx) + '</div>';
                    });
                    html += '</form>';
                    _this19.appendHtml(html);
                    _this19.loadingIndicatorHide();
                    _this19.showBookButton();
                    RecrasEventHelper.sendEvent('Recras:Booking:ContactFormShown');

                    [].concat(_toConsumableArray(_this19.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                        el.addEventListener('change', _this19.maybeDisableBookButton.bind(_this19));
                    });
                });
            });
        }
    }, {
        key: 'showDateTimeSelection',
        value: function showDateTimeSelection(pack) {
            var _this20 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            return this.getAvailableDays(pack.id, startDate, endDate).then(function () {
                var today = RecrasDateHelper.datePartOnly(new Date());
                var html = '<div class="recras-datetime">';
                html += '<label for="recras-onlinebooking-date">' + _this20.languageHelper.translate('DATE') + '</label><input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="' + today + '" disabled>';
                html += '<label for="recras-onlinebooking-time">' + _this20.languageHelper.translate('TIME') + '</label><select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled></select>';
                html += '</div>';
                _this20.appendHtml(html);
                var pikadayOptions = _extends(RecrasCalendarHelper.defaultOptions(), {
                    disableDayFn: function disableDayFn(day) {
                        var dateFmt = RecrasDateHelper.datePartOnly(day);
                        return _this20.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: _this20.findElement('.recras-onlinebooking-date'),
                    i18n: RecrasCalendarHelper.i18n(_this20.languageHelper),
                    onDraw: function onDraw(pika) {
                        var lastMonthYear = pika.calendars[pika.calendars.length - 1];
                        var lastDay = new Date(lastMonthYear.year, lastMonthYear.month, 31);

                        var lastAvailableDay = _this20.availableDays.reduce(function (acc, curVal) {
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

                        _this20.getAvailableDays(pack.id, lastAvailableDay, newEndDate);
                    },
                    onSelect: function onSelect(date) {
                        RecrasEventHelper.sendEvent('Recras:Booking:DateSelected');
                        _this20.selectedDate = date;
                        _this20.getAvailableTimes(pack.id, date).then(function (times) {
                            times = times.map(function (time) {
                                return RecrasDateHelper.timePartOnly(new Date(time));
                            });
                            _this20.showTimes(times);
                        });
                        _this20.maybeDisableBookButton();
                        _this20.showDiscountFields();
                    }
                });

                _this20.datePicker = new Pikaday(pikadayOptions);

                _this20.findElement('.recras-onlinebooking-time').addEventListener('change', function () {
                    RecrasEventHelper.sendEvent('Recras:Booking:TimeSelected');
                    _this20.selectedTime = _this20.findElement('.recras-onlinebooking-time').value;
                    _this20.previewTimes();
                    _this20.maybeDisableBookButton();
                });
            });
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this21 = this;

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
                _this21.appendHtml('<div class="recras-package-select"><p>' + msgs[0] + '</p>' + html + '<p>' + msgs[1] + '</p></div>');
                RecrasEventHelper.sendEvent('Recras:Booking:PackagesShown');

                var packageSelectEl = _this21.findElement('.recras-package-selection');
                packageSelectEl.addEventListener('change', function () {
                    var selectedPackageId = parseInt(packageSelectEl.value, 10);
                    _this21.changePackage(selectedPackageId);
                });
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this22 = this;

            var promises = [];
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_post, this.selectedPackage ? this.selectedPackage.id : null));

            return Promise.all(promises).then(function (msgs) {
                var html = '<div class="recras-amountsform">';
                html += '<p>' + msgs[0] + '</p>';

                if (_this22.shouldShowBookingSize(pack)) {
                    html += '<div>';
                    html += '<div><label for="bookingsize">' + (pack.weergavenaam || pack.arrangement) + '</label></div>';
                    html += '<input type="number" id="bookingsize" class="bookingsize" min="0">';
                    html += '<div class="recras-price">' + _this22.formatPrice(_this22.bookingSizePrice(pack)) + '</div>';
                    html += '</div>';
                }

                var linesNoBookingSize = _this22.getLinesNoBookingSize(pack);
                linesNoBookingSize.forEach(function (line, idx) {
                    html += '<div><div>';
                    html += '<label for="packageline' + idx + '">' + line.beschrijving_templated + '</label>';
                    var maxAttr = line.max ? 'max="' + line.max + '"' : '';
                    html += '</div><input id="packageline' + idx + '" type="number" min="0" ' + maxAttr + ' data-package-id="' + line.id + '">';
                    html += '<div class="recras-price">' + _this22.formatPrice(line.product.verkoop) + '</div>';
                    html += '</div>';
                });
                html += '<div class="priceLine"><div>' + _this22.languageHelper.translate('PRICE_TOTAL') + '</div><div class="priceSubtotal"></div></div>';

                html += '<p>' + msgs[1] + '</p>';
                html += '</div>';
                _this22.appendHtml(html);

                [].concat(_toConsumableArray(_this22.findElements('[id^="packageline"], .bookingsize'))).forEach(function (el) {
                    el.addEventListener('input', _this22.updateProductAmounts.bind(_this22));
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
            var _this23 = this;

            var attachments = {};
            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var product = _this23.findProduct(line.arrangementsregel_id).product;
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
            var _this24 = this;

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

            var paymentMethod = this.PAYMENT_DIRECT;
            var paymentMethodEl = this.findElement('[name="paymentMethod"]:checked');
            if (paymentMethodEl && this.validPaymentMethod(this.selectedPackage, paymentMethodEl.value)) {
                paymentMethod = paymentMethodEl.value;
            }

            this.loadingIndicatorHide();
            this.loadingIndicatorShow(this.findElement('.bookPackage'));
            this.findElement('.bookPackage').setAttribute('disabled', 'disabled');

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
                _this24.loadingIndicatorHide();
                _this24.findElement('.bookPackage').removeAttribute('disabled');

                if (json.payment_url) {
                    window.top.location.href = json.payment_url;
                } else if (json.message && json.status) {
                    if (bookingParams.redirect_url) {
                        RecrasEventHelper.sendEvent('Recras:Booking:RedirectToPayment');
                        window.top.location.href = bookingParams.redirect_url;
                    } else {
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
            var _this25 = this;

            this.loadingIndicatorHide();
            this.loadingIndicatorShow(this.findElement('label[for="recras-onlinebooking-date"]'));
            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            this.availableDays = [];
            this.getAvailableDays(this.selectedPackage.id, startDate, endDate).then(function (availableDays) {
                _this25.loadingIndicatorHide();

                var datePickerEl = _this25.findElement('.recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    _this25.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

            this.checkDependencies();
            this.checkMinimumAmounts();
            this.checkMaximumAmounts();
            this.showTotalPrice();
            this.showStandardAttachments();
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
                script.src = 'https://cdn.rawgit.com/dbushell/Pikaday/eddaaa3b/pikaday.js';
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
        var _this26 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasContactForm);

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;
        this.languageHelper.setOptions(options);
        if (RecrasLanguageHelper.isValid(this.options.getLocale())) {
            this.languageHelper.setLocale(this.options.getLocale());
        }

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this26.error);
        };

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
        key: 'error',
        value: function error(msg) {
            console.log('Error', msg); //TODO
        }
    }, {
        key: 'fromPackage',
        value: function fromPackage(pack) {
            return this.getContactFormFields(pack.onlineboeking_contactformulier_id);
        }
    }, {
        key: 'fromVoucherTemplate',
        value: function fromVoucherTemplate(template) {
            return this.getContactFormFields(template.contactform_id);
        }
    }, {
        key: 'generateJson',
        value: function generateJson() {
            var elements = this.options.getElement().querySelectorAll('[id^="contactformulier-"]');
            var contactForm = {};
            [].concat(_toConsumableArray(elements)).forEach(function (field) {
                contactForm[field.dataset.identifier] = field.value;
            });
            return contactForm;
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(formId) {
            var _this27 = this;

            return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + formId + '/velden').then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                _this27.contactFormFields = fields;
                return _this27.contactFormFields;
            });
        }
    }, {
        key: 'getCountryList',
        value: function getCountryList() {
            var _this28 = this;

            return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + this.languageHelper.locale + '/country.json').then(function (json) {
                _this28.countries = json;
                return _this28.countries;
            });
        }
    }, {
        key: 'showField',
        value: function showField(field, idx) {
            var _this29 = this;

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
                        html += '<option value="' + key + '">' + _this29.languageHelper.translate(_this29.GENDERS[key]);
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
                        var selectedText = code.toUpperCase() === _this29.languageHelper.getCountry() ? ' selected' : '';
                        html += '<option value="' + code + '"' + selectedText + '>' + _this29.countries[code];
                    });
                    html += '</select>';
                    return label + html;
                default:
                    var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                    return label + ('<input type="text" ' + fixedAttributes + ' autocomplete="' + autocomplete + '">');
            }
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
            return '\n@import url(\'https://cdn.rawgit.com/dbushell/Pikaday/eddaaa3b/css/pikaday.css\');\n\n.recras-onlinebooking > *:not(:first-child) + * {\n    border-top: 2px solid #dedede; /* Any love for Kirby out there? */\n}\n\n.booking-error, .minimum-amount {\n    color: hsl(0, 50%, 50%);\n}\n.minimum-amount {\n    padding-left: 0.5em;\n}\n.time-preview {\n    padding-right: 0.5em;\n}\n';
        }
    }, {
        key: 'cssGlobal',
        value: function cssGlobal() {
            return '\n.recras-onlinebooking > *:not(.latestError):not(.recrasLoadingIndicator) {\n    padding: 1em 0;\n}\n.recras-contactform > div, .recras-amountsform > div {\n    align-items: start;\n    display: flex;\n    justify-content: space-between;\n    padding: 0.25em 0;\n}\n\n.recrasLoadingIndicator {\n    animation: recrasSpinner 1.1s infinite linear;\n    border: 0.2em solid rgba(0, 0, 0, 0.2);\n    border-left-color: rgba(0, 0, 0, 0.5);\n    border-radius: 50%;\n    display: inline-block;\n    height: 2em;\n    overflow: hidden;\n    text-indent: -100vw;\n    width: 2em;\n}\n@keyframes recrasSpinner {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\nbutton .recrasLoadingIndicator {\n    height: 1em;\n    margin-left: 0.5em;\n    vertical-align: middle;\n    width: 1em;\n}\n';
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
            return fetch(url, data).then(function (response) {
                if (!response.ok) {
                    errorHandler(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
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
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programme amounts are invalid',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contact form is not filled in completely, or contains invalid values',
                BOOKING_DISABLED_INVALID_DATE: 'Selected date is invalid',
                BOOKING_DISABLED_INVALID_TIME: 'Selected time is invalid',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Required product not yet selected',
                BUTTON_BOOK_NOW: 'Jetzt buchen',
                BUTTON_BUY_NOW: 'Jetzt kaufen',
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
                DISCOUNT_CHECK: 'Überprüfen',
                DISCOUNT_CODE: 'Rabattcode',
                DISCOUNT_INVALID: 'Ungültiger Rabattcode',
                ERR_GENERAL: 'Etwas ist schief gelaufen:',
                ERR_INVALID_ELEMENT: 'Option "Element" ist kein gültiges Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" ist ungültig.',
                ERR_INVALID_LOCALE: 'Ungültiges Gebietsschema. Gültige Optionen sind: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ungültige redirect URL. Stellen Sie sicher, dass es mit http:// or https:// beginnt',
                ERR_NO_ELEMENT: 'Option "element" nicht eingestellt.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" nicht eingestellt.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unbekannte',
                GENDER_MALE: 'Mann',
                GENDER_FEMALE: 'Frau',
                LOADING: 'Wird geladen...',
                NO_PRODUCTS: 'Kein Produkt ausgewählt',
                PRICE_TOTAL: 'Insgesamt',
                PRICE_TOTAL_WITH_DISCOUNT: 'Insgesamt inklusive Rabatt',
                PRODUCT_MINIMUM: '(muss mindestens {MINIMUM} sein)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} benötigt {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} um auch gebucht zu werden.',
                TIME: 'Zeit',
                VOUCHER: 'Gutschein',
                VOUCHER_ALREADY_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLY: 'Einlösen',
                VOUCHER_EMPTY: 'Leerer Gutscheincode',
                VOUCHER_INVALID: 'Ungültiger Gutscheincode',
                VOUCHER_QUANTITY: 'Anzahl der Gutscheine',
                VOUCHERS_DISCOUNT: 'Rabatt von Gutschein(en)'
            },
            en_GB: {
                AGREE_ATTACHMENTS: 'I agree with the following documents:',
                ATTR_REQUIRED: 'Required',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programme amounts are invalid',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contact form is not filled in completely, or contains invalid values',
                BOOKING_DISABLED_INVALID_DATE: 'Selected date is invalid',
                BOOKING_DISABLED_INVALID_TIME: 'Selected time is invalid',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Required product not yet selected',
                BUTTON_BOOK_NOW: 'Book now',
                BUTTON_BUY_NOW: 'Buy now',
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
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_CODE: 'Discount code',
                DISCOUNT_INVALID: 'Invalid discount code',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Invalid redirect URL. Make sure you it starts with http:// or https://',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                LOADING: 'Loading...',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_MINIMUM: '(must be at least {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                VOUCHER: 'Voucher',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_APPLY: 'Apply',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_INVALID: 'Invalid voucher code',
                VOUCHER_QUANTITY: 'Number of vouchers',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)'
            },
            nl_NL: {
                AGREE_ATTACHMENTS: 'Ik ga akkoord met de volgende gegevens:',
                ATTR_REQUIRED: 'Vereist',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Aantallen in programma zijn ongeldig',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contactformuler is niet volledig ingevuld, of bevat ongeldige waardes',
                BOOKING_DISABLED_INVALID_DATE: 'Geselecteerde datum is ongeldig',
                BOOKING_DISABLED_INVALID_TIME: 'Geselecteerde tijd is ongeldig',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Vereist product nog niet geselecteerd',
                BUTTON_BOOK_NOW: 'Nu boeken',
                BUTTON_BUY_NOW: 'Nu kopen',
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
                DISCOUNT_CHECK: 'Controleren',
                DISCOUNT_CODE: 'Kortingscode',
                DISCOUNT_INVALID: 'Ongeldige kortingscode',
                ERR_GENERAL: 'Er ging iets mis:',
                ERR_INVALID_ELEMENT: 'Optie "element" is geen geldig Element',
                ERR_INVALID_HOSTNAME: 'Optie "recras_hostname" is ongeldig.',
                ERR_INVALID_LOCALE: 'Ongeldige locale. Geldige opties zijn: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ongeldige redirect-URL. Zorg ervoor dat deze begint met http:// of https://',
                ERR_NO_ELEMENT: 'Optie "element" niet ingesteld.',
                ERR_NO_HOSTNAME: 'Optie "recras_hostname" niet ingesteld.',
                ERR_OPTIONS_INVALID: 'Opties is geen "RecrasOptions"-object',
                GENDER_UNKNOWN: 'Onbekend',
                GENDER_MALE: 'Man',
                GENDER_FEMALE: 'Vrouw',
                LOADING: 'Laden...',
                NO_PRODUCTS: 'Geen product gekozen',
                PRICE_TOTAL: 'Totaal',
                PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
                PRODUCT_MINIMUM: '(moet minstens {MINIMUM} zijn)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
                TIME: 'Tijd',
                VOUCHER: 'Tegoedbon',
                VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
                VOUCHER_APPLIED: 'Tegoedbon toegepast',
                VOUCHER_APPLY: 'Toepassen',
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_INVALID: 'Ongeldige tegoedbon',
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
            return price.toLocaleString(this.formatLocale('currency'), {
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
            var _this30 = this;

            var errorHandler = function errorHandler(err) {
                _this30.currency = 'eur';
                _this30.error(err);
            };

            return RecrasHttpHelper.fetchJson(this.options.getApiBase() + 'instellingen/currency', errorHandler).then(function (setting) {
                _this30.currency = setting.waarde;
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
/****************************
 *  Recras voucher library  *
 *  v 0.7.2                 *
 ***************************/

RecrasOptions.hostnameDebug = '172.16.0.2';

var RecrasVoucher = function () {
    function RecrasVoucher() {
        var _this31 = this;

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
            return RecrasHttpHelper.fetchJson(url, _this31.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this31.options.getApiBase() + url, data, _this31.error);
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
            return _this31.getVoucherTemplates();
        }).then(function (templates) {
            if (_this31.options.getVoucherTemplateId()) {
                _this31.changeTemplate(_this31.options.getVoucherTemplateId());
            } else {
                _this31.showTemplates(templates);
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
            var _this32 = this;

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
                _this32.findElement('.buyTemplate').removeAttribute('disabled');

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
            this.findElement('.latestError').innerHTML = '<strong>{ this.languageHelper.translate(\'ERR_GENERAL\') }</strong><p>' + msg + '</p>';
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
        key: 'getContactFormFields',
        value: function getContactFormFields(template) {
            var _this33 = this;

            var contactForm = new RecrasContactForm(this.options);
            return contactForm.fromVoucherTemplate(template).then(function (formFields) {
                _this33.contactForm = contactForm;
                return formFields;
            });
        }
    }, {
        key: 'getVoucherTemplates',
        value: function getVoucherTemplates() {
            var _this34 = this;

            return this.fetchJson(this.options.getApiBase() + 'voucher_templates').then(function (templates) {
                _this34.templates = templates;
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
        key: 'quantitySelector',
        value: function quantitySelector() {
            return '<div><label for="number-of-vouchers">' + this.languageHelper.translate('VOUCHER_QUANTITY') + '</label><input type="number" id="number-of-vouchers" class="number-of-vouchers" min="1" value="1" required></div>';
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
            var _this35 = this;

            this.selectedTemplate = this.templates.filter(function (t) {
                return t.id === templateId;
            })[0];

            this.getContactFormFields(this.selectedTemplate).then(function (fields) {
                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this35.contactForm.getCountryList());
                }
                Promise.all(waitFor).then(function () {
                    var html = '<form class="recras-contactform">';
                    html += _this35.quantitySelector();
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this35.contactForm.showField(field, idx) + '</div>';
                    });
                    html += '</form>';
                    _this35.appendHtml(html);
                    _this35.showBuyButton();

                    [].concat(_toConsumableArray(_this35.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                        el.addEventListener('change', _this35.maybeDisableBuyButton.bind(_this35));
                    });
                });
            });
        }
    }, {
        key: 'showTemplates',
        value: function showTemplates(templates) {
            var _this36 = this;

            var templateOptions = templates.map(function (template) {
                return '<option value="' + template.id + '">' + template.name + ' (' + _this36.formatPrice(template.price) + ')';
            });
            var html = '<select class="recrasVoucherTemplates"><option>' + templateOptions.join('') + '</select>';
            this.appendHtml('<div class="recras-voucher-templates">' + html + '</div>');

            var voucherSelectEl = this.findElement('.recrasVoucherTemplates');
            voucherSelectEl.addEventListener('change', function () {
                var selectedTemplateId = parseInt(voucherSelectEl.value, 10);
                _this36.changeTemplate(selectedTemplateId);
            });
        }
    }]);

    return RecrasVoucher;
}();