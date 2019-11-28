"use strict";

function _objectValues(obj) {
  var values = [];
  var keys = Object.keys(obj);

  for (var k = 0; k < keys.length; k++) values.push(obj[keys[k]]);

  return values;
}

function _objectEntries(obj) {
  var entries = [];
  var keys = Object.keys(obj);

  for (var k = 0; k < keys.length; k++) entries.push([keys[k], obj[keys[k]]]);

  return entries;
}

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*******************************
*  Recras integration library  *
*  v 1.1.4                     *
*******************************/
var RecrasBooking =
/*#__PURE__*/
function () {
  function RecrasBooking() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RecrasBooking);

    this.datePicker = null;
    this.PAYMENT_DIRECT = 'mollie';
    this.PAYMENT_AFTERWARDS = 'factuur';
    this.RECRAS_INFINITY = 99999; // This is used instead of "true infinity" because JSON doesn't have infinity

    this.languageHelper = new RecrasLanguageHelper();

    if (options instanceof RecrasOptions === false) {
      throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
    }

    this.options = options;
    this.eventHelper = new RecrasEventHelper();
    this.eventHelper.setAnalytics(this.options.getAnalytics());
    this.eventHelper.setEvents(this.options.getAnalyticsEvents());
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

    if (this.options.getPreFilledAmounts()) {
      if (!this.options.getPackageId()) {
        console.warn(this.languageHelper.translate('ERR_AMOUNTS_NO_PACKAGE'));
      }
    }

    RecrasCSSHelper.loadCSS('global');
    RecrasCSSHelper.loadCSS('booking');
    RecrasCSSHelper.loadCSS('pikaday');
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
    key: "amountsValid",
    value: function amountsValid(pack) {
      var hasAtLeastOneProduct = false;

      for (var _i2 = 0, _this$getLinesNoBooki2 = this.getLinesNoBookingSize(pack); _i2 < _this$getLinesNoBooki2.length; _i2++) {
        var line = _this$getLinesNoBooki2[_i2];
        var aantal = this.findElement("[data-package-id=\"".concat(line.id, "\"]")).value;

        if (aantal > 0) {
          hasAtLeastOneProduct = true;
        }

        if (aantal > 0 && aantal < line.aantal_personen) {
          return false;
        }

        if (line.max && aantal > line.max) {
          return false;
        }
      }

      if (this.shouldShowBookingSize(pack) && this.bookingSize() > 0) {
        if (this.bookingSize() < this.bookingSizeMinimum(pack) || this.bookingSize() > this.bookingSizeMaximum(pack)) {
          return false;
        }

        hasAtLeastOneProduct = true;
      }

      return hasAtLeastOneProduct;
    }
  }, {
    key: "appendHtml",
    value: function appendHtml(msg) {
      this.element.insertAdjacentHTML('beforeend', msg);
    }
  }, {
    key: "applyVoucher",
    value: function applyVoucher(packageID, voucherCode) {
      var _this2 = this;

      if (!voucherCode) {
        this.setDiscountStatus(this.languageHelper.translate('VOUCHER_EMPTY'));
        return Promise.resolve(false);
      }

      if (this.appliedVouchers[voucherCode]) {
        this.setDiscountStatus(this.languageHelper.translate('VOUCHER_ALREADY_APPLIED'));
        return Promise.resolve(false);
      }

      if (!this.selectedDate) {
        this.setDiscountStatus(this.languageHelper.translate('DATE_INVALID'));
        return Promise.resolve(false);
      }

      return this.postJson('onlineboeking/controleervoucher', {
        arrangement_id: packageID,
        datum: RecrasDateHelper.datePartOnly(this.selectedDate),
        producten: this.productCounts(),
        vouchers: [voucherCode]
      }).then(function (json) {
        var result = json[voucherCode];

        if (!result.valid) {
          return Promise.resolve(false);
        }

        _this2.appliedVouchers[voucherCode] = result.processed;

        _this2.showTotalPrice();

        return true;
      });
    }
  }, {
    key: "bookingSize",
    value: function bookingSize() {
      var bookingSizeEl = this.findElement('.bookingsize');

      if (!bookingSizeEl) {
        return 0;
      }

      var bookingSizeValue = parseInt(bookingSizeEl.value, 10);

      if (isNaN(bookingSizeValue)) {
        return 0;
      }

      return bookingSizeValue;
    }
  }, {
    key: "bookingSizeLines",
    value: function bookingSizeLines(pack) {
      return pack.regels.filter(function (line) {
        return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
      });
    }
  }, {
    key: "bookingSizeMaximum",
    value: function bookingSizeMaximum(pack) {
      var lines = this.bookingSizeLines(pack).filter(function (line) {
        return line.max;
      });

      if (lines.length === 0) {
        return this.RECRAS_INFINITY;
      }

      var maxes = lines.map(function (line) {
        return line.max;
      });
      return Math.min.apply(Math, _toConsumableArray(maxes));
    }
  }, {
    key: "bookingSizeLineMinimum",
    value: function bookingSizeLineMinimum(line) {
      if (line.onlineboeking_aantalbepalingsmethode === 'vast') {
        return 0;
      }

      return line.product.minimum_aantal;
    }
  }, {
    key: "bookingSizeMinimum",
    value: function bookingSizeMinimum(pack) {
      var _this3 = this;

      var minSize = 0;
      this.bookingSizeLines(pack).forEach(function (line) {
        minSize = Math.max(minSize, _this3.bookingSizeLineMinimum(line));
      });
      return minSize;
    }
  }, {
    key: "amountFromPersons",
    value: function amountFromPersons(product, persons) {
      return persons; //TODO: this doesn't work yet because public product API does not send:
      // aantalbepaling, aantal, per_x_personen_afronding, per_x_personen

      if (product.aantalbepaling === 'vast') {
        return product.aantal;
      }

      var fn = product.per_x_personen_afronding === 'beneden' ? Math.floor : Math.ceil;
      return product.aantal * fn(persons / product.per_x_personen);
    }
  }, {
    key: "bookingSizePrice",
    value: function bookingSizePrice(pack) {
      var _this4 = this;

      var nrOfPersons = Math.max(pack.aantal_personen, 1);
      var price = 0;
      var lines = this.bookingSizeLines(pack);
      lines.forEach(function (line) {
        price += Math.max(_this4.amountFromPersons(line.product, nrOfPersons), line.product.minimum_aantal) * parseFloat(line.product.verkoop);
      });
      return price / nrOfPersons;
    }
  }, {
    key: "changePackage",
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
        this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_RESET);
        return false;
      } else {
        this.clearAllExceptPackageSelection();
        this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PACKAGE_CHANGED, selectedPackage[0].id);
      }

      this.selectedPackage = selectedPackage[0];
      this.showProducts(this.selectedPackage).then(function () {
        _this5.nextSectionActive('.recras-package-select', '.recras-amountsform');

        _this5.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PRODUCTS_SHOWN);

        if (_this5.options.getAutoScroll() === true) {
          var scrollOptions = {
            behavior: 'smooth'
          };

          if (!('scrollBehavior' in document.documentElement.style)) {
            scrollOptions = true;
          }

          _this5.findElement('.recras-amountsform').scrollIntoView(scrollOptions);
        }

        _this5.checkDependencies();

        _this5.loadingIndicatorShow(_this5.findElement('.recras-amountsform'));

        return _this5.showDateTimeSelection(_this5.selectedPackage);
      }).then(function () {
        _this5.loadingIndicatorHide();

        _this5.showContactForm(_this5.selectedPackage);
      });
    }
  }, {
    key: "checkBookingSize",
    value: function checkBookingSize(pack) {
      if (!this.shouldShowBookingSize(pack)) {
        return;
      }

      var bookingSize = this.bookingSize();
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
    key: "checkDependencies",
    value: function checkDependencies() {
      var _this6 = this;

      _toConsumableArray(this.findElements('.recras-product-dependency')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      _toConsumableArray(this.findElements('[data-package-id]')).forEach(function (el) {
        el.classList.remove('recras-input-invalid');
      });

      this.requiresProduct = false;
      this.productCounts().forEach(function (line) {
        if (line.aantal > 0) {
          var packageLineID = line.arrangementsregel_id;

          var product = _this6.findProduct(packageLineID).product;

          var thisProductRequiresProduct = false;

          if (!product.vereist_product) {
            console.warn('You are logged in to this particular Recras. Because of API differences between logged-in and logged-out state, required products do not work as expected.');
          } else {
            product.vereist_product.forEach(function (vp) {
              if (!_this6.dependencySatisfied(line.aantal, vp)) {
                thisProductRequiresProduct = true;
                _this6.requiresProduct = true;

                var requiredAmount = _this6.requiredAmount(line.aantal, vp);

                var requiredProductName = _this6.getProductByID(vp.vereist_product_id).weergavenaam;

                var message = _this6.languageHelper.translate('PRODUCT_REQUIRED', {
                  NUM: line.aantal,
                  PRODUCT: product.weergavenaam,
                  REQUIRED_AMOUNT: requiredAmount,
                  REQUIRED_PRODUCT: requiredProductName
                });

                _this6.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', "<span class=\"recras-product-dependency\">".concat(message, "</span>"));
              }
            });
          }

          if (thisProductRequiresProduct) {
            var productInput = _this6.findElement("[data-package-id=\"".concat(packageLineID, "\"]"));

            productInput.classList.add('recras-input-invalid');
          }
        }
      });
      this.maybeDisableBookButton();
    }
  }, {
    key: "checkDiscountAndVoucher",
    value: function checkDiscountAndVoucher() {
      var _this7 = this;

      var discountStatus, voucherStatus;
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
          var status;

          if (discountStatus) {
            status = 'DISCOUNT_APPLIED';
          } else {
            status = 'VOUCHER_APPLIED';
          }

          _this7.setDiscountStatus(_this7.languageHelper.translate(status), false);

          _this7.findElement('#discountcode').value = '';

          _this7.nextSectionActive('.recras-discounts', '.recras-contactform');
        } else {
          _this7.setDiscountStatus(_this7.languageHelper.translate('DISCOUNT_INVALID'));
        }
      });
    }
  }, {
    key: "checkDiscountcode",
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
    key: "checkMaximumForPackage",
    value: function checkMaximumForPackage() {
      var _this9 = this;

      var maxPerLine = this.selectedPackage.maximum_aantal_personen_online;

      if (maxPerLine === null) {
        return Promise.resolve(null);
      }

      var showWarning = false;
      var selectedProducts = this.productCounts();
      return this.languageHelper.filterTags(this.texts.maximum_aantal_online_boeking_overschreden, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
        selectedProducts.forEach(function (p) {
          if (p.aantal > maxPerLine && !showWarning) {
            var input = _this9.findElement("[data-package-id=\"".concat(p.arrangementsregel_id, "\"]"));

            if (!input) {
              input = _this9.findElement('#bookingsize');
            }

            if (input) {
              var warningEl = document.createElement('div');
              warningEl.classList.add('maximum-amount');
              warningEl.classList.add('recras-full-width');
              warningEl.innerHTML = msg;
              input.parentNode.parentNode.insertBefore(warningEl, input.parentNode.nextSibling);
              input.classList.add('recras-input-invalid');
            } else {
              _this9.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', "<span class=\"maximum-amount\">".concat(msg, "</span>"));
            }

            showWarning = true;
          }
        });
      });
    }
  }, {
    key: "contactFormValid",
    value: function contactFormValid() {
      var contactFormIsValid = this.findElement('.recras-contactform').checkValidity();
      var contactFormRequiredCheckboxes = this.contactForm.checkRequiredCheckboxes();
      return contactFormIsValid && contactFormRequiredCheckboxes;
    }
  }, {
    key: "setMinMaxAmountWarning",
    value: function setMinMaxAmountWarning(lineID, minAmount) {
      var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'minimum';
      var warnEl = document.createElement('span');
      warnEl.classList.add(type + '-amount');
      this.findElement("#".concat(lineID)).classList.add('recras-input-invalid');
      var text;

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
      var label = this.findElement("label[for=\"".concat(lineID, "\"]"));
      label.parentNode.appendChild(warnEl);
    }
  }, {
    key: "checkMinMaxAmounts",
    value: function checkMinMaxAmounts() {
      for (var _i4 = 0, _this$productCounts2 = this.productCounts(); _i4 < _this$productCounts2.length; _i4++) {
        var product = _this$productCounts2[_i4];

        if (product.aantal < 1) {
          continue;
        }

        var packageLineID = product.arrangementsregel_id;
        var packageLine = this.findProduct(packageLineID);
        var input = this.findElement("[data-package-id=\"".concat(packageLineID, "\"]"));

        if (!input) {
          // This is a "booking size" line - this is handled in checkBookingSize
          continue;
        }

        if (product.aantal < packageLine.product.minimum_aantal) {
          this.setMinMaxAmountWarning(input.id, packageLine.product.minimum_aantal);
        } else if (product.aantal > packageLine.max) {
          this.setMinMaxAmountWarning(input.id, packageLine.max, 'maximum');
        }
      }
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      this.clearElements(this.element.children);
    }
  }, {
    key: "clearAllExceptPackageSelection",
    value: function clearAllExceptPackageSelection() {
      var packageSelect = this.findElement('.recras-package-select');

      if (packageSelect) {
        packageSelect.classList.remove('recras-completed');
        packageSelect.classList.add('recras-active');
      }

      var elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-package-select)');
      this.clearElements(elements);
    }
  }, {
    key: "clearElements",
    value: function clearElements(elements) {
      if (this.datePicker) {
        this.datePicker.destroy();
      }

      this.availableDays = [];

      _toConsumableArray(elements).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      this.appendHtml("<div class=\"latestError\"></div>");
    }
  }, {
    key: "dependencySatisfied",
    value: function dependencySatisfied(hasNow, requiredProduct) {
      for (var _i6 = 0, _this$productCounts4 = this.productCounts(); _i6 < _this$productCounts4.length; _i6++) {
        var line = _this$productCounts4[_i6];

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
    key: "error",
    value: function error(msg) {
      this.loadingIndicatorHide();
      var bookingErrorsEl = this.findElement('#bookingErrors');

      if (bookingErrorsEl) {
        bookingErrorsEl.parentNode.appendChild(this.findElement('.latestError'));
      }

      this.findElement('.latestError').innerHTML = "<strong>".concat(this.languageHelper.translate('ERR_GENERAL'), "</strong><p>").concat(msg, "</p>");
    }
  }, {
    key: "findElement",
    value: function findElement(querystring) {
      return this.element.querySelector(querystring);
    }
  }, {
    key: "findElements",
    value: function findElements(querystring) {
      return this.element.querySelectorAll(querystring);
    }
  }, {
    key: "findProduct",
    value: function findProduct(packageLineID) {
      return this.selectedPackage.regels.filter(function (line) {
        return line.id === packageLineID;
      })[0];
    }
  }, {
    key: "formatPrice",
    value: function formatPrice(price) {
      return this.languageHelper.formatPrice(price);
    }
  }, {
    key: "getAvailableDays",
    value: function getAvailableDays(packageID, begin, end) {
      var _this10 = this;

      var postData = {
        arrangement_id: packageID,
        begin: RecrasDateHelper.datePartOnly(begin),
        eind: RecrasDateHelper.datePartOnly(end),
        producten: this.productCountsNoBookingSize()
      };

      if (this.shouldShowBookingSize(this.selectedPackage)) {
        postData.boekingsgrootte = this.bookingSize();
      }

      return this.postJson('onlineboeking/beschikbaredagen', postData).then(function (json) {
        _this10.availableDays = _this10.availableDays.concat(json);
        return _this10.availableDays;
      });
    }
  }, {
    key: "getAvailableTimes",
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
    key: "getContactForm",
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
    key: "getDiscountPrice",
    value: function getDiscountPrice(discount) {
      if (!discount) {
        return 0;
      }

      return discount.percentage / 100 * this.getSubTotal() * -1;
    }
  }, {
    key: "getLinesBookingSize",
    value: function getLinesBookingSize(pack) {
      return pack.regels.filter(function (line) {
        return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
      });
    }
  }, {
    key: "getLinesNoBookingSize",
    value: function getLinesNoBookingSize(pack) {
      return pack.regels.filter(function (line) {
        return line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte';
      });
    }
  }, {
    key: "getPackages",
    value: function getPackages() {
      var _this13 = this;

      return this.fetchJson(this.options.getApiBase() + 'arrangementen').then(function (json) {
        _this13.packages = json;
        return _this13.packages;
      });
    }
  }, {
    key: "getProductByID",
    value: function getProductByID(id) {
      var products = this.selectedPackage.regels.map(function (r) {
        return r.product;
      });
      return products.filter(function (p) {
        return p.id === id;
      })[0];
    }
  }, {
    key: "getSubTotal",
    value: function getSubTotal() {
      var _this14 = this;

      var total = 0;
      this.productCounts().forEach(function (line) {
        var product = _this14.findProduct(line.arrangementsregel_id).product;

        var aantal = line.aantal;

        if (isNaN(aantal)) {
          aantal = 0;
        }

        total += aantal * parseFloat(product.verkoop);
      });
      return total;
    }
  }, {
    key: "getTexts",
    value: function getTexts() {
      var _this15 = this;

      var settings = ['maximum_aantal_online_boeking_overschreden', 'online_boeking_betaalkeuze', 'online_boeking_betaalkeuze_achteraf_titel', 'online_boeking_betaalkeuze_ideal_titel', 'online_boeking_step0_text_pre', 'online_boeking_step0_text_post', 'online_boeking_step1_text_pre', 'online_boeking_step1_text_post', 'online_boeking_step3_text_post'];
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
    key: "getTotalPrice",
    value: function getTotalPrice() {
      var total = this.getSubTotal();
      total += this.getDiscountPrice(this.discount);
      total += this.getVouchersPrice();
      return total;
    }
  }, {
    key: "getVouchersPrice",
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
    key: "loadingIndicatorHide",
    value: function loadingIndicatorHide() {
      _toConsumableArray(document.querySelectorAll('.recrasLoadingIndicator')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });
    }
  }, {
    key: "loadingIndicatorShow",
    value: function loadingIndicatorShow(afterEl) {
      if (!afterEl) {
        return;
      }

      afterEl.insertAdjacentHTML('beforeend', "<span class=\"recrasLoadingIndicator\">".concat(this.languageHelper.translate('LOADING'), "</span>"));
    }
  }, {
    key: "maybeDisableBookButton",
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

      if (!this.contactFormValid()) {
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
        this.findElement('#bookingErrors').innerHTML = "<ul><li>".concat(reasonsList, "</ul>");
        button.setAttribute('disabled', 'disabled');
      } else {
        this.findElement('#bookingErrors').innerHTML = '';
        button.removeAttribute('disabled');
      }
    }
  }, {
    key: "nextSectionActive",
    value: function nextSectionActive(completedQuery, activeQuery) {
      if (completedQuery && this.findElement(completedQuery)) {
        this.findElement(completedQuery).classList.add('recras-completed');
        this.findElement(completedQuery).classList.remove('recras-active');
      } //TODO: remove active from all sections? Test with invalid amount


      if (activeQuery && this.findElement(activeQuery)) {
        this.findElement(activeQuery).classList.add('recras-active');
      }
    }
  }, {
    key: "normaliseDate",
    value: function normaliseDate(date, packageStart, bookingStart) {
      var diffSeconds = (date - packageStart) / 1000;
      var tempDate = new Date(bookingStart.getTime());
      return new Date(tempDate.setSeconds(tempDate.getSeconds() + diffSeconds));
    }
  }, {
    key: "paymentMethods",
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
    key: "preFillAmounts",
    value: function preFillAmounts(amounts) {
      var _this17 = this;

      _objectEntries(amounts).forEach(function (idAmount) {
        var el;

        if (idAmount[0] === 'bookingsize') {
          el = _this17.findElement('#bookingsize');
        } else {
          el = _this17.findElement("[data-package-id=\"".concat(idAmount[0], "\"]"));
        }

        if (el) {
          el.value = idAmount[1];

          _this17.updateProductPrice(el);
        }
      });

      this.updateProductAmounts();
    }
  }, {
    key: "previewTimes",
    value: function previewTimes() {
      var _this18 = this;

      _toConsumableArray(this.findElements('.time-preview')).forEach(function (el) {
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

        var linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
        linesNoBookingSize.forEach(function (line, idx) {
          if (line.begin !== null || line.eind !== null) {
            var normalisedStart = _this18.normaliseDate(new Date(line.begin), packageStart, _this18.selectedDate);

            var normalisedEnd = _this18.normaliseDate(new Date(line.eind), packageStart, _this18.selectedDate);

            _this18.findElement("label[for=\"packageline".concat(idx, "\"]")).insertAdjacentHTML('afterbegin', "<span class=\"time-preview\">".concat(RecrasDateHelper.timePartOnly(normalisedStart), " \u2013 ").concat(RecrasDateHelper.timePartOnly(normalisedEnd), "</span>"));
          }
        });
      }
    }
  }, {
    key: "productCountsBookingSize",
    value: function productCountsBookingSize() {
      var _this19 = this;

      return this.getLinesBookingSize(this.selectedPackage).map(function (line) {
        return {
          aantal: _this19.bookingSize(),
          arrangementsregel_id: line.id
        };
      });
    }
  }, {
    key: "productCountsNoBookingSize",
    value: function productCountsNoBookingSize() {
      return _toConsumableArray(this.findElements('[id^="packageline"]')).map(function (line) {
        return {
          aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
          arrangementsregel_id: parseInt(line.dataset.packageId, 10)
        };
      });
    }
  }, {
    key: "productCounts",
    value: function productCounts() {
      var counts = [];
      counts = counts.concat(this.productCountsNoBookingSize());
      counts = counts.concat(this.productCountsBookingSize());
      return counts;
    }
  }, {
    key: "removeWarnings",
    value: function removeWarnings() {
      _toConsumableArray(this.findElements('.minimum-amount')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      _toConsumableArray(this.findElements('.maximum-amount')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      _toConsumableArray(this.findElements('.recras-input-invalid')).forEach(function (el) {
        el.classList.remove('recras-input-invalid');
      });
    }
    /**
     * requiredAmount calculates the amount N needed of Y in the sentence 'product X requires N times product Y'
     * 
     * @param {number} hasNow The amount of product X selected
     * @param {object} requiredProduct 
     * @param {number} requiredProduct.aantal The base amount of Y required
     * @param {number} requiredProduct.per_x_aantal The quantum of X that will require product Y
     * @param {"boven"|"beneden"} requiredProduct.afronding Indication of how hasNow / per_x_aantal should be rounded ("boven" will round up, "beneden" will round down)
     * @return {number} The amount of product Y needed
     */

  }, {
    key: "requiredAmount",
    value: function requiredAmount(hasNow, requiredProduct) {
      var requiredFraction = hasNow / requiredProduct.per_x_aantal;

      if (requiredProduct.afronding === 'boven') {
        requiredFraction = Math.ceil(requiredFraction);
      } else {
        requiredFraction = Math.floor(requiredFraction);
      }

      return requiredProduct.aantal * requiredFraction;
    }
  }, {
    key: "resetForm",
    value: function resetForm() {
      this.changePackage(null);
    }
  }, {
    key: "selectSingleTime",
    value: function selectSingleTime() {
      if (this.findElements('#recras-onlinebooking-time option[value]').length !== 1) {
        return;
      }

      this.findElement('#recras-onlinebooking-time option[value]').selected = true;
      var event;

      try {
        event = new Event('change');
      } catch (e) {
        // IE
        event = document.createEvent('Event');
        event.initEvent('change', true, true);
      }

      this.findElement('#recras-onlinebooking-time').dispatchEvent(event);
    }
  }, {
    key: "setDiscountStatus",
    value: function setDiscountStatus(statusText) {
      var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var statusEl = this.findElement('.discount-status');

      if (!statusEl) {
        this.element.querySelector('.recras-discounts').insertAdjacentHTML('beforeend', "<span class=\"discount-status\"></span>");
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
    key: "setHtml",
    value: function setHtml(msg) {
      this.element.innerHTML = msg;
    }
  }, {
    key: "showStandardAttachments",
    value: function showStandardAttachments() {
      if (!this.selectedPackage || !this.findElement('.standard-attachments')) {
        return true;
      }

      var attachments = this.standardAttachments(this.selectedPackage);
      var attachmentHtml = "";

      if (Object.keys(attachments).length) {
        attachmentHtml += "<p><label><input type=\"checkbox\" id=\"recrasAgreeToAttachments\" required>".concat(this.languageHelper.translate('AGREE_ATTACHMENTS'), "</label></p>");
        attachmentHtml += "<ul>";

        _objectValues(attachments).forEach(function (attachment) {
          attachmentHtml += "<li><a href=\"".concat(attachment.filename, "\" download target=\"_blank\">").concat(attachment.naam, "</a></li>");
        });

        attachmentHtml += "</ul>";
      }

      this.findElement('.standard-attachments').innerHTML = attachmentHtml;
      var agreeEl = this.findElement('#recrasAgreeToAttachments');

      if (agreeEl) {
        agreeEl.addEventListener('change', this.maybeDisableBookButton.bind(this));
      }
    }
  }, {
    key: "showTotalPrice",
    value: function showTotalPrice() {
      _toConsumableArray(this.findElements('.discountLine, .voucherLine, .priceWithDiscount')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      var html = "";

      if (this.discount) {
        html += "<div class=\"discountLine\"><div>".concat(this.discount.naam, "</div><div>").concat(this.formatPrice(this.getDiscountPrice(this.discount)), "</div></div>");
      }

      if (Object.keys(this.appliedVouchers).length) {
        html += "<div class=\"voucherLine\"><div>".concat(this.languageHelper.translate('VOUCHERS_DISCOUNT'), "</div><div>").concat(this.formatPrice(this.getVouchersPrice()), "</div></div>");
      }

      if (this.discount || Object.keys(this.appliedVouchers).length) {
        html += "<div class=\"priceWithDiscount\"><div>".concat(this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT'), "</div><div>").concat(this.formatPrice(this.getTotalPrice()), "</div></div>");
      }

      var elementToInsertBefore = this.findElement('.recras-amountsform p:last-of-type');
      elementToInsertBefore.insertAdjacentHTML('beforebegin', html);
      this.findElement('.priceSubtotal').innerHTML = this.formatPrice(this.getSubTotal());
    }
  }, {
    key: "sortPackages",
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
    key: "shouldShowBookingSize",
    value: function shouldShowBookingSize(pack) {
      return this.bookingSizeLines(pack).length > 0;
    }
  }, {
    key: "showBookButton",
    value: function showBookButton() {
      var _this20 = this;

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
          paymentText = "<p>".concat(msgs[0], "</p>");
          paymentText += "<ul>\n                <li><label><input type=\"radio\" name=\"paymentMethod\" checked value=\"".concat(_this20.PAYMENT_DIRECT, "\"> ").concat(msgs[1], "</label>\n                <li><label><input type=\"radio\" name=\"paymentMethod\" value=\"").concat(_this20.PAYMENT_AFTERWARDS, "\"> ").concat(msgs[2], "</label>\n            </ul>");
        });
      } else {
        // One fixed choice
        promises.push(Promise.resolve(''));
      }

      promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step3_text_post, this.selectedPackage ? this.selectedPackage.id : null).then(function (msg) {
        textPostBooking = msg;
      }));
      Promise.all(promises).then(function () {
        var html = "<div class=\"recras-finalise\">\n            <p>".concat(textPostBooking, "</p>\n            <div class=\"standard-attachments\"></div>\n            ").concat(paymentText, "\n            <button type=\"submit\" class=\"bookPackage\" disabled>").concat(_this20.languageHelper.translate('BUTTON_BOOK_NOW'), "</button>\n            <div class=\"booking-error\" id=\"bookingErrors\"></div>\n        </div>");

        _this20.appendHtml(html);

        _this20.findElement('.bookPackage').addEventListener('click', _this20.submitBooking.bind(_this20));

        _this20.maybeDisableBookButton();
      });
    }
  }, {
    key: "showDiscountFields",
    value: function showDiscountFields() {
      var _this21 = this;

      var existingEl = this.findElement('.recras-discounts');

      if (existingEl) {
        existingEl.parentNode.removeChild(existingEl);
      }

      var html = "\n            <form class=\"recras-discounts\">\n                <div>\n                    <label for=\"discountcode\">".concat(this.languageHelper.translate('DISCOUNT_TITLE'), "</label>\n                    <input type=\"text\" id=\"discountcode\" class=\"discountcode\" maxlength=\"50\">\n                </div>\n                <button type=\"submit\" class=\"button-secondary\">").concat(this.languageHelper.translate('DISCOUNT_CHECK'), "</button>\n            </form>\n        ");
      this.findElement('.recras-datetime').insertAdjacentHTML('afterend', html);
      this.findElement('.recras-discounts').addEventListener('submit', function (e) {
        e.preventDefault();

        _this21.checkDiscountAndVoucher();

        return false;
      });
    }
  }, {
    key: "showContactForm",
    value: function showContactForm(pack) {
      var _this22 = this;

      this.loadingIndicatorShow(this.findElement('.recras-datetime'));
      this.getContactForm(pack).then(function (form) {
        return form.generateForm();
      }).then(function (html) {
        _this22.appendHtml(html);

        _this22.loadingIndicatorHide();

        _this22.showBookButton();

        _this22.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_CONTACT_FORM_SHOWN);

        _toConsumableArray(_this22.findElements('[name^="contactformulier"]')).forEach(function (el) {
          el.addEventListener('input', _this22.maybeDisableBookButton.bind(_this22));
          el.addEventListener('input', function () {
            if (_this22.contactFormValid()) {
              _this22.nextSectionActive('.recras-contactform', '.recras-finalise');
            }
          });
        });
      });
    }
  }, {
    key: "addDateTimeSelectionHtml",
    value: function addDateTimeSelectionHtml() {
      var today = RecrasDateHelper.datePartOnly(new Date());
      var html = "<form class=\"recras-datetime\">\n            <label for=\"recras-onlinebooking-date\">\n                ".concat(this.languageHelper.translate('DATE'), "\n            </label>\n            <input type=\"text\" id=\"recras-onlinebooking-date\" class=\"recras-onlinebooking-date\" min=\"").concat(today, "\" disabled autocomplete=\"off\">\n            <label for=\"recras-onlinebooking-time\">\n                ").concat(this.languageHelper.translate('TIME'), "\n            </label>\n            <select id=\"recras-onlinebooking-time\" class=\"recras-onlinebooking-time\" disabled autocomplete=\"off\"></select>\n        </form>");
      this.appendHtml(html);
    }
  }, {
    key: "showDateTimeSelection",
    value: function showDateTimeSelection(pack) {
      var _this23 = this;

      var startDate = new Date();
      var endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      return this.getAvailableDays(pack.id, startDate, endDate).then(function () {
        _this23.addDateTimeSelectionHtml();

        _this23.showDiscountFields();

        if (_this23.options.getPreFilledAmounts()) {
          _this23.preFillAmounts(_this23.options.getPreFilledAmounts());
        }

        var pikadayOptions = _extends(RecrasCalendarHelper.defaultOptions(), {
          disableDayFn: function disableDayFn(day) {
            var dateFmt = RecrasDateHelper.datePartOnly(day);
            return _this23.availableDays.indexOf(dateFmt) === -1;
          },
          field: _this23.findElement('.recras-onlinebooking-date'),
          i18n: RecrasCalendarHelper.i18n(_this23.languageHelper),
          onDraw: function onDraw(pika) {
            var lastMonthYear = pika.calendars[pika.calendars.length - 1];
            var lastDay = new Date(lastMonthYear.year, lastMonthYear.month, 31);

            var lastAvailableDay = _this23.availableDays.reduce(function (acc, curVal) {
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

            _this23.getAvailableDays(pack.id, lastAvailableDay, newEndDate);
          },
          onSelect: function onSelect(date) {
            _this23.loadingIndicatorShow(_this23.findElement('label[for="recras-onlinebooking-time"]'));

            _this23.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_DATE_SELECTED);

            _this23.selectedDate = date;

            _this23.getAvailableTimes(pack.id, date).then(function (times) {
              times = times.map(function (time) {
                return RecrasDateHelper.timePartOnly(new Date(time));
              });

              _this23.showTimes(times);

              _this23.loadingIndicatorHide();

              _this23.selectSingleTime();
            });

            _this23.maybeDisableBookButton();
          }
        });

        _this23.datePicker = new Pikaday(pikadayOptions);

        _this23.findElement('.recras-onlinebooking-time').addEventListener('change', function () {
          _this23.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_TIME_SELECTED);

          _this23.selectedTime = _this23.findElement('.recras-onlinebooking-time').value;

          _this23.nextSectionActive('.recras-datetime', '.recras-discounts');

          _this23.nextSectionActive(null, '.recras-contactform');

          _this23.selectedDate = RecrasDateHelper.setTimeForDate(_this23.selectedDate, _this23.selectedTime);

          if (_this23.options.getPreviewTimes() === true) {
            _this23.previewTimes();
          }

          _this23.maybeDisableBookButton();
        });
      });
    }
  }, {
    key: "showPackages",
    value: function showPackages(packages) {
      var _this24 = this;

      packages = packages.filter(function (p) {
        return p.mag_online;
      });
      var packagesSorted = this.sortPackages(packages);
      var packageOptions = packagesSorted.map(function (pack) {
        return "<option value=\"".concat(pack.id, "\">").concat(pack.weergavenaam || pack.arrangement);
      });
      var html = '<select class="recras-package-selection"><option>' + packageOptions.join('') + '</select>';
      var promises = [];
      promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
      promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_post, this.selectedPackage ? this.selectedPackage.id : null));
      Promise.all(promises).then(function (msgs) {
        _this24.appendHtml("<div class=\"recras-package-select recras-active\"><p>".concat(msgs[0], "</p>").concat(html, "<p>\n").concat(msgs[1], "</p></div>"));

        _this24.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PACKAGES_SHOWN);

        var packageSelectEl = _this24.findElement('.recras-package-selection');

        packageSelectEl.addEventListener('change', function () {
          var selectedPackageId = parseInt(packageSelectEl.value, 10);

          _this24.changePackage(selectedPackageId);
        });
      });
    }
  }, {
    key: "showProducts",
    value: function showProducts(pack) {
      var _this25 = this;

      var promises = [];
      promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
      promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_post, this.selectedPackage ? this.selectedPackage.id : null));
      return Promise.all(promises).then(function (msgs) {
        var html = '<form class="recras-amountsform">';
        html += "<p>".concat(msgs[0], "</p>");
        html += "<div class=\"recras-heading\">\n                <div>&nbsp;</div>\n                <div>".concat(_this25.languageHelper.translate('HEADING_QUANTITY'), "</div>\n                <div class=\"recras-price\">").concat(_this25.languageHelper.translate('HEADING_PRICE'), "</div>\n            </div>");

        if (_this25.shouldShowBookingSize(pack)) {
          html += "<div>";
          html += "<div><label for=\"bookingsize\">".concat(pack.weergavenaam || pack.arrangement, "</label></div>");
          html += "<input type=\"number\" id=\"bookingsize\" class=\"bookingsize\" min=\"".concat(_this25.bookingSizeMinimum(pack), "\" max=\"").concat(_this25.bookingSizeMaximum(pack), "\" placeholder=\"0\" data-price=\"").concat(_this25.bookingSizePrice(pack), "\">");
          html += "<div class=\"recras-price recrasUnitPrice\">".concat(_this25.formatPrice(_this25.bookingSizePrice(pack)), "</div>");
          html += "</div>";
        }

        var linesNoBookingSize = _this25.getLinesNoBookingSize(pack);

        linesNoBookingSize.forEach(function (line, idx) {
          html += '<div><div>';
          html += "<label for=\"packageline".concat(idx, "\">").concat(line.beschrijving_templated, "</label>");
          var maxAttr = line.max ? "max=\"".concat(line.max, "\"") : '';
          html += "</div><input id=\"packageline".concat(idx, "\" type=\"number\" min=\"0\" ").concat(maxAttr, " placeholder=\"0\" data-package-id=\"").concat(line.id, "\" data-price=\"").concat(line.product.verkoop, "\">");
          html += "<div class=\"recras-price recrasUnitPrice\">".concat(_this25.formatPrice(line.product.verkoop), "</div>");
          html += '</div>';
        });
        html += "<div class=\"priceWithoutDiscount\">\n                <div>".concat(_this25.languageHelper.translate('PRICE_TOTAL'), "</div>\n                <div></div>\n                <div class=\"priceSubtotal\"></div>\n            </div>");
        html += "<p>".concat(msgs[1], "</p>");
        html += '</form>';

        _this25.appendHtml(html);

        _toConsumableArray(_this25.findElements('[id^="packageline"], .bookingsize')).forEach(function (el) {
          el.addEventListener('input', _this25.updateProductAmounts.bind(_this25));
          el.addEventListener('input', _this25.updateProductPrice.bind(_this25, el));
        });
      });
    }
  }, {
    key: "showTimes",
    value: function showTimes(times) {
      var html = "<option>";
      times.forEach(function (time) {
        html += "<option value=\"".concat(time, "\">").concat(time);
      });
      this.findElement('.recras-onlinebooking-time').innerHTML = html;
      this.findElement('.recras-onlinebooking-time').removeAttribute('disabled');
    }
  }, {
    key: "clearTimes",
    value: function clearTimes() {
      this.findElement('.recras-onlinebooking-time').innerHTML = '';
      this.findElement('.recras-onlinebooking-time').setAttribute('disabled', 'disabled');
    }
  }, {
    key: "standardAttachments",
    value: function standardAttachments() {
      var _this26 = this;

      var attachments = {};

      if (!this.selectedPackage.onlineboeking_standaardbijlagen_meesturen) {
        return attachments;
      }

      this.productCounts().forEach(function (line) {
        if (line.aantal > 0) {
          var product = _this26.findProduct(line.arrangementsregel_id).product;

          if (product.standaardbijlagen) {
            product.standaardbijlagen.forEach(function (attachment) {
              attachments[attachment.id] = attachment;
            });
          }
        }
      });
      return attachments;
    }
  }, {
    key: "submitBooking",
    value: function submitBooking() {
      var _this27 = this;

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

      var status = this.contactForm.checkRequiredCheckboxes();

      if (!status) {
        return false;
      }

      this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_BOOKING_SUBMITTED, this.selectedPackage.id);
      var paymentMethod = this.paymentMethods(this.selectedPackage)[0];
      var paymentMethodEl = this.findElement('[name="paymentMethod"]:checked');

      if (paymentMethodEl && this.validPaymentMethod(this.selectedPackage, paymentMethodEl.value)) {
        paymentMethod = paymentMethodEl.value;
      }

      this.loadingIndicatorHide();
      this.loadingIndicatorShow(this.findElement('.bookPackage'));
      var elem;

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
        _this27.loadingIndicatorHide();

        _this27.findElement('.bookPackage').removeAttribute('disabled'); //TODO: redirect for payment afterwards. This needs to be implemented in Recras first


        if (json.payment_url) {
          window.top.location.href = json.payment_url;
        } else if (json.message && json.status) {
          if (bookingParams.redirect_url) {
            _this27.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_REDIRECT_PAYMENT);

            window.top.location.href = bookingParams.redirect_url;
          } else {
            _this27.findElement('.recras-amountsform').reset();

            _this27.findElement('.recras-datetime').reset();

            _this27.findElement('.recras-contactform').reset();

            window.alert(json.message);
          }
        } else {
          console.log(json);
        }
      });
    }
  }, {
    key: "updateProductAmounts",
    value: function updateProductAmounts() {
      this.loadingIndicatorHide();
      this.availableDays = [];
      this.removeWarnings();
      this.checkDependencies();
      this.checkMinMaxAmounts();
      var maxPromise = this.checkMaximumForPackage();
      this.checkBookingSize(this.selectedPackage);
      this.showTotalPrice();
      this.showStandardAttachments();
      var datePickerEl = this.findElement('.recras-onlinebooking-date');
      var thisClass = this;
      maxPromise.then(function () {
        var amountErrors = thisClass.findElements('.minimum-amount, .maximum-amount, .recras-product-dependency');

        if (amountErrors.length > 0) {
          thisClass.nextSectionActive(null, '.recras-amountsform');
          datePickerEl.setAttribute('disabled', 'disabled');
          return;
        }

        thisClass.nextSectionActive('.recras-amountsform', '.recras-datetime');
        thisClass.loadingIndicatorShow(thisClass.findElement('label[for="recras-onlinebooking-date"]'));
        var startDate = new Date();
        var endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        thisClass.getAvailableDays(thisClass.selectedPackage.id, startDate, endDate).then(function (availableDays) {
          thisClass.loadingIndicatorHide();

          if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
            datePickerEl.value = '';
            thisClass.clearTimes();
          } else {
            datePickerEl.removeAttribute('disabled');
          }
        });
      });
    }
  }, {
    key: "updateProductPrice",
    value: function updateProductPrice(el) {
      var priceEl = el.parentNode.querySelector('.recras-price');
      var amount = parseInt(el.value, 10);

      if (isNaN(amount)) {
        amount = 0;
      }

      if (amount > 0) {
        priceEl.classList.remove('recrasUnitPrice');
      } else {
        priceEl.classList.add('recrasUnitPrice');
      }

      amount = Math.max(amount, 1);
      priceEl.innerHTML = this.formatPrice(amount * el.dataset.price);
    }
  }, {
    key: "validPaymentMethod",
    value: function validPaymentMethod(pack, method) {
      return this.paymentMethods(pack).indexOf(method) > -1;
    }
  }]);

  return RecrasBooking;
}();

var RecrasCalendarHelper =
/*#__PURE__*/
function () {
  function RecrasCalendarHelper() {
    _classCallCheck(this, RecrasCalendarHelper);
  }

  _createClass(RecrasCalendarHelper, null, [{
    key: "defaultOptions",
    value: function defaultOptions() {
      return {
        firstDay: 1,
        // Monday
        minDate: new Date(),
        numberOfMonths: 2,
        reposition: false,
        toString: function toString(date) {
          return RecrasDateHelper.toString(date);
        }
      };
    }
  }, {
    key: "i18n",
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
    key: "loadScript",
    value: function loadScript() {
      return new Promise(function (resolve, reject) {
        var scriptID = 'recrasPikaday'; // Only load script once

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

var RecrasContactForm =
/*#__PURE__*/
function () {
  function RecrasContactForm() {
    var _this28 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RecrasContactForm);

    this.datePicker = null;
    this.languageHelper = new RecrasLanguageHelper();

    if (!(options instanceof RecrasOptions)) {
      throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
    }

    this.options = options;

    if (!this.options.getFormId()) {
      throw new Error(this.languageHelper.translate('ERR_NO_FORM'));
    }

    this.eventHelper = new RecrasEventHelper();
    this.eventHelper.setEvents(this.options.getAnalyticsEvents());
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

    RecrasCSSHelper.loadCSS('global');
    this.GENDERS = {
      onbekend: 'GENDER_UNKNOWN',
      man: 'GENDER_MALE',
      vrouw: 'GENDER_FEMALE'
    }; // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control

    this.AUTOCOMPLETE_OPTIONS = {
      'contact.naam': 'organization',
      'contact.website': 'url',
      'contactpersoon.achternaam': 'family-name',
      'contactpersoon.adres': 'address-line1',
      'contactpersoon.plaats': 'address-level2',
      'contactpersoon.postcode': 'postal-code',
      'contactpersoon.voornaam': 'given-name'
    };
  }

  _createClass(RecrasContactForm, [{
    key: "checkRequiredCheckboxes",
    value: function checkRequiredCheckboxes() {
      var _this29 = this;

      this.removeWarnings();
      var isOkay = true;

      _toConsumableArray(this.findElements('.checkboxGroupRequired')).forEach(function (group) {
        var checked = group.querySelectorAll('input:checked');

        if (checked.length === 0) {
          group.parentNode.querySelector('label').insertAdjacentHTML('beforeend', "<div class=\"recrasError\">".concat(_this29.languageHelper.translate('CONTACT_FORM_CHECKBOX_REQUIRED'), "</div>"));
          isOkay = false;
        }

        _toConsumableArray(group.querySelectorAll('input')).forEach(function (el) {
          el.addEventListener('change', _this29.checkRequiredCheckboxes.bind(_this29));
        });
      });

      return isOkay;
    }
  }, {
    key: "appendHtml",
    value: function appendHtml(msg) {
      this.element.insertAdjacentHTML('beforeend', msg);
    }
  }, {
    key: "error",
    value: function error(msg) {
      console.log('Error', msg); //TODO
    }
  }, {
    key: "findElement",
    value: function findElement(querystring) {
      return this.element.querySelector(querystring);
    }
  }, {
    key: "findElements",
    value: function findElements(querystring) {
      return this.element.querySelectorAll(querystring);
    }
  }, {
    key: "generateForm",
    value: function generateForm() {
      var _this30 = this;

      var extraOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var waitFor = [];

      if (this.hasCountryField()) {
        waitFor.push(this.getCountryList());
      }

      if (this.hasDateField()) {
        waitFor.push(RecrasCalendarHelper.loadScript());
        RecrasCSSHelper.loadCSS('pikaday');
      }

      return Promise.all(waitFor).then(function () {
        var html = '<form class="recras-contactform">';

        if (extraOptions.voucherQuantitySelector) {
          html += _this30.quantitySelector();
        }

        _this30.contactFormFields.forEach(function (field, idx) {
          html += '<div>' + _this30.showField(field, idx) + '</div>';
        });

        if (extraOptions.showSubmit) {
          html += _this30.submitButtonHtml();
        }

        html += '</form>';
        return html;
      });
    }
  }, {
    key: "generateJson",
    value: function generateJson() {
      var formEl = this.options.getElement().querySelector('.recras-contactform');
      var elements = formEl.querySelectorAll('[id^="contactformulier-"], input[type="radio"]:checked');
      var contactForm = {};

      _toConsumableArray(elements).forEach(function (field) {
        contactForm[field.dataset.identifier] = field.value;
      });

      _toConsumableArray(formEl.querySelectorAll('input[type="checkbox"]:checked')).forEach(function (field) {
        if (contactForm[field.dataset.identifier] === undefined) {
          contactForm[field.dataset.identifier] = [];
        }

        contactForm[field.dataset.identifier].push(field.value);
      });

      if (contactForm['boeking.datum']) {
        contactForm['boeking.datum'] = RecrasDateHelper.formatStringForAPI(contactForm['boeking.datum']);
      }

      return contactForm;
    }
  }, {
    key: "getContactFormFields",
    value: function getContactFormFields() {
      var _this31 = this;

      return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + this.options.getFormId() + '?embed=Velden').then(function (form) {
        _this31.contactFormFields = form.Velden;
        _this31.packages = _this31.sortPackages(form.Arrangementen);
        return _this31.contactFormFields;
      });
    }
  }, {
    key: "getCountryList",
    value: function getCountryList() {
      var _this32 = this;

      return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + this.languageHelper.locale + '/country.json').then(function (json) {
        _this32.countries = json;
        return _this32.countries;
      });
    }
  }, {
    key: "sortPackages",
    value: function sortPackages(packs) {
      return packs.sort(function (a, b) {
        // Prioritise package name
        if (a.arrangement < b.arrangement) {
          return -1;
        }

        if (a.arrangement > b.arrangement) {
          return 1;
        } // Sort by ID in the off chance that two packages are named the same


        if (a.id < b.id) {
          return -1;
        }

        if (a.id > b.id) {
          return 1;
        } // This cannot happen


        return 0;
      });
    }
  }, {
    key: "hasFieldOfType",
    value: function hasFieldOfType(identifier) {
      return this.contactFormFields.filter(function (field) {
        return field.field_identifier === identifier;
      }).length > 0;
    }
  }, {
    key: "hasDateField",
    value: function hasDateField() {
      return this.hasFieldOfType('boeking.datum');
    }
  }, {
    key: "hasCountryField",
    value: function hasCountryField() {
      return this.hasFieldOfType('contact.landcode');
    }
  }, {
    key: "hasPackageField",
    value: function hasPackageField() {
      return this.hasFieldOfType('boeking.arrangement');
    }
  }, {
    key: "loadingIndicatorHide",
    value: function loadingIndicatorHide() {
      _toConsumableArray(document.querySelectorAll('.recrasLoadingIndicator')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });
    }
  }, {
    key: "loadingIndicatorShow",
    value: function loadingIndicatorShow(afterEl) {
      if (!afterEl) {
        return;
      }

      afterEl.insertAdjacentHTML('beforeend', "<span class=\"recrasLoadingIndicator\">".concat(this.languageHelper.translate('LOADING'), "</span>"));
    }
  }, {
    key: "quantitySelector",
    value: function quantitySelector() {
      return "<div><label for=\"number-of-vouchers\">".concat(this.languageHelper.translate('VOUCHER_QUANTITY'), "</label><input type=\"number\" id=\"number-of-vouchers\" class=\"number-of-vouchers\" min=\"1\" value=\"1\" required></div>");
    }
  }, {
    key: "removeWarnings",
    value: function removeWarnings() {
      _toConsumableArray(this.findElements('.recrasError')).forEach(function (el) {
        el.parentNode.removeChild(el);
      });
    }
  }, {
    key: "showField",
    value: function showField(field, idx) {
      var _this33 = this;

      if (field.soort_invoer === 'header') {
        return "<h3>".concat(field.naam, "</h3>");
      }

      var today = RecrasDateHelper.toString(new Date());
      var timePattern = '(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9])';
      var label = this.showLabel(field, idx);
      var attrRequired = field.verplicht ? 'required' : '';
      var classes;
      var html;
      var placeholder;
      var fixedAttributes = "id=\"contactformulier-".concat(idx, "\" name=\"contactformulier").concat(idx, "\" ").concat(attrRequired, " data-identifier=\"").concat(field.field_identifier, "\"");

      switch (field.soort_invoer) {
        case 'contactpersoon.geslacht':
          html = "<select ".concat(fixedAttributes, " autocomplete=\"sex\">");
          Object.keys(this.GENDERS).forEach(function (key) {
            html += "<option value=\"".concat(key, "\">").concat(_this33.languageHelper.translate(_this33.GENDERS[key]));
          });
          html += '</select>';
          return label + html;

        case 'keuze':
          classes = ['checkboxGroup'];

          if (field.verplicht) {
            classes.push('checkboxGroupRequired');
          }

          html = "<div class=\"".concat(classes.join(' '), "\">");
          field.mogelijke_keuzes.forEach(function (choice) {
            html += "<label><input type=\"checkbox\" name=\"contactformulier".concat(idx, "\" value=\"").concat(choice, "\" data-identifier=\"").concat(field.field_identifier, "\">").concat(choice, "</label>");
          });
          html += '</div>';
          return label + html;

        case 'keuze_enkel':
        case 'contact.soort_klant':
          html = "<div class=\"radioGroup\">";
          field.mogelijke_keuzes.forEach(function (choice) {
            html += "<label><input type=\"radio\" name=\"contactformulier".concat(idx, "\" value=\"").concat(choice, "\" ").concat(attrRequired, " data-identifier=\"").concat(field.field_identifier, "\">").concat(choice, "</label>");
          });
          html += "</div>";
          return label + html;

        case 'veel_tekst':
          return label + "<textarea ".concat(fixedAttributes, "></textarea>");

        case 'contactpersoon.telefoon1':
        case 'contactpersoon.telefoon2':
          return label + "<input type=\"tel\" ".concat(fixedAttributes, " autocomplete=\"tel\">");

        case 'contactpersoon.email1':
        case 'contactpersoon.email2':
          return label + "<input type=\"email\" ".concat(fixedAttributes, " autocomplete=\"email\">");

        case 'contactpersoon.nieuwsbrieven':
          classes = ['checkboxGroup'];

          if (field.verplicht) {
            classes.push('checkboxGroupRequired');
          }

          html = "<div class=\"".concat(classes.join(' '), "\">");
          Object.keys(field.newsletter_options).forEach(function (key) {
            html += "<label><input type=\"checkbox\" name=\"contactformulier".concat(idx, "\" value=\"").concat(key, "\" data-identifier=\"").concat(field.field_identifier, "\">").concat(field.newsletter_options[key], "</label>");
          });
          html += '</div>';
          return label + html;

        case 'contact.landcode':
          html = "<select ".concat(fixedAttributes, " autocomplete=\"country\">");
          Object.keys(this.countries).forEach(function (code) {
            var selectedText = code.toUpperCase() === _this33.languageHelper.getCountry() ? 'selected' : '';
            html += "<option value=\"".concat(code, "\" ").concat(selectedText, ">").concat(_this33.countries[code]);
          });
          html += '</select>';
          return label + html;

        case 'boeking.datum':
          placeholder = this.languageHelper.translate('DATE_FORMAT');
          return label + "<input type=\"text\" ".concat(fixedAttributes, " min=\"").concat(today, "\" placeholder=\"").concat(placeholder, "\" autocomplete=\"off\">");

        case 'boeking.groepsgrootte':
          return label + "<input type=\"number\" ".concat(fixedAttributes, " min=\"1\">");

        case 'boeking.starttijd':
          placeholder = this.languageHelper.translate('TIME_FORMAT');
          return label + "<input type=\"time\" ".concat(fixedAttributes, " placeholder=\"").concat(placeholder, "\" pattern=\"").concat(timePattern, "\" step=\"300\">");

        case 'boeking.arrangement':
          var preFilledPackage = this.options.getPackageId();

          if (field.verplicht && this.packages.length === 1) {
            var pack = this.packages[0];
            html = "<select ".concat(fixedAttributes, ">\n                        <option value=\"").concat(pack.id, "\" selected>").concat(pack.arrangement, "\n                    </select>");
            return label + html;
          }

          html = "<select ".concat(fixedAttributes, ">");
          html += "<option value=\"\">";
          this.packages.forEach(function (pack) {
            var selText = preFilledPackage && preFilledPackage === pack.id ? 'selected' : '';
            html += "<option value=\"".concat(pack.id, "\" ").concat(selText, ">").concat(pack.arrangement);
          });
          html += '</select>';
          return label + html;

        case 'contact.website': //TODO: type=url ?

        default:
          var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
          return label + "<input type=\"text\" ".concat(fixedAttributes, " autocomplete=\"").concat(autocomplete, "\">");
      }
    }
  }, {
    key: "showForm",
    value: function showForm() {
      var _this34 = this;

      this.loadingIndicatorShow(this.element);
      return this.getContactFormFields().then(function () {
        return _this34.generateForm({
          showSubmit: true
        });
      }).then(function (html) {
        _this34.appendHtml(html);

        _this34.findElement('.recras-contactform').addEventListener('submit', _this34.submitForm.bind(_this34));

        if (_this34.hasDateField()) {
          var pikadayOptions = _extends(RecrasCalendarHelper.defaultOptions(), {
            field: _this34.findElement('[data-identifier="boeking.datum"]'),
            i18n: RecrasCalendarHelper.i18n(_this34.languageHelper),
            numberOfMonths: 1
          });

          _this34.datePicker = new Pikaday(pikadayOptions);
        }

        _this34.loadingIndicatorHide();
      });
    }
  }, {
    key: "showLabel",
    value: function showLabel(field, idx) {
      var labelText = field.naam;

      if (field.verplicht) {
        labelText += "<span class=\"recras-contactform-required\" title=\"".concat(this.languageHelper.translate('ATTR_REQUIRED'), "\"></span>");
      }

      return "<label for=\"contactformulier-".concat(idx, "\">").concat(labelText, "</label>");
    }
  }, {
    key: "submitButtonHtml",
    value: function submitButtonHtml() {
      return "<button type=\"submit\" class=\"submitForm\">".concat(this.languageHelper.translate('BUTTON_SUBMIT_CONTACT_FORM'), "</button>");
    }
  }, {
    key: "submitForm",
    value: function submitForm(e) {
      var _this35 = this;

      e.preventDefault();
      this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_CONTACT_FORM, RecrasEventHelper.EVENT_CONTACT_FORM_SUBMIT, this.options.getFormId());
      var submitButton = this.findElement('.submitForm');
      var status = this.checkRequiredCheckboxes();

      if (!status) {
        return false;
      }

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

var RecrasCSSHelper =
/*#__PURE__*/
function () {
  function RecrasCSSHelper() {
    _classCallCheck(this, RecrasCSSHelper);
  }

  _createClass(RecrasCSSHelper, null, [{
    key: "cssBooking",
    value: function cssBooking() {
      return "\n.recras-onlinebooking {\n    max-width: 800px;\n}\n.recras-onlinebooking > *:not(:first-child) + * {\n    border-top: 2px solid #dedede; /* Any love for Kirby out there? */\n}\n.recras-amountsform > div {\n    display: -ms-grid;\n    display: grid;\n    -ms-grid-columns: 1fr 5em 7em;\n    grid-template-columns: 1fr 5em 7em;\n}\n.recras-amountsform > div > div:first-child {\n    -ms-grid-column: 1;\n}\n.recras-amountsform > div > input {\n    -ms-grid-column: 2;\n}\n.recras-amountsform > div > div:last-child {\n    -ms-grid-column: 3;\n}\n.recras-input-invalid {\n    border: 1px solid hsl(0, 50%, 50%);\n}\n.booking-error, .minimum-amount {\n    color: hsl(0, 50%, 50%);\n}\n.minimum-amount {\n    padding-left: 0.5em;\n}\n.recras-datetime {\n    display: -ms-grid;\n    display: grid;\n    -ms-grid-columns: 30% 70%;\n    grid-template-columns: 30% 70%;\n}\n.recras-datetime > * {\n    margin: 0.25em 0;\n}\n.recras-datetime label {\n    display: block;\n    -ms-grid-column: 1;\n}\n.recras-datetime input, .recras-datetime select {\n    max-width: 12em;\n    -ms-grid-column: 2;\n}\n.recras-datetime > :nth-child(-n + 2) {\n    -ms-grid-row: 1;\n}\n.recras-datetime > :nth-last-child(-n + 2) {\n    -ms-grid-row: 2;\n}\n.time-preview {\n    padding-right: 0.5em;\n}\n.recrasUnitPrice {\n    opacity: 0.5;\n}\n";
    }
  }, {
    key: "cssGlobal",
    value: function cssGlobal() {
      return "\n.latestError, .recrasError {\n    color: hsl(0, 50%, 50%);\n}\n.recras-onlinebooking > *:not(.latestError):not(.recrasLoadingIndicator) {\n    padding: 1em 0;\n}\n.recras-datetime, .recras-discounts > div, .recras-contactform > div {\n    display: -ms-grid;\n    display: grid;\n    -ms-grid-columns: 1fr 12em;\n    grid-template-columns: 1fr 12em;\n}\n.recras-contactform > div {\n    padding-bottom: 0.25em;\n    padding-top: 0.25em;\n}\n.recras-contactform label {\n    display: block;\n}\n.recras-contactform > div > :last-child {\n    -ms-grid-column: 2;\n}\n.recras-amountsform .recras-full-width {\n    display: block;\n}\n.recras-discounts > div > input {\n    -ms-grid-column: 2;\n}\n\n.recrasLoadingIndicator {\n    animation: recrasSpinner 1.1s infinite linear;\n    border: 0.2em solid rgba(0, 0, 0, 0.2);\n    border-left-color: rgba(0, 0, 0, 0.5);\n    border-radius: 50%;\n    display: inline-block;\n    height: 2em;\n    overflow: hidden;\n    text-indent: -100vw;\n    width: 2em;\n}\n@keyframes recrasSpinner {\n    0% {\n        transform: rotate(0deg);\n    }\n    100% {\n        transform: rotate(360deg);\n    }\n}\nbutton .recrasLoadingIndicator, label .recrasLoadingIndicator {\n    height: 1em;\n    vertical-align: middle;\n    width: 1em;\n}\nbutton .recrasLoadingIndicator {\n    margin-left: 0.5em;\n}\n.bookPackage, .submitForm, .buyTemplate {\n    font: inherit;\n    font-weight: bold;\n    padding: 0.5em 2em;\n}\n";
    }
  }, {
    key: "insertIntoHead",
    value: function insertIntoHead(el) {
      document.head.insertAdjacentElement('afterbegin', el);
    }
  }, {
    key: "loadInlineCss",
    value: function loadInlineCss(cssName, inlineCss) {
      var styleEl = document.createElement('style');
      styleEl.id = 'recras-css-' + cssName;
      styleEl.innerHTML = inlineCss;
      RecrasCSSHelper.insertIntoHead(styleEl);
    }
  }, {
    key: "loadExternalCss",
    value: function loadExternalCss(cssName, url) {
      var linkEl = document.createElement('link');
      linkEl.id = 'recras-css-' + cssName;
      linkEl.setAttribute('rel', 'stylesheet');
      linkEl.setAttribute('type', 'text/css');
      linkEl.setAttribute('href', url);
      RecrasCSSHelper.insertIntoHead(linkEl);
    }
  }, {
    key: "loadCSS",
    value: function loadCSS(cssName) {
      var inlineCss;
      var url;

      switch (cssName) {
        case 'booking':
          inlineCss = this.cssBooking();
          break;

        case 'global':
          inlineCss = this.cssGlobal();
          break;

        case 'pikaday':
          url = 'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/css/pikaday.min.css';
          break;

        default:
          console.warn('Unknown CSS');
          break;
      }

      if (document.getElementById('recras-css-' + cssName)) {
        return;
      }

      if (inlineCss) {
        RecrasCSSHelper.loadInlineCss(cssName, inlineCss);
      }

      if (url) {
        RecrasCSSHelper.loadExternalCss(cssName, url);
      }
    }
  }]);

  return RecrasCSSHelper;
}();

var RecrasDateHelper =
/*#__PURE__*/
function () {
  function RecrasDateHelper() {
    _classCallCheck(this, RecrasDateHelper);
  }

  _createClass(RecrasDateHelper, null, [{
    key: "clone",
    value: function clone(date) {
      return new Date(date.getTime());
    }
  }, {
    key: "datePartOnly",
    value: function datePartOnly(date) {
      var x = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000); // Fix off-by-1 errors

      return x.toISOString().substr(0, 10); // Format as 2018-03-13
    }
  }, {
    key: "formatStringForAPI",
    value: function formatStringForAPI(date) {
      // Handle DD-MM-YYYY pattern in code
      var datePatternDMY = '(0[1-9]|1[0-9]|2[0-9]|3[01])-(0[1-9]|1[012])-([0-9]{4})';
      var dmyMatches = date.match(datePatternDMY);

      if (dmyMatches) {
        return dmyMatches[3] + '-' + dmyMatches[2] + '-' + dmyMatches[1];
      } // Let API handle the rest. That way, the user will get an error if the input is invalid


      return date;
    }
  }, {
    key: "setTimeForDate",
    value: function setTimeForDate(date, timeStr) {
      date.setHours(timeStr.substr(0, 2), timeStr.substr(3, 2));
      return date;
    }
  }, {
    key: "timePartOnly",
    value: function timePartOnly(date) {
      return date.toTimeString().substr(0, 5); // Format at 09:00
    }
  }, {
    key: "toString",
    value: function toString(date) {
      var x = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000); // Fix off-by-1 errors

      x = x.toISOString();
      return x.substr(8, 2) + '-' + x.substr(5, 2) + '-' + x.substr(0, 4);
    }
  }]);

  return RecrasDateHelper;
}();

var RecrasEventHelper =
/*#__PURE__*/
function () {
  function RecrasEventHelper() {
    _classCallCheck(this, RecrasEventHelper);

    this.analyticsEnabled = false;
    this.eventsEnabled = RecrasEventHelper.allEvents();
  }

  _createClass(RecrasEventHelper, [{
    key: "eventEnabled",
    value: function eventEnabled(name) {
      return this.eventsEnabled.includes(name);
    }
  }, {
    key: "sendEvent",
    value: function sendEvent(cat, action) {
      var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      var event;

      try {
        event = new Event(RecrasEventHelper.PREFIX_GLOBAL + ':' + cat + ':' + action);
      } catch (e) {
        // IE
        event = document.createEvent('Event');
        event.initEvent(action, true, true);
      }

      if (this.analyticsEnabled && typeof window.ga === 'function' && this.eventEnabled(action)) {
        var eventData = {
          eventCategory: RecrasEventHelper.PREFIX_GLOBAL + ':' + cat,
          eventAction: action
        };

        if (value) {
          eventData.eventValue = value;
        }

        window.ga('send', 'event', eventData);
      }

      return document.dispatchEvent(event);
    }
  }, {
    key: "setAnalytics",
    value: function setAnalytics(bool) {
      this.analyticsEnabled = bool;
    }
  }, {
    key: "setEvents",
    value: function setEvents(events) {
      this.eventsEnabled = events;
    }
  }], [{
    key: "allEvents",
    value: function allEvents() {
      return [RecrasEventHelper.EVENT_BOOKING_BOOKING_SUBMITTED, RecrasEventHelper.EVENT_BOOKING_CONTACT_FORM_SHOWN, RecrasEventHelper.EVENT_BOOKING_DATE_SELECTED, RecrasEventHelper.EVENT_BOOKING_PACKAGE_CHANGED, RecrasEventHelper.EVENT_BOOKING_PACKAGES_SHOWN, RecrasEventHelper.EVENT_BOOKING_PRODUCTS_SHOWN, RecrasEventHelper.EVENT_BOOKING_REDIRECT_PAYMENT, RecrasEventHelper.EVENT_BOOKING_RESET, RecrasEventHelper.EVENT_BOOKING_TIME_SELECTED, RecrasEventHelper.EVENT_CONTACT_FORM_SUBMIT, RecrasEventHelper.EVENT_VOUCHER_REDIRECT_PAYMENT, RecrasEventHelper.EVENT_VOUCHER_TEMPLATE_CHANGED, RecrasEventHelper.EVENT_VOUCHER_VOUCHER_SUBMITTED];
    }
  }]);

  return RecrasEventHelper;
}();

_defineProperty(RecrasEventHelper, "PREFIX_GLOBAL", 'Recras');

_defineProperty(RecrasEventHelper, "PREFIX_BOOKING", 'Booking');

_defineProperty(RecrasEventHelper, "PREFIX_CONTACT_FORM", 'ContactForm');

_defineProperty(RecrasEventHelper, "PREFIX_VOUCHER", 'Voucher');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_BOOKING_SUBMITTED", 'BuyInProgress');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_CONTACT_FORM_SHOWN", 'ContactFormShown');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_DATE_SELECTED", 'DateSelected');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_PACKAGE_CHANGED", 'PackageChanged');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_PACKAGES_SHOWN", 'PackagesShown');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_PRODUCTS_SHOWN", 'ProductsShown');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_REDIRECT_PAYMENT", 'RedirectToPayment');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_RESET", 'Reset');

_defineProperty(RecrasEventHelper, "EVENT_BOOKING_TIME_SELECTED", 'TimeSelected');

_defineProperty(RecrasEventHelper, "EVENT_CONTACT_FORM_SUBMIT", 'Submit');

_defineProperty(RecrasEventHelper, "EVENT_VOUCHER_REDIRECT_PAYMENT", 'RedirectToPayment');

_defineProperty(RecrasEventHelper, "EVENT_VOUCHER_TEMPLATE_CHANGED", 'TemplateChanged');

_defineProperty(RecrasEventHelper, "EVENT_VOUCHER_VOUCHER_SUBMITTED", 'BuyInProgress');

var RecrasHttpHelper =
/*#__PURE__*/
function () {
  function RecrasHttpHelper() {
    _classCallCheck(this, RecrasHttpHelper);
  }

  _createClass(RecrasHttpHelper, null, [{
    key: "call",
    value: function call(url, data, errorHandler) {
      if (!url) {
        throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
      }

      var lastResponse;
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
      })["catch"](function (err) {
        errorHandler(err);
      });
    }
  }, {
    key: "fetchJson",
    value: function fetchJson(url, errorHandler) {
      return this.call(url, {
        credentials: 'omit',
        method: 'get'
      }, errorHandler);
    }
  }, {
    key: "postJson",
    value: function postJson(url, data, errorHandler) {
      return this.call(url, {
        body: JSON.stringify(data),
        credentials: 'omit',
        method: 'post'
      }, errorHandler);
    }
  }]);

  return RecrasHttpHelper;
}();

var RecrasLanguageHelper =
/*#__PURE__*/
function () {
  function RecrasLanguageHelper() {
    _classCallCheck(this, RecrasLanguageHelper);

    this.defaultLocale = 'nl_NL';
    this.locale = this.defaultLocale;
    this.options = null; //TODO: what is the best way to handle multiple locales?

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
        CONTACT_FORM_CHECKBOX_REQUIRED: 'At least one option must be checked',
        CONTACT_FORM_SUBMIT_FAILED: 'The contact form could not be sent. Please try again later.',
        CONTACT_FORM_SUBMIT_SUCCESS: 'The contact form was sent successfully.',
        DATE: 'Datum',
        DATE_FORMAT: 'TT-MM-JJJJ',
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
        ERR_AMOUNTS_NO_PACKAGE: 'Option "productAmounts" is set, but "package_id" is not set',
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
        HEADING_PRICE: 'Preis',
        HEADING_QUANTITY: 'Anzahl',
        LOADING: 'Wird geladen...',
        NO_PRODUCTS: 'Kein Produkt ausgewählt',
        PRICE_TOTAL: 'Insgesamt',
        PRICE_TOTAL_WITH_DISCOUNT: 'Insgesamt inklusive Rabatt',
        PRODUCT_MAXIMUM: '(höchstens {MAXIMUM})',
        PRODUCT_MINIMUM: '(mindestens {MINIMUM})',
        PRODUCT_REQUIRED: '{NUM} {PRODUCT} benötigt {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} um auch gebucht zu werden.',
        TIME: 'Zeit',
        TIME_FORMAT: 'UU:MM',
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
        CONTACT_FORM_CHECKBOX_REQUIRED: 'At least one option must be checked',
        CONTACT_FORM_SUBMIT_FAILED: 'The contact form could not be sent. Please try again later.',
        CONTACT_FORM_SUBMIT_SUCCESS: 'The contact form was sent successfully.',
        DATE: 'Date',
        DATE_FORMAT: 'DD-MM-YYYY',
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
        ERR_AMOUNTS_NO_PACKAGE: 'Option "productAmounts" is set, but "package_id" is not set',
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
        HEADING_PRICE: 'Price',
        HEADING_QUANTITY: 'Quantity',
        LOADING: 'Loading...',
        NO_PRODUCTS: 'No product selected',
        PRICE_TOTAL: 'Total',
        PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
        PRODUCT_MAXIMUM: '(at most {MAXIMUM})',
        PRODUCT_MINIMUM: '(at least {MINIMUM})',
        PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
        TIME: 'Time',
        TIME_FORMAT: 'HH:MM',
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
        BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contactformulier is niet volledig ingevuld, of bevat ongeldige waardes',
        BOOKING_DISABLED_INVALID_DATE: 'Geen datum geselecteerd',
        BOOKING_DISABLED_INVALID_TIME: 'Geen tijd geselecteerd',
        BOOKING_DISABLED_REQUIRED_PRODUCT: 'Vereist product nog niet geselecteerd',
        BUTTON_BOOK_NOW: 'Nu boeken',
        BUTTON_BUY_NOW: 'Nu kopen',
        BUTTON_SUBMIT_CONTACT_FORM: 'Versturen',
        CONTACT_FORM_CHECKBOX_REQUIRED: 'Ten minste één optie moet aangevinkt worden',
        CONTACT_FORM_SUBMIT_FAILED: 'Het contactformulier kon niet worden verstuurd. Probeer het later nog eens.',
        CONTACT_FORM_SUBMIT_SUCCESS: 'Het contactformulier is succesvol verstuurd.',
        DATE: 'Datum',
        DATE_FORMAT: 'DD-MM-JJJJ',
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
        ERR_AMOUNTS_NO_PACKAGE: 'Optie "productAmounts" is ingesteld, maar "package_id" is niet ingesteld',
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
        HEADING_PRICE: 'Prijs',
        HEADING_QUANTITY: 'Aantal',
        LOADING: 'Laden...',
        NO_PRODUCTS: 'Geen product gekozen',
        PRICE_TOTAL: 'Totaal',
        PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
        PRODUCT_MAXIMUM: '(maximaal {MAXIMUM})',
        PRODUCT_MINIMUM: '(minimaal {MINIMUM})',
        PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
        TIME: 'Tijd',
        TIME_FORMAT: 'UU:MM',
        VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
        VOUCHER_APPLIED: 'Tegoedbon toegepast',
        VOUCHER_EMPTY: 'Lege tegoedbon',
        VOUCHER_QUANTITY: 'Aantal tegoedbonnen',
        VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)'
      }
    };
  }

  _createClass(RecrasLanguageHelper, [{
    key: "error",
    value: function error(msg) {
      console.log('Error', msg); //TODO
    }
  }, {
    key: "extractTags",
    value: function extractTags(msg) {
      var alphanumericWithUnderscore = '[a-zA-Z0-9_]';
      var regexPartMulticolumn = '((?:\\((?:\\w+)(?::[^)]*)?\\))*)';
      var regex = new RegExp('{' + alphanumericWithUnderscore + '+' + regexPartMulticolumn + '}', 'g');
      var tags = msg.match(regex);

      if (!Array.isArray(tags)) {
        return [];
      }

      return tags.map(function (tag) {
        return tag.substring(1, tag.length - 1);
      }); // Strip { and }
    }
  }, {
    key: "filterTags",
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
    key: "formatLocale",
    value: function formatLocale(what) {
      switch (what) {
        case 'currency':
          return this.locale.replace('_', '-').toUpperCase();

        default:
          return this.locale;
      }
    }
  }, {
    key: "formatPrice",
    value: function formatPrice(price) {
      return parseFloat(price).toLocaleString(this.formatLocale('currency'), {
        currency: this.currency,
        style: 'currency'
      });
    }
  }, {
    key: "getCountry",
    value: function getCountry() {
      return this.locale.substr(3, 2); // nl_NL -> NL
    }
  }, {
    key: "setCurrency",
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
    key: "setLocale",
    value: function setLocale(locale) {
      this.locale = locale;
    }
  }, {
    key: "setOptions",
    value: function setOptions(options) {
      this.options = options;
      return this.setCurrency();
    }
  }, {
    key: "translate",
    value: function translate(string) {
      var vars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var translated;

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
    key: "isValid",
    value: function isValid(locale) {
      return this.validLocales.indexOf(locale) > -1;
    }
  }]);

  return RecrasLanguageHelper;
}();

_defineProperty(RecrasLanguageHelper, "validLocales", ['de_DE', 'en_GB', 'nl_NL']);

var RecrasOptions =
/*#__PURE__*/
function () {
  function RecrasOptions(options) {
    _classCallCheck(this, RecrasOptions);

    this.languageHelper = new RecrasLanguageHelper();
    this.validate(options);
    this.options = this.setOptions(options);
  }

  _createClass(RecrasOptions, [{
    key: "getAnalyticsEvents",
    value: function getAnalyticsEvents() {
      if (!Array.isArray(this.options.analyticsEvents)) {
        this.options.analyticsEvents = RecrasEventHelper.allEvents();
      }

      this.options.analyticsEvents = this.options.analyticsEvents.filter(function (event) {
        var eventExists = RecrasEventHelper.allEvents().includes(event);

        if (!eventExists) {
          console.warn('Invalid event: ' + event);
        }

        return eventExists;
      });

      if (this.options.analyticsEvents.length === 0) {
        this.options.analyticsEvents = RecrasEventHelper.allEvents();
      }

      return this.options.analyticsEvents;
    }
  }, {
    key: "getAnalytics",
    value: function getAnalytics() {
      return this.options.analytics;
    }
  }, {
    key: "getApiBase",
    value: function getApiBase() {
      return this.getHostname() + '/api2/';
    }
  }, {
    key: "getAutoScroll",
    value: function getAutoScroll() {
      return this.options.autoScroll !== undefined ? this.options.autoScroll : true;
    }
  }, {
    key: "getElement",
    value: function getElement() {
      return this.options.element;
    }
  }, {
    key: "getFormId",
    value: function getFormId() {
      return this.options.form_id;
    }
  }, {
    key: "getHostname",
    value: function getHostname() {
      return this.options.hostname;
    }
  }, {
    key: "getLocale",
    value: function getLocale() {
      return this.options.locale;
    }
  }, {
    key: "getPackageId",
    value: function getPackageId() {
      return this.options.package_id;
    }
  }, {
    key: "getPreFilledAmounts",
    value: function getPreFilledAmounts() {
      return this.options.productAmounts;
    }
  }, {
    key: "getPreviewTimes",
    value: function getPreviewTimes() {
      return this.options.previewTimes !== undefined ? this.options.previewTimes : true;
    }
  }, {
    key: "getRedirectUrl",
    value: function getRedirectUrl() {
      return this.options.redirect_url;
    }
  }, {
    key: "getVoucherTemplateId",
    value: function getVoucherTemplateId() {
      return this.options.voucher_template_id;
    }
  }, {
    key: "setOption",
    value: function setOption(option, value) {
      this.options[option] = value;
    }
  }, {
    key: "setOptions",
    value: function setOptions(options) {
      var protocol = 'https';

      if (RecrasOptions.hostnamesDebug.includes(options.recras_hostname)) {
        protocol = 'http';
      }

      options.hostname = protocol + '://' + options.recras_hostname;
      return options;
    }
  }, {
    key: "validate",
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

      if (!hostnameRegex.test(options.recras_hostname) && !RecrasOptions.hostnamesDebug.includes(options.recras_hostname)) {
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

_defineProperty(RecrasOptions, "hostnamesDebug", ['172.16.0.2', // Local development
'nginx' // Docker Selenium tests
]);

var RecrasVoucher =
/*#__PURE__*/
function () {
  function RecrasVoucher() {
    var _this37 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RecrasVoucher);

    this.languageHelper = new RecrasLanguageHelper();

    if (options instanceof RecrasOptions === false) {
      throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
    }

    this.options = options;
    this.eventHelper = new RecrasEventHelper();
    this.eventHelper.setEvents(this.options.getAnalyticsEvents());
    this.element = this.options.getElement();
    this.element.classList.add('recras-buy-voucher');

    this.fetchJson = function (url) {
      return RecrasHttpHelper.fetchJson(url, _this37.error);
    };

    this.postJson = function (url, data) {
      return RecrasHttpHelper.postJson(_this37.options.getApiBase() + url, data, _this37.error);
    };

    RecrasCSSHelper.loadCSS('global');

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
    key: "appendHtml",
    value: function appendHtml(msg) {
      this.element.insertAdjacentHTML('beforeend', msg);
    }
  }, {
    key: "buyTemplate",
    value: function buyTemplate() {
      var _this38 = this;

      var status = this.contactForm.checkRequiredCheckboxes();

      if (!status) {
        return false;
      }

      this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_VOUCHER, RecrasEventHelper.EVENT_VOUCHER_VOUCHER_SUBMITTED, this.selectedTemplate.id);
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
          _this38.eventHelper.sendEvent(RecrasEventHelper.PREFIX_VOUCHER, RecrasEventHelper.EVENT_VOUCHER_REDIRECT_PAYMENT);

          window.top.location.href = json.payment_url;
        } else {
          console.log(json);
        }
      });
    }
  }, {
    key: "changeTemplate",
    value: function changeTemplate(templateID) {
      this.clearAllExceptTemplateSelection();
      this.showContactForm(templateID);
      this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_VOUCHER, RecrasEventHelper.EVENT_VOUCHER_TEMPLATE_CHANGED, templateID);
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      this.clearElements(this.element.children);
    }
  }, {
    key: "clearAllExceptTemplateSelection",
    value: function clearAllExceptTemplateSelection() {
      var elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-voucher-templates)');
      this.clearElements(elements);
    }
  }, {
    key: "clearElements",
    value: function clearElements(elements) {
      _toConsumableArray(elements).forEach(function (el) {
        el.parentNode.removeChild(el);
      });

      this.appendHtml("<div class=\"latestError\"></div>");
    }
  }, {
    key: "error",
    value: function error(msg) {
      this.findElement('.latestError').innerHTML = "<strong>".concat(this.languageHelper.translate('ERR_GENERAL'), "</strong><p>").concat(msg, "</p>");
    }
  }, {
    key: "findElement",
    value: function findElement(querystring) {
      return this.element.querySelector(querystring);
    }
  }, {
    key: "findElements",
    value: function findElements(querystring) {
      return this.element.querySelectorAll(querystring);
    }
  }, {
    key: "formatPrice",
    value: function formatPrice(price) {
      return this.languageHelper.formatPrice(price);
    }
  }, {
    key: "getContactForm",
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
    key: "getVoucherTemplates",
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
    key: "maybeDisableBuyButton",
    value: function maybeDisableBuyButton() {
      var button = this.findElement('.buyTemplate');

      if (!button) {
        return false;
      }

      var shouldDisable = false;

      if (!this.findElement('.recras-contactform').checkValidity() || !this.contactForm.checkRequiredCheckboxes()) {
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
    key: "showBuyButton",
    value: function showBuyButton() {
      var html = "<div><button type=\"submit\" class=\"buyTemplate\" disabled>".concat(this.languageHelper.translate('BUTTON_BUY_NOW'), "</button></div>");
      this.appendHtml(html);
      this.findElement('.buyTemplate').addEventListener('click', this.buyTemplate.bind(this));
    }
  }, {
    key: "showContactForm",
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

        _toConsumableArray(_this41.findElements('[name^="contactformulier"]')).forEach(function (el) {
          el.addEventListener('change', _this41.maybeDisableBuyButton.bind(_this41));
        });
      });
    }
  }, {
    key: "showTemplates",
    value: function showTemplates(templates) {
      var _this42 = this;

      var templateOptions = templates.map(function (template) {
        return "<option value=\"".concat(template.id, "\">").concat(template.name, " (").concat(_this42.formatPrice(template.price), ")");
      });
      var html = "<select class=\"recrasVoucherTemplates\"><option>".concat(templateOptions.join(''), "</select>");
      this.appendHtml("<div class=\"recras-voucher-templates\">".concat(html, "</div>"));
      var voucherSelectEl = this.findElement('.recrasVoucherTemplates');
      voucherSelectEl.addEventListener('change', function () {
        var selectedTemplateId = parseInt(voucherSelectEl.value, 10);

        _this42.changeTemplate(selectedTemplateId);
      });
    }
  }]);

  return RecrasVoucher;
}();