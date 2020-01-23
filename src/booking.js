/*******************************
*  Recras integration library  *
*  v 1.3.0                     *
*******************************/

class RecrasBooking {
    constructor(options = {}) {
        this.datePicker = null;

        this.PAYMENT_DIRECT = 'mollie';
        this.PAYMENT_AFTERWARDS = 'factuur';
        this.RECRAS_INFINITY = 99999; // This is used instead of "true infinity" because JSON doesn't have infinity

        this.languageHelper = new RecrasLanguageHelper();

        if (!(options instanceof RecrasOptions)) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        this.eventHelper = new RecrasEventHelper();
        this.eventHelper.setAnalytics(this.options.getAnalytics());
        this.eventHelper.setEvents(this.options.getAnalyticsEvents());

        let optionsPromise = this.languageHelper.setOptions(options);

        this.element = this.options.getElement();
        this.element.classList.add('recras-onlinebooking');

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);
        this.postJson = (url, data) => RecrasHttpHelper.postJson(this.options.getApiBase() + url, data, this.error.bind(this));

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', '),
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        if (this.options.getPreFilledAmounts()) {
            if (!this.options.isSinglePackage()) {
                console.warn(this.languageHelper.translate('ERR_AMOUNTS_NO_PACKAGE'));
            }
        }

        RecrasCSSHelper.loadCSS('global');
        RecrasCSSHelper.loadCSS('booking');
        RecrasCSSHelper.loadCSS('pikaday');
        this.clearAll();

        this.loadingIndicatorShow(this.element);
        this.promise = optionsPromise
            .then(() => RecrasCalendarHelper.loadScript())
            .then(() => this.getTexts())
            .then(texts => {
                this.texts = texts;
                return this.getPackages();
            }).then(packages => {
                this.loadingIndicatorHide();
                let pck = this.options.getPackageId();

                if (this.options.isSinglePackage()) {
                    if (Array.isArray(pck)) {
                        pck = pck[0];
                    }
                    return this.changePackage(pck);
                } else if (Array.isArray(pck) && pck.length > 1) {
                    packages = packages.filter(p => pck.includes(p.id));
                }
                return this.showPackages(packages);
            });
    }

    hasAtLeastOneProduct(pack) {
        if (this.shouldShowBookingSize(pack) && this.bookingSize() > 0) {
            return true;
        }

        let hasAtLeastOneProduct = false;
        for (let line of this.getLinesNoBookingSize(pack)) {
            let aantal = this.findElement(`[data-package-id="${ line.id }"]`).value;
            if (aantal > 0) {
                hasAtLeastOneProduct = true;
            }
        }

        return hasAtLeastOneProduct;
    }

    amountsValid(pack) {
        for (let line of this.getLinesNoBookingSize(pack)) {
            let aantal = this.findElement(`[data-package-id="${ line.id }"]`).value;
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
        }
        return this.hasAtLeastOneProduct(pack);
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    applyVoucher(packageID, voucherCode) {
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
            vouchers: [voucherCode],
        }).then(json => {
            let result = json[voucherCode];
            if (!result.valid) {
                return Promise.resolve(false);
            }

            this.appliedVouchers[voucherCode] = result.processed;
            this.showTotalPrice();

            return true;
        });
    }

    recheckVouchers() {
        let voucherCodes = Object.keys(this.appliedVouchers);
        this.appliedVouchers = [];
        let promises = [];
        for (let voucherCode of voucherCodes) {
            promises.push(this.applyVoucher(this.selectedPackage.id, voucherCode));
        }
        return Promise.all(promises);
    }

    bookingSize() {
        let bookingSizeEl = this.findElement('.bookingsize');
        if (!bookingSizeEl) {
            return 0;
        }
        let bookingSizeValue = parseInt(bookingSizeEl.value, 10);
        if (isNaN(bookingSizeValue)) {
            return 0;
        }
        return bookingSizeValue;
    }

    bookingSizeLines(pack) {
        return pack.regels.filter(line => {
            return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
        });
    }

    bookingSizeMaximum(pack) {
        const lines = this.bookingSizeLines(pack).filter(line => line.max);
        if (lines.length === 0) {
            return this.RECRAS_INFINITY;
        }
        const maxes = lines.map(line => line.max);
        return Math.min(...maxes);
    }

    bookingSizeLineMinimum(line) {
        if (line.onlineboeking_aantalbepalingsmethode === 'vast') {
            return 0;
        }
        return line.product.minimum_aantal;
    }
    bookingSizeMinimum(pack) {
        let minSize = 0;
        this.bookingSizeLines(pack).forEach(line => {
            minSize = Math.max(minSize, this.bookingSizeLineMinimum(line));
        });
        return minSize;
    }

    amountFromPersons(product, persons) {
        return persons;

        //TODO: this doesn't work yet because public product API does not send:
        // aantalbepaling, aantal, per_x_personen_afronding, per_x_personen
        if (product.aantalbepaling === 'vast') {
            return product.aantal;
        }

        let fn = product.per_x_personen_afronding === 'beneden' ? Math.floor : Math.ceil;
        return product.aantal * fn(persons / product.per_x_personen);
    }

    bookingSizePrice(pack) {
        let nrOfPersons = Math.max(pack.aantal_personen, 1);
        let price = 0;
        let lines = this.bookingSizeLines(pack);
        lines.forEach(line => {
            price += Math.max(this.amountFromPersons(line.product, nrOfPersons), line.product.minimum_aantal) * parseFloat(line.product.verkoop);
        });
        return price / nrOfPersons;
    }

    changePackage(packageID) {
        let selectedPackage = this.packages.filter(p => {
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
            return Promise.resolve(false);
        } else {
            this.clearAllExceptPackageSelection();
            this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PACKAGE_CHANGED, selectedPackage[0].id);
        }
        this.selectedPackage = selectedPackage[0];
        return this.showProducts(this.selectedPackage).then(() => {
            this.nextSectionActive('.recras-package-select', '.recras-amountsform');

            this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PRODUCTS_SHOWN);
            if (this.options.getAutoScroll() === true) {
                let scrollOptions = {
                    behavior: 'smooth',
                };
                if (!('scrollBehavior' in document.documentElement.style)) {
                    scrollOptions = true;
                }
                this.findElement('.recras-amountsform').scrollIntoView(scrollOptions);
            }

            this.loadingIndicatorShow(this.findElement('.recras-amountsform'));
            return this.showDateTimeSelection(this.selectedPackage);
        }).then(() => {
            this.loadingIndicatorHide();
            this.showContactForm(this.selectedPackage);
        });
    }

    checkBookingSize(pack) {
        if (!this.shouldShowBookingSize(pack)) {
            return;
        }

        let bookingSize = this.bookingSize();
        let bsMaximum = this.bookingSizeMaximum(pack);
        let bsMinimum = this.bookingSizeMinimum(pack);

        if (bookingSize < bsMinimum) {
            this.setMinMaxAmountWarning('bookingsize', bsMinimum, 'minimum');
        } else if (bookingSize > bsMaximum) {
            this.setMinMaxAmountWarning('bookingsize', bsMaximum, 'maximum');
        }
        this.maybeShowInlineErrors();
    }

    checkDependencies() {
        [...this.findElements('.recras-product-dependency')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        [...this.findElements('[data-package-id]')].forEach(el => {
            el.classList.remove('recras-input-invalid');
        });
        this.requiresProduct = false;

        this.productCounts().forEach(line => {
            if (line.aantal > 0) {
                let packageLineID = line.arrangementsregel_id;
                let product = this.findProduct(packageLineID).product;
                let thisProductRequiresProduct = false;
                if (!product.vereist_product) {
                    console.warn('You are logged in to this particular Recras. Because of API differences between logged-in and logged-out state, required products do not work as expected.');
                } else {
                    product.vereist_product.forEach(vp => {
                        if (!this.dependencySatisfied(line.aantal, vp)) {
                            thisProductRequiresProduct = true;
                            this.requiresProduct = true;
                            let requiredAmount = this.requiredAmount(line.aantal, vp);
                            let requiredProductName = this.getProductByID(vp.vereist_product_id).weergavenaam;
                            let message = this.languageHelper.translate('PRODUCT_REQUIRED', {
                                NUM: line.aantal,
                                PRODUCT: product.weergavenaam,
                                REQUIRED_AMOUNT: requiredAmount,
                                REQUIRED_PRODUCT: requiredProductName,
                            });
                            this.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', `<span class="recras-product-dependency">${ message }</span>`);
                        }
                    });
                }

                if (thisProductRequiresProduct) {
                    let productInput = this.findElement(`[data-package-id="${ packageLineID }"]`);
                    productInput.classList.add('recras-input-invalid');
                }
            }
        });

        this.maybeShowInlineErrors();
    }

    checkDiscountAndVoucher() {
        let discountPromise = this.checkDiscountcode(
            this.selectedPackage.id,
            this.findElement('.recras-onlinebooking-date').value,
            this.findElement('#discountcode').value.trim()
        );

        let voucherPromise = this.applyVoucher(
            this.selectedPackage.id,
            this.findElement('#discountcode').value.trim()
        );

        Promise.all([discountPromise, voucherPromise]).then(([discountStatus, voucherStatus]) => {
            if (discountStatus || voucherStatus) {
                let status;
                if (discountStatus) {
                    status = 'DISCOUNT_APPLIED';
                } else {
                    status = 'VOUCHER_APPLIED';
                }
                this.setDiscountStatus(this.languageHelper.translate(status), false);
                this.findElement('#discountcode').value = '';
                this.nextSectionActive('.recras-discounts', '.recras-contactform');
            } else {
                this.setDiscountStatus(this.languageHelper.translate('DISCOUNT_INVALID'));
            }
        });
    }

    checkDiscountcode(packageID, date, code) {
        return this.fetchJson(this.options.getApiBase() + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code)
            .then(discount => {
                if (discount === false) {
                    return false;
                }
                discount.code = code;
                this.discount = discount;

                this.showTotalPrice();
                return true;
            });
    }

    checkMaximumForPackage() {
        const maxPerLine = this.selectedPackage.maximum_aantal_personen_online;
        if (maxPerLine === null) {
            return Promise.resolve(null);
        }

        let showWarning = false;
        let selectedProducts = this.productCounts();
        return this.languageHelper.filterTags(this.texts.maximum_aantal_online_boeking_overschreden, this.selectedPackage ? this.selectedPackage.id : null).then(msg => {
            selectedProducts.forEach(p => {
                if (p.aantal > maxPerLine && !showWarning) {
                    let input = this.findElement(`[data-package-id="${ p.arrangementsregel_id }"]`);
                    if (!input) {
                        input = this.findElement('#bookingsize');
                    }

                    if (input) {
                        let warningEl = document.createElement('div');
                        warningEl.classList.add('maximum-amount');
                        warningEl.classList.add('recras-full-width');
                        warningEl.innerHTML = msg;
                        input.parentNode.parentNode.insertBefore(warningEl, input.parentNode.nextSibling);
                        input.classList.add('recras-input-invalid');
                    } else {
                        this.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', `<span class="maximum-amount">${ msg }</span>`);
                    }
                    showWarning = true;
                }
            });
        });
    }

    contactFormIsEmpty() {
        let isEmpty = true;
        let els = this.findElements('.recras-contactform input, .recras-contactform select, .recras-contactform textarea');
        let formValues = [...els].map(el => el.value);
        for (let val of formValues) {
            if (val !== '') {
                isEmpty = false;
            }
        }
        return isEmpty;
    }

    contactFormInvalidFields() {
        let invalid = [];
        let required = this.contactFormRequiredFields();

        let els = this.findElements('.recras-contactform :invalid');
        for (let el of els) {
            if (!required.includes(el)) {
                invalid.push(el);
            }
        }
        return invalid;
    }

    contactFormRequiredFields() {
        let isEmpty = [];
        let els = this.findElements('.recras-contactform :required');
        for (let el of els) {
            if (el.value === undefined || el.value === '') {
                isEmpty.push(el);
            }
        }
        return isEmpty;
    }

    contactFormRequiredIsEmpty() {
        return this.contactFormRequiredFields().length > 0;
    }

    contactFormValid() {
        const contactFormIsValid = this.findElement('.recras-contactform').checkValidity();
        const contactFormRequiredCheckboxes = this.contactForm.checkRequiredCheckboxes();
        return contactFormIsValid && contactFormRequiredCheckboxes;
    }

    setMinMaxAmountWarning(lineID, minAmount, type = 'minimum') {
        let warnEl = document.createElement('span');
        warnEl.classList.add(type + '-amount');
        this.findElement(`#${ lineID }`).classList.add('recras-input-invalid');

        let text;
        if (type === 'minimum') {
            text = this.languageHelper.translate('PRODUCT_MINIMUM', {
                MINIMUM: minAmount,
            });
        } else {
            text = this.languageHelper.translate('PRODUCT_MAXIMUM', {
                MAXIMUM: minAmount,
            });
        }
        warnEl.innerHTML = text;
        let label = this.findElement(`label[for="${ lineID }"]`);
        label.parentNode.appendChild(warnEl);
    }

    checkMinMaxAmounts() {
        for (let product of this.productCounts()) {
            if (product.aantal < 1) {
                continue;
            }

            let packageLineID = product.arrangementsregel_id;
            let packageLine = this.findProduct(packageLineID);

            let input = this.findElement(`[data-package-id="${ packageLineID }"]`);
            if (!input) {
                // This is a "booking size" line - this is handled in checkBookingSize
                continue;
            }

            if (product.aantal < packageLine.product.minimum_aantal) {
                this.setMinMaxAmountWarning(input.id, packageLine.product.minimum_aantal, 'minimum');
            } else if (product.aantal < packageLine.aantal_personen) {
                this.setMinMaxAmountWarning(input.id, packageLine.aantal_personen, 'minimum');
            } else if (packageLine.max !== null && product.aantal > packageLine.max) {
                this.setMinMaxAmountWarning(input.id, packageLine.max, 'maximum');
            }
        }
    }

    clearAll() {
        this.clearElements(this.element.children);
    }

    clearAllExceptPackageSelection() {
        let packageSelect = this.findElement('.recras-package-select');
        if (packageSelect) {
            packageSelect.classList.remove('recras-completed');
            packageSelect.classList.add('recras-active');
        }

        let elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-package-select)');
        this.clearElements(elements);
    }

    clearElements(elements) {
        if (this.datePicker) {
            this.datePicker.destroy();
        }
        this.availableDays = [];
        [...elements].forEach(el => {
            el.parentNode.removeChild(el);
        });
        this.appendHtml(`<div class="latestError"></div>`);
    }

    dependencySatisfied(hasNow, requiredProduct) {
        for (let line of this.productCounts()) {
            if (line.aantal === 0) {
                continue;
            }

            let product = this.findProduct(line.arrangementsregel_id).product;
            if (product.id !== parseInt(requiredProduct.vereist_product_id, 10)) {
                continue;
            }

            let requiredAmount = this.requiredAmount(hasNow, requiredProduct);

            return line.aantal >= requiredAmount;
        }
        return false;
    }

    error(msg) {
        this.loadingIndicatorHide();
        let bookingErrorsEl = this.findElement('#bookingErrors');
        if (bookingErrorsEl) {
            bookingErrorsEl.parentNode.appendChild(this.findElement('.latestError'));
        }
        this.findElement('.latestError').innerHTML = `<strong>${ this.languageHelper.translate('ERR_GENERAL') }</strong><p>${ msg }</p>`;
    }

    findElement(querystring) {
        return this.element.querySelector(querystring);
    }

    findElements(querystring) {
        return this.element.querySelectorAll(querystring);
    }

    findProduct(packageLineID) {
        return this.selectedPackage.regels.filter(line => (line.id === packageLineID))[0];
    }

    formatPrice(price) {
        return this.languageHelper.formatPrice(price);
    }

    getAvailableDays(packageID, begin, end) {
        let postData = {
            arrangement_id: packageID,
            begin: RecrasDateHelper.datePartOnly(begin),
            eind: RecrasDateHelper.datePartOnly(end),
            producten: this.productCountsNoBookingSize(),
        };
        if (this.shouldShowBookingSize(this.selectedPackage)) {
            postData.boekingsgrootte = this.bookingSize();
        }
        return this.postJson('onlineboeking/beschikbaredagen', postData).then(json => {
            this.availableDays = this.availableDays.concat(json);
            return this.availableDays;
        });
    }

    getAvailableTimes(packageID, date) {
        return this.postJson('onlineboeking/beschikbaretijden', {
            arrangement_id: packageID,
            datum: RecrasDateHelper.datePartOnly(date),
            producten: this.productCounts(),
        }).then(json => {
            this.availableTimes = json;
            return this.availableTimes;
        });
    }

    getContactForm(pack) {
        this.options.setOption('form_id', pack.onlineboeking_contactformulier_id);
        let contactForm = new RecrasContactForm(this.options);
        return contactForm.getContactFormFields().then(() => {
            this.contactForm = contactForm;
            return contactForm;
        });
    }

    getDiscountPrice(discount) {
        if (!discount) {
            return 0;
        }
        return (discount.percentage / 100) * this.getSubTotal() * -1;
    }

    getLinesBookingSize(pack) {
        return pack.regels.filter(line => (line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte'));
    }

    getLinesNoBookingSize(pack) {
        return pack.regels.filter(line => (line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte'));
    }

    getPackages() {
        return this.fetchJson(this.options.getApiBase() + 'arrangementen')
            .then(json => {
                this.packages = json;
                return this.packages;
            });
    }

    getProductByID(id) {
        let products = this.selectedPackage.regels.map(r => r.product);
        return products.filter(p => (p.id === id))[0];
    }

    getSubTotal() {
        let total = 0;
        this.productCounts().forEach(line => {
            let product = this.findProduct(line.arrangementsregel_id).product;
            let aantal = line.aantal;
            if (isNaN(aantal)) {
                aantal = 0;
            }
            total += (aantal * parseFloat(product.verkoop));
        });
        return total;
    }

    getSetting(settingName) {
        return this.fetchJson(this.options.getApiBase() + 'instellingen/' + settingName);
    }

    getTexts() {
        const settings = [
            'maximum_aantal_online_boeking_overschreden',
            'online_boeking_betaalkeuze',
            'online_boeking_betaalkeuze_achteraf_titel',
            'online_boeking_betaalkeuze_ideal_titel',
            'online_boeking_step0_text_pre',
            'online_boeking_step0_text_post',
            'online_boeking_step1_text_pre',
            'online_boeking_step1_text_post',
            'online_boeking_step3_text_post',
        ];
        let promises = [];
        for (let setting of settings) {
            promises.push(this.getSetting(setting));
        }
        return Promise.all(promises).then(settings => {
            let texts = {};
            settings.forEach(setting => {
                texts[setting.slug] = setting.waarde;
            });
            return texts;
        });
    }

    getTotalPrice() {
        let total = this.getSubTotal();

        total += this.getDiscountPrice(this.discount);
        total += this.getVouchersPrice();

        return total;
    }

    getVouchersPrice() {
        let voucherPrice = 0;
        Object.values(this.appliedVouchers).forEach(voucher => {
            Object.values(voucher).forEach(line => {
                voucherPrice -= line.aantal * line.prijs_per_stuk;
            });
        });

        return voucherPrice;
    }

    loadingIndicatorHide() {
        [...document.querySelectorAll('.recrasLoadingIndicator')].forEach(el => {
            el.parentNode.removeChild(el);
        });
    }

    loadingIndicatorShow(afterEl) {
        if (!afterEl) {
            return;
        }
        afterEl.insertAdjacentHTML('beforeend', `<span class="recrasLoadingIndicator">${ this.languageHelper.translate('LOADING') }</span>`);
    }

    bookingErrors() {
        let bookingDisabledReasons = {};

        if (!this.hasAtLeastOneProduct(this.selectedPackage)) {
            bookingDisabledReasons.amountsInvalid = 'BOOKING_DISABLED_NO_PRODUCTS';
            return bookingDisabledReasons;
        }
        if (!this.amountsValid(this.selectedPackage)) {
            bookingDisabledReasons.amountsInvalid = 'BOOKING_DISABLED_AMOUNTS_INVALID';
            return bookingDisabledReasons;
        }
        if (this.requiresProduct) {
            bookingDisabledReasons.requiresProduct = 'BOOKING_DISABLED_REQUIRED_PRODUCT';
        }

        if (!this.findElement('.recras-onlinebooking-date').value) {
            bookingDisabledReasons.dateInvalid = 'BOOKING_DISABLED_INVALID_DATE';
            return bookingDisabledReasons;
        }
        if (!this.findElement('.recras-onlinebooking-time').value) {
            bookingDisabledReasons.timeInvalid = 'BOOKING_DISABLED_INVALID_TIME';
            return bookingDisabledReasons;
        }

        if (this.contactFormIsEmpty()) {
            bookingDisabledReasons.contactFormInvalid = 'BOOKING_DISABLED_CONTACT_FORM_EMPTY';
        } else if (this.contactFormRequiredIsEmpty() || !this.contactFormValid()) {
            // Special case
            bookingDisabledReasons.contactFormRequired = true;
            return bookingDisabledReasons;
        }

        const agreeEl = this.findElement('#recrasAgreeToAttachments');
        if (agreeEl && !agreeEl.checked) {
            bookingDisabledReasons.notAgreed = 'BOOKING_DISABLED_AGREEMENT';
        }

        return bookingDisabledReasons;
    }

    bookingHasErrors() {
        let bookingDisabledReasons = this.bookingErrors();
        return Object.keys(bookingDisabledReasons).length > 0;
    }

    maybeShowInlineErrors() {
        if (this.bookingHasErrors()) {
            this.showInlineErrors();
        }
    }

    nextSectionActive(completedQuery, activeQuery) {
        if (completedQuery && this.findElement(completedQuery)) {
            this.findElement(completedQuery).classList.add('recras-completed');
            this.findElement(completedQuery).classList.remove('recras-active');
        }

        //TODO: remove active from all sections? Test with invalid amount

        if (activeQuery && this.findElement(activeQuery)) {
            this.findElement(activeQuery).classList.add('recras-active');
        }
    }

    normaliseDate(date, packageStart, bookingStart) {
        let diffSeconds = (date - packageStart) / 1000;
        let tempDate = new Date(bookingStart.getTime());
        return new Date(tempDate.setSeconds(tempDate.getSeconds() + diffSeconds));
    }

    paymentMethods(pack) {
        let methods = [];
        if (pack.mag_online_geboekt_worden_direct_betalen) {
            methods.push(this.PAYMENT_DIRECT);
        }
        if (pack.mag_online_geboekt_worden_achteraf_betalen) {
            methods.push(this.PAYMENT_AFTERWARDS);
        }
        return methods;
    }

    preFillAmounts(amounts) {
        Object.entries(amounts).forEach(idAmount => {
            let el;
            if (idAmount[0] === 'bookingsize') {
                el = this.findElement('#bookingsize');
            } else {
                el = this.findElement(`[data-package-id="${ idAmount[0] }"]`);
            }

            if (el) {
                el.value = idAmount[1];
                this.updateProductPrice(el);
            }
        });
        this.updateProductAmounts();
    }

    previewTimes() {
        [...this.findElements('.time-preview')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        if (this.selectedTime) {
            let linesWithTime = this.selectedPackage.regels.filter(line => !!line.begin);
            let linesBegin = linesWithTime.map(line => new Date(line.begin));
            let packageStart = new Date(Math.min(...linesBegin)); // Math.min transforms dates to timestamps

            let linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
            linesNoBookingSize.forEach((line, idx) => {
                if (line.begin !== null || line.eind !== null) {
                    let normalisedStart = this.normaliseDate(new Date(line.begin), packageStart, this.selectedDate);
                    let normalisedEnd = this.normaliseDate(new Date(line.eind), packageStart, this.selectedDate);
                    this.findElement(`label[for="packageline${ idx }"]`).insertAdjacentHTML(
                        'afterbegin',
                        `<span class="time-preview">${ RecrasDateHelper.timePartOnly(normalisedStart) } – ${ RecrasDateHelper.timePartOnly(normalisedEnd) }</span>`
                    );
                }
            });
        }
    }

    productCountsBookingSize() {
        return this.getLinesBookingSize(this.selectedPackage).map(line => (
            {
                aantal: this.bookingSize(),
                arrangementsregel_id: line.id,
            }
        ));
    }

    productCountsNoBookingSize() {
        return [...this.findElements('[id^="packageline"]')].map(line => (
            {
                aantal: (isNaN(parseInt(line.value)) ? 0 : parseInt(line.value)),
                arrangementsregel_id: parseInt(line.dataset.packageId, 10),
            }
        ));
    }

    productCounts() {
        let counts = [];
        counts = counts.concat(this.productCountsNoBookingSize());
        counts = counts.concat(this.productCountsBookingSize());
        return counts;
    }

    removeErrors(parentQS = '') {
        [...this.findElements(parentQS + '.booking-error')].forEach(el => {
            el.parentNode.removeChild(el);
        });
    }
    removeWarnings() {
        [...this.findElements('.minimum-amount')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        [...this.findElements('.maximum-amount')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        [...this.findElements('.recras-input-invalid')].forEach(el => {
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
    requiredAmount(hasNow, requiredProduct) {
        let requiredFraction = hasNow / requiredProduct.per_x_aantal;
        if (requiredProduct.afronding === 'boven') {
            requiredFraction = Math.ceil(requiredFraction);
        } else {
            requiredFraction = Math.floor(requiredFraction);
        }
        return requiredProduct.aantal * requiredFraction;
    }

    resetForm() {
        this.changePackage(null);
    }

    selectSingleTime() {
        if (this.findElements('#recras-onlinebooking-time option[value]').length !== 1) {
            return;
        }
        this.findElement('#recras-onlinebooking-time option[value]').selected = true;

        let event;
        try {
            event = new Event('change');
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent('change', true, true);
        }
        this.findElement('#recras-onlinebooking-time').dispatchEvent(event);
    }

    setDiscountStatus(statusText, isError = true) {
        let statusEl = this.findElement('.discount-status');
        if (!statusEl) {
            this.element.querySelector('.recras-discounts').insertAdjacentHTML('beforeend', `<span class="discount-status"></span>`);
            statusEl = this.findElement('.discount-status');
        }
        if (isError) {
            statusEl.classList.add('booking-error');
        } else {
            statusEl.classList.remove('booking-error');
        }

        statusEl.innerHTML = statusText;
    }

    setHtml(msg) {
        this.element.innerHTML = msg;
    }

    showStandardAttachments() {
        if (!this.selectedPackage || !this.findElement('.standard-attachments')) {
            return true;
        }

        let attachments = this.standardAttachments(this.selectedPackage);
        let attachmentHtml = ``;
        if (Object.keys(attachments).length) {
            attachmentHtml += `<p><label><input type="checkbox" id="recrasAgreeToAttachments" required>${ this.languageHelper.translate('AGREE_ATTACHMENTS') }</label></p>`;
            attachmentHtml += `<ul>`;
            Object.values(attachments).forEach(attachment => {
                attachmentHtml += `<li><a href="${ attachment.filename }" download target="_blank">${ attachment.naam }</a></li>`;
            });
            attachmentHtml += `</ul>`;
        }
        this.findElement('.standard-attachments').innerHTML = attachmentHtml;
        const agreeEl = this.findElement('#recrasAgreeToAttachments');
        if (agreeEl) {
            agreeEl.addEventListener('change', () => {
                this.removeErrors('.standard-attachments ');
                this.maybeShowInlineErrors();
            });
        }
    }

    showTotalPrice() {
        [...this.findElements('.discountLine, .voucherLine, .priceWithDiscount')].forEach(el => {
            el.parentNode.removeChild(el);
        });

        let html = ``;

        if (this.discount) {
            html += `<div class="discountLine"><div>${ this.discount.naam }</div><div>${ this.formatPrice(this.getDiscountPrice(this.discount)) }</div></div>`;
        }
        if (Object.keys(this.appliedVouchers).length) {
            html += `<div class="voucherLine"><div>${ this.languageHelper.translate('VOUCHERS_DISCOUNT') }</div><div>${ this.formatPrice(this.getVouchersPrice()) }</div></div>`;
        }
        if (this.discount || Object.keys(this.appliedVouchers).length) {
            html += `<div class="priceWithDiscount"><div>${ this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT') }</div><div>${ this.formatPrice(this.getTotalPrice()) }</div></div>`;
        }

        var elementToInsertBefore = this.findElement('.recras-amountsform p:last-of-type');
        elementToInsertBefore.insertAdjacentHTML('beforebegin', html);
        this.findElement('.priceSubtotal').innerHTML = this.formatPrice(this.getSubTotal());
    }

    sortPackages(packages) {
        // Packages from the API are sorted by internal name, not by display name
        // However, display name is not required so fallback to internal name
        return packages.sort((a, b) => {
            let aName = a.weergavenaam || a.arrangement;
            let bName = b.weergavenaam || b.arrangement;
            if (aName < bName) {
                return -1;
            }
            if (aName > bName) {
                return 1;
            }
            return 0;
        });
    }

    shouldShowBookingSize(pack) {
        return this.bookingSizeLines(pack).length > 0;
    }

    showBookButton() {
        let promises = [];
        let paymentMethods = this.paymentMethods(this.selectedPackage);
        let paymentText = '';
        let textPostBooking = '';
        if (paymentMethods.indexOf(this.PAYMENT_DIRECT) > -1 && paymentMethods.indexOf(this.PAYMENT_AFTERWARDS) > -1) {
            // Let user decide how to pay
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze, this.selectedPackage ? this.selectedPackage.id : null));
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze_ideal_titel, this.selectedPackage ? this.selectedPackage.id : null));
            promises.push(this.languageHelper.filterTags(this.texts.online_boeking_betaalkeuze_achteraf_titel, this.selectedPackage ? this.selectedPackage.id : null));

            Promise.all(promises).then(msgs => {
                paymentText = `<p>${ msgs[0] }</p>`;
                paymentText += `<ul>
                <li><label><input type="radio" name="paymentMethod" checked value="${ this.PAYMENT_DIRECT }"> ${ msgs[1] }</label>
                <li><label><input type="radio" name="paymentMethod" value="${ this.PAYMENT_AFTERWARDS }"> ${ msgs[2] }</label>
            </ul>`;
            });
        } else {
            // One fixed choice
            promises.push(Promise.resolve(''));
        }
        promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step3_text_post, this.selectedPackage ? this.selectedPackage.id : null).then(msg => {
            textPostBooking = msg;
        }));

        Promise.all(promises).then(() => {
            let html = `<div class="recras-finalise">
            <p>${ textPostBooking }</p>
            <div class="standard-attachments"></div>
            ${ paymentText }
            <button type="submit" class="bookPackage">${ this.languageHelper.translate('BUTTON_BOOK_NOW') }</button>
        </div>`;
            this.appendHtml(html);
            this.findElement('.bookPackage').addEventListener('click', this.submitBooking.bind(this));
        });
    }

    showDiscountFields() {
        let existingEl = this.findElement('.recras-discounts');
        if (existingEl) {
            existingEl.parentNode.removeChild(existingEl);
        }

        let html = `
            <form class="recras-discounts">
                <div>
                    <label for="discountcode">${ this.languageHelper.translate('DISCOUNT_TITLE') }</label>
                    <input type="text" id="discountcode" class="discountcode" maxlength="50" disabled>
                </div>
                <button type="submit" class="button-secondary">${ this.languageHelper.translate('DISCOUNT_CHECK') }</button>
            </form>
        `;
        this.findElement('.recras-datetime').insertAdjacentHTML('afterend', html);

        this.findElement('.recras-discounts').addEventListener('submit', e => {
            e.preventDefault();
            this.checkDiscountAndVoucher();

            return false;
        });
    }

    showContactForm(pack) {
        this.loadingIndicatorShow(this.findElement('.recras-datetime'));
        this.getContactForm(pack)
            .then(form => form.generateForm())
            .then(html => {
                this.appendHtml(html);
                this.loadingIndicatorHide();
                this.showBookButton();
                this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_CONTACT_FORM_SHOWN);

                [...this.findElements('[name^="contactformulier"]')].forEach(el => {
                    el.addEventListener('input', () => {
                        this.removeErrors('.recras-contactform ');
                        this.maybeShowInlineErrors();
                        if (this.contactFormValid()) {
                            this.removeErrors();
                            this.nextSectionActive('.recras-contactform', '.recras-finalise');
                        }
                    });
                });
        });
    }

    addDateTimeSelectionHtml() {
        let today = RecrasDateHelper.datePartOnly(new Date());
        let html = `<form class="recras-datetime">
            <label for="recras-onlinebooking-date">
                ${ this.languageHelper.translate('DATE') }
            </label>
            <input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="${ today }" disabled readonly autocomplete="off">
            <label for="recras-onlinebooking-time">
                ${ this.languageHelper.translate('TIME') }
            </label>
            <select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled autocomplete="off"></select>
        </form>`;
        this.appendHtml(html);
    }
    showDateTimeSelection(pack) {
        this.addDateTimeSelectionHtml();
        this.showDiscountFields();

        if (this.options.getPreFilledAmounts()) {
            this.preFillAmounts(this.options.getPreFilledAmounts());
        }
        let pikadayOptions = Object.assign(
            RecrasCalendarHelper.defaultOptions(),
            {
                disableDayFn: (day) => {
                    let dateFmt = RecrasDateHelper.datePartOnly(day);
                    return this.availableDays.indexOf(dateFmt) === -1;
                },
                field: this.findElement('.recras-onlinebooking-date'),
                i18n: RecrasCalendarHelper.i18n(this.languageHelper),
                onDraw: (pika) => {
                    if (!this.hasAtLeastOneProduct(this.selectedPackage) || !this.amountsValid(this.selectedPackage) || this.requiresProduct) {
                        let errorMsg = this.languageHelper.translate('BOOKING_DISABLED_PRODUCTS_BEFORE_DATE');
                        this.removeErrors('.recras-datetime ');
                        dateEl.insertAdjacentHTML(
                            'afterend',
                            `<div class="booking-error">${ errorMsg }</div>`
                        );
                        dateEl.blur();
                        return false;
                    }

                    let lastMonthYear = pika.calendars[pika.calendars.length - 1];
                    let lastDay = new Date(lastMonthYear.year, lastMonthYear.month, 31);

                    let lastAvailableDay = this.availableDays.reduce((acc, curVal) => {
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

                    let newEndDate = RecrasDateHelper.clone(lastAvailableDay);
                    newEndDate.setFullYear(lastMonthYear.year);
                    newEndDate.setMonth(lastMonthYear.month + 2);

                    this.getAvailableDays(pack.id, lastAvailableDay, newEndDate);
                },
                onSelect: (date) => {
                    this.loadingIndicatorShow(this.findElement('label[for="recras-onlinebooking-time"]'));
                    this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_DATE_SELECTED);
                    this.selectedDate = date;
                    this.getAvailableTimes(pack.id, date).then(times => {
                        times = times.map(time => RecrasDateHelper.timePartOnly(new Date(time)));
                        this.showTimes(times);
                        this.loadingIndicatorHide();
                        this.selectSingleTime();
                    });
                    this.findElement('#discountcode').removeAttribute('disabled');
                    this.maybeShowInlineErrors();
                },
            }
        );

        this.datePicker = new Pikaday(pikadayOptions);

        this.findElement('.recras-onlinebooking-time').addEventListener('change', () => {
            this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_TIME_SELECTED);
            this.selectedTime = this.findElement('.recras-onlinebooking-time').value;

            this.nextSectionActive('.recras-datetime', '.recras-discounts');
            this.nextSectionActive(null, '.recras-contactform');

            this.selectedDate = RecrasDateHelper.setTimeForDate(this.selectedDate, this.selectedTime);
            if (this.options.getPreviewTimes() === true) {
                this.previewTimes();
            }

            this.removeErrors('.recras-datetime ');
            this.maybeShowInlineErrors();
        });
    }

    showPackages(packages) {
        packages = packages.filter(p => {
            return p.mag_online;
        });
        let packagesSorted = this.sortPackages(packages);
        let packageOptions = packagesSorted.map(pack => `<option value="${ pack.id }">${ pack.weergavenaam || pack.arrangement }`);

        let html = '<select class="recras-package-selection"><option>' + packageOptions.join('') + '</select>';
        let promises = [];
        promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
        promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step0_text_post, this.selectedPackage ? this.selectedPackage.id : null));
        Promise.all(promises).then(msgs => {
            this.appendHtml(`<div class="recras-package-select recras-active"><p>${ msgs[0] }</p>${ html }<p>
${ msgs[1] }</p></div>`);
            this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_PACKAGES_SHOWN);

            let packageSelectEl = this.findElement('.recras-package-selection');
            packageSelectEl.addEventListener('change', () => {
                let selectedPackageId = parseInt(packageSelectEl.value, 10);
                this.changePackage(selectedPackageId);
            });
        });
    }

    showProducts(pack) {
        let promises = [];
        promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_pre, this.selectedPackage ? this.selectedPackage.id : null));
        promises.push(this.languageHelper.filterTags(this.texts.online_boeking_step1_text_post, this.selectedPackage ? this.selectedPackage.id : null));

        return Promise.all(promises).then(msgs => {
            let html = '<form class="recras-amountsform">';
            html += `<p>${ msgs[0] }</p>`;
            html += `<div class="recras-heading">
                <div>&nbsp;</div>
                <div>${ this.languageHelper.translate('HEADING_QUANTITY') }</div>
                <div class="recras-price">${ this.languageHelper.translate('HEADING_PRICE') }</div>
            </div>`;

            if (this.shouldShowBookingSize(pack)) {
                html += `<div>`;
                html += `<div><label for="bookingsize">${ (pack.weergavenaam || pack.arrangement) }</label></div>`;
                html += `<input type="number" id="bookingsize" class="bookingsize" min="${ this.bookingSizeMinimum(pack) }" max="${ this.bookingSizeMaximum(pack) }" placeholder="0" data-price="${ this.bookingSizePrice(pack) }">`;
                html += `<div class="recras-price recrasUnitPrice">${ this.formatPrice(this.bookingSizePrice(pack)) }</div>`;
                html += `</div>`;
            }

            let linesNoBookingSize = this.getLinesNoBookingSize(pack);
            linesNoBookingSize.forEach((line, idx) => {
                html += '<div><div>';
                html += `<label for="packageline${ idx }">${ line.beschrijving_templated }</label>`;
                let maxAttr = line.max ? `max="${ line.max }"` : '';
                html += `</div><input id="packageline${ idx }" type="number" min="0" ${ maxAttr } placeholder="0" data-package-id="${ line.id }" data-price="${ line.product.verkoop }">`;
                html += `<div class="recras-price recrasUnitPrice">${ this.formatPrice(line.product.verkoop) }</div>`;
                html += '</div>';
            });
            html += `<div class="priceWithoutDiscount">
                <div>${ this.languageHelper.translate('PRICE_TOTAL') }</div>
                <div></div>
                <div class="priceSubtotal"></div>
            </div>`;

            html += `<p>${ msgs[1] }</p>`;
            html += '</form>';
            this.appendHtml(html);

            [...this.findElements('[id^="packageline"], .bookingsize')].forEach(el => {
                el.addEventListener('input', this.updateProductAmounts.bind(this));
                el.addEventListener('input', this.updateProductPrice.bind(this, el));
            });
        });
    }

    showTimes(times) {
        let html = `<option>`;
        times.forEach(time => {
            html += `<option value="${ time }">${ time }`;
        });
        this.findElement('.recras-onlinebooking-time').innerHTML = html;
        this.findElement('.recras-onlinebooking-time').removeAttribute('disabled');
    }

    clearTimes() {
        this.findElement('.recras-onlinebooking-time').innerHTML = '';
        this.findElement('.recras-onlinebooking-time').setAttribute('disabled', 'disabled');
    }

    standardAttachments() {
        let attachments = {};
        if (!this.selectedPackage.onlineboeking_standaardbijlagen_meesturen) {
            return attachments;
        }
        this.productCounts().forEach(line => {
            if (line.aantal > 0) {
                let product = this.findProduct(line.arrangementsregel_id).product;
                if (product.standaardbijlagen) {
                    product.standaardbijlagen.forEach(attachment => {
                        attachments[attachment.id] = attachment;
                    });
                }
            }
        });

        return attachments;
    }

    contactformErrors() {
        this.removeErrors('.recras-contactform ');
        for (let el of this.contactFormRequiredFields()) {
            const labelEl = el.parentNode.querySelector('label');
            const requiredText = this.languageHelper.translate('CONTACT_FORM_FIELD_REQUIRED', { FIELD_NAME: labelEl.innerText });
            el.parentNode.insertAdjacentHTML(
                'afterend',
                `<div class="booking-error">${ requiredText }</div>`
            );
        }
        for (let el of this.contactFormInvalidFields()) {
            const labelEl = el.parentNode.querySelector('label');
            const invalidText = this.languageHelper.translate('CONTACT_FORM_FIELD_INVALID', { FIELD_NAME: labelEl.innerText });
            el.parentNode.insertAdjacentHTML(
                'afterend',
                `<div class="booking-error">${ invalidText }</div>`
            );
        }
    }

    errorAtPosition(key, msg) {
        let pos;
        let qs;

        switch (key) {
            case 'requiresProduct':
            case 'amountsInvalid':
                pos = 'beforeend';
                qs = '.recras-amountsform';
                break;
            case 'dateInvalid':
                pos = 'afterend';
                qs = '.recras-onlinebooking-date';
                break;
            case 'timeInvalid':
                pos = 'beforeend';
                qs = '.recras-datetime';
                break;
            case 'contactFormInvalid':
                pos = 'beforeend';
                qs = '.recras-contactform';
                break;
            case 'notAgreed':
                pos = 'beforeend';
                qs = '.standard-attachments';
                break;
            case 'contactFormRequired':
                this.contactformErrors();
                break;
            default:
                pos = 'beforeend';
                qs = '.bookPackage';
                break;
        }
        const el = this.findElement(qs);
        if (el) {
            el.insertAdjacentHTML(
                pos,
                `<p class="booking-error">${ this.languageHelper.translate(msg) }</p>`
            );
        }
    }

    showInlineErrors() {
        this.removeErrors();
        let errorMsgs = this.bookingErrors();
        for (const [key, msg] of Object.entries(errorMsgs)) {
            this.errorAtPosition(key, msg);
        }
    }

    submitBooking() {
        if (this.bookingHasErrors()) {
            this.showInlineErrors();
            return false;
        }
        let productCounts = this.productCounts().map(line => line.aantal);
        let productSum = productCounts.reduce((a, b) => a + b, 0);
        if (this.bookingSize() === 0 && productSum === 0) {
            window.alert(this.languageHelper.translate('NO_PRODUCTS'));
            return false;
        }
        let status = this.contactForm.checkRequiredCheckboxes();
        if (!status) {
            return false;
        }

        this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_BOOKING_SUBMITTED, this.selectedPackage.id);

        let paymentMethod = this.paymentMethods(this.selectedPackage)[0];
        let paymentMethodEl = this.findElement('[name="paymentMethod"]:checked');
        if (paymentMethodEl && this.validPaymentMethod(this.selectedPackage, paymentMethodEl.value)) {
            paymentMethod = paymentMethodEl.value;
        }

        let bookButton = this.findElement('.bookPackage');
        this.loadingIndicatorHide();
        this.loadingIndicatorShow(bookButton);
        bookButton.setAttribute('disabled', 'disabled');

        let vouchers = Object.keys(this.appliedVouchers).length > 0 ? Object.keys(this.appliedVouchers) : null;
        let bookingParams = {
            arrangement_id: this.selectedPackage.id,
            begin: this.selectedDate,
            betaalmethode: paymentMethod,
            contactformulier: this.contactForm.generateJson(),
            kortingscode: (this.discount && this.discount.code) || null,
            producten: this.productCounts(),
            status: null,
            stuur_bevestiging_email: true,
            vouchers: vouchers,
        };
        if (this.shouldShowBookingSize(this.selectedPackage)) {
            bookingParams.boekingsgrootte = this.bookingSize();
        }
        if (this.options.getRedirectUrl()) {
            bookingParams.redirect_url = this.options.getRedirectUrl();
        }

        return this.postJson('onlineboeking/reserveer', bookingParams).then(json => {
            this.loadingIndicatorHide();
            this.findElement('.bookPackage').removeAttribute('disabled');

            //TODO: redirect for payment afterwards. This needs to be implemented in Recras first
            if (json.payment_url) {
                window.top.location.href = json.payment_url;
            } else if (json.message && json.status) {
                if (bookingParams.redirect_url) {
                    this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_BOOKING, RecrasEventHelper.EVENT_BOOKING_REDIRECT_PAYMENT);
                    window.top.location.href = bookingParams.redirect_url;
                } else {
                    this.findElement('.recras-amountsform').reset();
                    this.findElement('.recras-datetime').reset();
                    this.findElement('.recras-contactform').reset();
                    window.alert(json.message);
                }
            } else {
                console.log(json);
            }
        });
    }

    updateProductAmounts() {
        this.loadingIndicatorHide();
        this.availableDays = [];

        this.removeErrors();
        this.removeWarnings();
        this.checkDependencies();
        this.checkMinMaxAmounts();
        const maxPromise = this.checkMaximumForPackage();
        this.checkBookingSize(this.selectedPackage);
        this.recheckVouchers().then(() => {
            this.showTotalPrice();
        });
        this.showStandardAttachments();

        let datePickerEl = this.findElement('.recras-onlinebooking-date');

        var thisClass = this;
        maxPromise.then(function() {
            let amountErrors = thisClass.findElements(
                '.minimum-amount, .maximum-amount, .recras-product-dependency'
            );
            if (amountErrors.length > 0) {
                thisClass.nextSectionActive(null, '.recras-amountsform');
                datePickerEl.setAttribute('disabled', 'disabled');
                return;
            }
            thisClass.nextSectionActive('.recras-amountsform', '.recras-datetime');

            thisClass.loadingIndicatorShow(thisClass.findElement('label[for="recras-onlinebooking-date"]'));
            let startDate = new Date();
            let endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            thisClass.getAvailableDays(thisClass.selectedPackage.id, startDate, endDate)
                .then(availableDays => {
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

    updateProductPrice(el) {
        const priceEl = el.parentNode.querySelector('.recras-price');
        let amount = parseInt(el.value, 10);
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

    validPaymentMethod(pack, method) {
        return this.paymentMethods(pack).indexOf(method) > -1;
    }
}
