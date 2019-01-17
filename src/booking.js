/*******************************
*  Recras integration library  *
*  v 0.13.3                    *
*******************************/

class RecrasBooking {
    constructor(options = {}) {
        this.datePicker = null;

        this.PAYMENT_DIRECT = 'mollie';
        this.PAYMENT_AFTERWARDS = 'factuur';

        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

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

        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssGlobal());
        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssBooking());
        this.clearAll();

        this.loadingIndicatorShow(this.element);
        optionsPromise
            .then(() => RecrasCalendarHelper.loadScript())
            .then(() => this.getTexts())
            .then(texts => {
                this.texts = texts;
                return this.getPackages();
            }).then(packages => {
                this.loadingIndicatorHide();
                if (this.options.getPackageId()) {
                    this.changePackage(this.options.getPackageId());
                } else {
                    this.showPackages(packages);
                }
            });
    }

    amountsValid(pack) {
        let hasAtLeastOneProduct = false;
        this.getLinesNoBookingSize(pack).forEach(line => {
            let aantal = this.findElement(`[data-package-id="${ line.id }"]`).value;
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

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    applyVoucher(packageID, voucherCode) {
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
            vouchers: [voucherCode],
        }).then(json => {
            let result = json[voucherCode];
            if (!result.valid) {
                return false;
            }

            this.appliedVouchers[voucherCode] = result.processed;
            this.showTotalPrice();

            return true;
        });
    }

    bookingSize() {
        let bookingSizeEl = this.findElement('.bookingsize');
        if (!bookingSizeEl) {
            return 0;
        }
        return parseInt(bookingSizeEl.value, 10);
    }

    bookingSizeLines(pack) {
        return pack.regels.filter(line => {
            return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
        });
    }

    bookingSizeMaximum(pack) {
        return Number.POSITIVE_INFINITY; //TODO: this can't currently be done using the public packages API
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
            RecrasEventHelper.sendEvent('Recras:Booking:Reset');
            return false;
        } else {
            this.clearAllExceptPackageSelection();
            RecrasEventHelper.sendEvent('Recras:Booking:PackageChanged');
        }
        this.selectedPackage = selectedPackage[0];
        this.showProducts(this.selectedPackage).then(() => {
            this.nextSectionActive('.recras-package-select', '.recras-amountsform');

            RecrasEventHelper.sendEvent('Recras:Booking:ProductsShown');
            if (this.options.getAutoScroll() === true) {
                let scrollOptions = {
                    behavior: 'smooth',
                };
                if (!('scrollBehavior' in document.documentElement.style)) {
                    scrollOptions = true;
                }
                this.findElement('.recras-amountsform').scrollIntoView(scrollOptions);
            }

            this.checkDependencies();
            this.loadingIndicatorShow(this.findElement('.recras-amountsform'));
            return this.showDateTimeSelection(this.selectedPackage);
        }).then(() => {
            this.loadingIndicatorHide();
            this.showContactForm(this.selectedPackage);
        });
    }

    checkBookingSize(pack) {
        let bookingSize = this.bookingSize();
        if (bookingSize === 0) {
            return;
        }
        let bsMaximum = this.bookingSizeMaximum(pack);
        let bsMinimum = this.bookingSizeMinimum(pack);

        if (bookingSize < bsMinimum) {
            this.setMinMaxAmountWarning('bookingsize', bsMinimum);
        } else if (bookingSize > bsMaximum) {
            this.setMinMaxAmountWarning('bookingsize', bsMaximum, 'maximum');
        }
        this.maybeDisableBookButton();
    }

    checkDependencies() {
        [...this.findElements('.recras-product-dependency')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        this.requiresProduct = false;

        this.productCounts().forEach(line => {
            if (line.aantal > 0) {
                let packageLineID = line.arrangementsregel_id;
                let product = this.findProduct(packageLineID).product;
                if (!product.vereist_product) {
                    console.warn('You are logged in to this particular Recras. Because of API differences between logged-in and logged-out state, required products do not work as expected.');
                } else {
                    product.vereist_product.forEach(vp => {
                        if (!this.dependencySatisfied(line.aantal, vp)) {
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
            }
        });

        this.maybeDisableBookButton();
    }

    checkDiscountAndVoucher() {
        let discountStatus, voucherStatus;
        let discountPromise = this.checkDiscountcode(
            this.selectedPackage.id,
            this.findElement('.recras-onlinebooking-date').value,
            this.findElement('#discountcode').value.trim()
        ).then(status => {
            discountStatus = status;
            return status;
        });

        let voucherPromise = this.applyVoucher(
            this.selectedPackage.id,
            this.findElement('#discountcode').value.trim()
        ).then(status => {
            voucherStatus = status;
            return status;
        });

        Promise.all([discountPromise, voucherPromise]).then(() => {
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

    checkMaximumAmounts() {
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
                        let warningEl = document.createElement('span');
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

    checkMinimumAmounts() {
        let selectedProducts = this.productCounts();
        for (let i = 0; i < selectedProducts.length; i++) {
            let product = selectedProducts[i];
            if (product.aantal < 1) {
                continue;
            }

            let packageLineID = product.arrangementsregel_id;
            let packageLine = this.findProduct(packageLineID);
            if (product.aantal >= packageLine.product.minimum_aantal) {
                continue;
            }

            let input = this.findElement(`[data-package-id="${ packageLineID }"]`);
            if (!input) {
                // This is a "booking size" line - this is handled in checkBookingSize
                continue;
            }

            this.setMinMaxAmountWarning(input.id, packageLine.product.minimum_aantal);
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
        let productLines = this.productCounts();
        for (let i = 0; i < productLines.length; i++) {
            let line = productLines[i];
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
        return this.postJson('onlineboeking/beschikbaredagen', {
            arrangement_id: packageID,
            begin: RecrasDateHelper.datePartOnly(begin),
            eind: RecrasDateHelper.datePartOnly(end),
            producten: this.productCounts(),
        }).then(json => {
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
        settings.forEach(setting => {
            promises.push(this.fetchJson(this.options.getApiBase() + 'instellingen/' + setting));
        });
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

    maybeDisableBookButton() {
        let button = this.findElement('.bookPackage');
        if (!button) {
            return false;
        }

        let bookingDisabledReasons = [];
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

        const agreeEl = this.findElement('#recrasAgreeToAttachments');
        if (agreeEl && !agreeEl.checked) {
            bookingDisabledReasons.push('BOOKING_DISABLED_AGREEMENT');
        }

        if (bookingDisabledReasons.length > 0) {
            const reasonsList = bookingDisabledReasons.map(reason => this.languageHelper.translate(reason)).join('<li>');
            this.findElement('#bookingErrors').innerHTML = `<ul><li>${ reasonsList }</ul>`;
            button.setAttribute('disabled', 'disabled');
        } else {
            this.findElement('#bookingErrors').innerHTML = '';
            button.removeAttribute('disabled');
        }
    }

    nextSectionActive(completedQuery, activeQuery) {
        if (completedQuery && this.findElement(completedQuery)) {
            this.findElement(completedQuery).classList.add('recras-completed');
            this.findElement(completedQuery).classList.remove('recras-active');
        }

        //TODO: remove active from all sections? Test with invalid amount
        this.findElement(activeQuery).classList.add('recras-active');
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
                let normalisedStart = this.normaliseDate(new Date(line.begin), packageStart, this.selectedDate);
                let normalisedEnd = this.normaliseDate(new Date(line.eind), packageStart, this.selectedDate);
                this.findElement(`label[for="packageline${ idx }"]`).insertAdjacentHTML(
                    'afterbegin',
                    `<span class="time-preview">${ RecrasDateHelper.timePartOnly(normalisedStart) } – ${ RecrasDateHelper.timePartOnly(normalisedEnd) }</span>`
                );
            });
        }
    }

    productCounts() {
        let counts = [];
        [...this.findElements('[id^="packageline"]')].forEach(line => {
            counts.push({
                aantal: (isNaN(parseInt(line.value)) ? 0 : parseInt(line.value)),
                arrangementsregel_id: parseInt(line.dataset.packageId, 10),
            });
        });
        this.getLinesBookingSize(this.selectedPackage).forEach(line => {
            counts.push({
                aantal: this.bookingSize(),
                arrangementsregel_id: line.id,
            });
        });
        return counts;
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

    requiredAmount(hasNow, requiredProduct) {
        let requiredAmount = hasNow / requiredProduct.per_x_aantal;
        if (requiredProduct.afronding === 'boven') {
            requiredAmount = Math.ceil(requiredAmount);
        } else {
            requiredAmount = Math.floor(requiredAmount);
        }
        return requiredAmount;
    }

    resetForm() {
        this.changePackage(null);
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
            agreeEl.addEventListener('change', this.maybeDisableBookButton.bind(this));
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
            <button type="submit" class="bookPackage" disabled>${ this.languageHelper.translate('BUTTON_BOOK_NOW') }</button>
            <div class="booking-error" id="bookingErrors"></div>
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
            <div class="recras-discounts">
                <label for="discountcode">${ this.languageHelper.translate('DISCOUNT_TITLE') }</label>
                <input type="text" id="discountcode" class="discountcode" maxlength="50">
                <button>${ this.languageHelper.translate('DISCOUNT_CHECK') }</button>
            </div>
        `;
        this.findElement('.recras-contactform').insertAdjacentHTML('beforebegin', html);

        this.findElement('.recras-discounts input').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                this.checkDiscountAndVoucher().bind(this);
            }
        });
        this.findElement('.recras-discounts button').addEventListener('click', this.checkDiscountAndVoucher.bind(this));
    }

    showContactForm(pack) {
        this.loadingIndicatorShow(this.findElement('.recras-datetime'));
        this.getContactForm(pack)
            .then(form => form.generateForm())
            .then(html => {
                this.appendHtml(html);
                this.loadingIndicatorHide();
                this.showBookButton();
                RecrasEventHelper.sendEvent('Recras:Booking:ContactFormShown');

                [...this.findElements('[name^="contactformulier"]')].forEach(el => {
                    el.addEventListener('input', this.maybeDisableBookButton.bind(this));
                    el.addEventListener('input', () => {
                        if (this.contactFormValid()) {
                            this.nextSectionActive('.recras-contactform', '.recras-finalise');
                        }
                    });
                });
        });
    }

    showDateTimeSelection(pack) {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        return this.getAvailableDays(pack.id, startDate, endDate)
            .then(() => {
                let today = RecrasDateHelper.datePartOnly(new Date());
                let html = `<form class="recras-datetime">`;
                html += `<label for="recras-onlinebooking-date">${ this.languageHelper.translate('DATE') }</label><input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="${ today }" disabled autocomplete="off">`;
                html += `<label for="recras-onlinebooking-time">${ this.languageHelper.translate('TIME') }</label><select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled autocomplete="off"></select>`;
                html += '</form>';
                this.appendHtml(html);
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
                            RecrasEventHelper.sendEvent('Recras:Booking:DateSelected');
                            this.selectedDate = date;
                            this.getAvailableTimes(pack.id, date).then(times => {
                                times = times.map(time => RecrasDateHelper.timePartOnly(new Date(time)));
                                this.showTimes(times);
                                this.loadingIndicatorHide();
                            });
                            this.maybeDisableBookButton();
                            this.showDiscountFields();
                        },
                    }
                );

                this.datePicker = new Pikaday(pikadayOptions);

                this.findElement('.recras-onlinebooking-time').addEventListener('change', () => {
                    RecrasEventHelper.sendEvent('Recras:Booking:TimeSelected');
                    this.selectedTime = this.findElement('.recras-onlinebooking-time').value;

                    this.nextSectionActive('.recras-datetime', '.recras-discounts');
                    this.nextSectionActive(null, '.recras-contactform');

                    this.selectedDate = RecrasDateHelper.setTimeForDate(this.selectedDate, this.selectedTime);
                    if (this.options.getPreviewTimes() === true) {
                        this.previewTimes();
                    }

                    this.maybeDisableBookButton();
                });
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
            RecrasEventHelper.sendEvent('Recras:Booking:PackagesShown');

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

            if (this.shouldShowBookingSize(pack)) {
                html += `<div>`;
                html += `<div><label for="bookingsize">${ (pack.weergavenaam || pack.arrangement) }</label></div>`;
                html += `<input type="number" id="bookingsize" class="bookingsize" min="0" data-price="${ this.bookingSizePrice(pack) }">`;
                html += `<div class="recras-price recrasUnitPrice">${ this.formatPrice(this.bookingSizePrice(pack)) }</div>`;
                html += `</div>`;
            }

            let linesNoBookingSize = this.getLinesNoBookingSize(pack);
            linesNoBookingSize.forEach((line, idx) => {
                html += '<div><div>';
                html += `<label for="packageline${ idx }">${ line.beschrijving_templated }</label>`;
                let maxAttr = line.max ? `max="${ line.max }"` : '';
                html += `</div><input id="packageline${ idx }" type="number" min="0" ${ maxAttr } data-package-id="${ line.id }" data-price="${ line.product.verkoop }">`;
                html += `<div class="recras-price recrasUnitPrice">${ this.formatPrice(line.product.verkoop) }</div>`;
                html += '</div>';
            });
            html += `<div class="priceWithoutDiscount"><div>${ this.languageHelper.translate('PRICE_TOTAL') }</div><div class="priceSubtotal"></div></div>`;

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

    submitBooking() {
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

        RecrasEventHelper.sendEvent('Recras:Booking:BuyInProgress');

        let paymentMethod = this.paymentMethods(this.selectedPackage)[0];
        let paymentMethodEl = this.findElement('[name="paymentMethod"]:checked');
        if (paymentMethodEl && this.validPaymentMethod(this.selectedPackage, paymentMethodEl.value)) {
            paymentMethod = paymentMethodEl.value;
        }

        this.loadingIndicatorHide();
        this.loadingIndicatorShow(this.findElement('.bookPackage'));
        let elem;
        if (null !== (elem = this.findElement('.bookPackage'))) {
            elem.setAttribute('disabled', 'disabled');
        }

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
                    RecrasEventHelper.sendEvent('Recras:Booking:RedirectToPayment');
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

        this.removeWarnings();
        this.checkDependencies();
        this.checkMinimumAmounts();
        const maxPromise = this.checkMaximumAmounts();
        this.checkBookingSize(this.selectedPackage);
        this.showTotalPrice();
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
