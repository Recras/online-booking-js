/**********************************
*  Recras Online Booking library  *
*  v 0.2.0                        *
**********************************/

class RecrasBooking {
    constructor(options = {}) {
        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';
        this.GENDERS = {
            onbekend: 'GENDER_UNKNOWN',
            man: 'GENDER_MALE',
            vrouw: 'GENDER_FEMALE',
        };
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control
        this.AUTOCOMPLETE_OPTIONS = {
            'contactpersoon.voornaam': 'given-name',
            'contactpersoon.achternaam': 'family-name',
            'contact.landcode': 'country',
            'contact.naam': 'organization',
            'contactpersoon.adres': 'address-line1',
            'contactpersoon.postcode': 'postal-code',
            'contactpersoon.plaats': 'address-level2',
        };

        this.datePicker = null;

        const CSS = `
@import url('https://cdn.rawgit.com/dbushell/Pikaday/eddaaa3b/css/pikaday.css');

.recras-onlinebooking > *:not(.latestError) {
    padding: 1em 0;
}
.recras-onlinebooking > *:not(:first-child) + * {
    border-top: 2px solid #dedede; /* Any love for Kirby out there? */
}
.recras-contactform div, .recras-amountsform div {
    align-items: start;
    display: flex;
    justify-content: space-between;
    padding: 0.25em 0;
}
.time-preview, .minimum-amount {
    padding-left: 0.5em;
} 
.minimum-amount {
    color: hsl(0, 50%, 50%);
}
`;
        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;
        this.languageHelper.setCurrency(options);

        this.element = this.options.getElement();
        this.element.classList.add('recras-onlinebooking');

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', '),
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        this.loadCSS(CSS);
        this.clearAll();

        this.getPackages().then(packages => {
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
            hasAtLeastOneProduct = true;
        }
        return hasAtLeastOneProduct;
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    applyVoucher(packageID, voucherCode) {
        let statusEl = this.findElement('.voucher-status');
        if (statusEl) {
            statusEl.innerHTML = '';
        } else {
            this.element.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', `<span class="voucher-status"></span>`);
            statusEl = this.findElement('.voucher-status');
        }

        if (!voucherCode) {
            statusEl.innerHTML = this.languageHelper.translate('VOUCHER_EMPTY');
            statusEl.innerHTML= this.languageHelper.translate('VOUCHER_EMPTY');
            return false;
        }
        if (this.appliedVouchers[voucherCode]) {
            statusEl.innerHTML = this.languageHelper.translate('VOUCHER_ALREADY_APPLIED');
            return false;
        }
        let date = this.findElement('.recras-onlinebooking-date').value;
        if (isNaN(Date.parse(date))) {
            statusEl.innerHTML = this.languageHelper.translate('DATE_INVALID');
            return false;
        }

        this.postJson('onlineboeking/controleervoucher', {
            arrangement_id: packageID,
            datum: RecrasDateHelper.datePartOnly(new Date(date)),
            producten: this.productCounts(),
            vouchers: [voucherCode],
        }).then(json => {
            let result = json[voucherCode];
            if (!result.valid) {
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_INVALID');
                return false;
            }

            this.appliedVouchers[voucherCode] = result.processed;
            this.showTotalPrice();

            statusEl.innerHTML = this.languageHelper.translate('VOUCHER_APPLIED');
        });
    }

    bookingSize() {
        let bookingSizeEl = this.findElement('.bookingsize');
        if (!bookingSizeEl) {
            return 0;
        }
        return bookingSizeEl.value;
    }

    changePackage(packageID) {
        let selectedPackage = this.packages.filter(p => {
            return p.id === packageID;
        });

        this.appliedVouchers = {};
        this.discount = null;

        this.clearAll();

        if (selectedPackage.length === 0) {
            // Reset form
            this.selectedPackage = null;
            this.showPackages(this.packages);
            return false;
        }
        this.selectedPackage = selectedPackage[0];
        this.showProducts(this.selectedPackage);
        this.checkDependencies();
        this.showDateTimeSelection(this.selectedPackage).then(() => {
            this.showContactForm(this.selectedPackage);
        });
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
        });

        this.maybeDisableBookButton();
    }

    checkDiscountcode(packageID, date, code) {
        let statusEl = this.findElement('.discount-status');
        if (statusEl) {
            statusEl.parentNode.removeChild(statusEl);
        }
        return this.fetchJson(this.options.getApiBase() + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code)
            .then(discount => {
                if (discount === false) {
                    this.findElement('.recras-discountcode').insertAdjacentHTML('beforeend', `<span class="discount-status">${ this.languageHelper.translate('DISCOUNT_INVALID') }</span>`);
                    return;
                }
                discount.code = code;
                this.discount = discount;

                this.showTotalPrice();
            });
    }

    checkMinimumAmounts() {
        [...this.findElements('.minimum-amount')].forEach(el => {
            el.parentNode.removeChild(el);
        });

        let selectedProducts = this.productCounts();
        selectedProducts.forEach(p => {
            if (p.aantal > 0) {
                let packageLineID = p.arrangementsregel_id;

                let packageLine = this.findProduct(packageLineID);
                if (p.aantal < packageLine.aantal_personen) {
                    let input = this.findElement(`[data-package-id="${ packageLineID }"]`);
                    let label = this.findElement(`label[for="${ input.id }"]`);

                    let warnEl = document.createElement('span');
                    warnEl.classList.add('minimum-amount');
                    warnEl.innerHTML = this.languageHelper.translate('PRODUCT_MINIMUM', {
                        MINIMUM: packageLine.aantal_personen,
                    });
                    label.parentNode.appendChild(warnEl);
                }
            }
        });
    }

    clearAll() {
        if (this.datePicker) {
            this.datePicker.destroy();
        }
        [...this.element.children].forEach(el => {
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
        this.findElement('.latestError').innerHTML = `<strong>{ this.languageHelper.translate('ERR_GENERAL') }</strong><p>${ msg }</p>`;
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

    generateContactForm() {
        let contactForm = {};
        [...this.findElements('[id^="contactformulier-"]')].forEach(field => {
            contactForm[field.dataset.identifier] = field.value;
        });
        return contactForm;
    }

    getAvailableDays(packageID, begin, end) {
        return this.postJson('onlineboeking/beschikbaredagen', {
            arrangement_id: packageID,
            begin: RecrasDateHelper.datePartOnly(begin),
            eind: RecrasDateHelper.datePartOnly(end),
            producten: this.productCounts(),
        }).then(json => {
            this.availableDays = json;
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

    getContactFormFields(pack) {
        return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden')
            .then(json => {
                this.contactFormFields = json;
                return this.contactFormFields;
            });
    }

    getCountryList(locale) {
        return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + locale + '/country.json')
            .then(json => {
                this.countries = json;
                return this.countries;
            });
    }

    getDiscountPrice(discount) {
        if (!discount) {
            return 0;
        }
        return (discount.percentage / 100) * this.getSubTotal() * -1;
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
            total += (line.aantal * product.verkoop);
        });
        return total;
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

    loadCSS(content) {
        let styleEl = document.createElement('style');
        styleEl.innerHTML = content;

        let refNode = document.head;
        refNode.parentNode.insertBefore(styleEl, refNode);
    }

    maybeDisableBookButton() {
        let button = this.findElement('.bookPackage');
        if (!button) {
            return false;
        }

        let shouldDisable = false;
        if (this.requiresProduct) {
            shouldDisable = true;
        }
        if (!this.amountsValid(this.selectedPackage)) {
            shouldDisable = true;
        }
        if (!this.findElement('.recras-onlinebooking-date').value) {
            shouldDisable = true;
        }
        if (!this.findElement('.recras-onlinebooking-time').value) {
            shouldDisable = true;
        }
        if (!this.findElement('.recras-contactform').checkValidity()) {
            shouldDisable = true;
        }

        if (shouldDisable) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    }

    postJson(url, data) {
        return fetch(this.options.getApiBase() + url, {
            body: JSON.stringify(data),
            method: 'post',
        }).then(response => {
            if (response.status < 200 || response.status >= 400) {
                this.error(response.status + ' ' + response.statusText);
                return false;
            }
            return response.json();
        }).then(json => {
            return json;
        }).catch(err => {
            this.error(err);
        });
    }

    normaliseDate(date, packageStart, bookingStart) {
        let diffSeconds = (date - packageStart) / 1000;
        return new Date(bookingStart.setSeconds(bookingStart.getSeconds() + diffSeconds));
    }

    previewTimes() {
        [...this.findElements('.time-preview')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        if (this.selectedTime) {
            let linesWithTime = this.selectedPackage.regels.filter(line => !!line.begin);
            let linesBegin = linesWithTime.map(line => new Date(line.begin));
            let packageStart = new Date(Math.min(...linesBegin)); // Math.min transforms dates to timestamps

            let bookingStart = this.selectedDate;
            bookingStart = RecrasDateHelper.setTimeForDate(bookingStart, this.selectedTime);

            let linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
            linesNoBookingSize.forEach((line, idx) => {
                let normalisedStart = this.normaliseDate(new Date(line.begin), packageStart, bookingStart);
                let normalisedEnd = this.normaliseDate(new Date(line.eind), packageStart, bookingStart);
                this.findElement(`label[for="packageline${ idx }"]`).insertAdjacentHTML(
                    'beforeend',
                    `<span class="time-preview">(${ RecrasDateHelper.timePartOnly(normalisedStart) } – ${ RecrasDateHelper.timePartOnly(normalisedEnd) })</span>`
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
        return counts;
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

    setHtml(msg) {
        this.element.innerHTML = msg;
    }

    showTotalPrice() {
        [...this.findElements('.discountLine, .voucherLine, .priceTotal')].forEach(el => {
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
            html += `<div class="priceTotal"><div>${ this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT') }</div><div>${ this.formatPrice(this.getTotalPrice()) }</div></div>`;
        }

        this.findElement('.priceLine').parentElement.insertAdjacentHTML('beforeend', html);
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
                return -1;
            }
            return 0;
        });
    }

    shouldShowBookingSize(pack) {
        return pack.regels.filter(line => {
            return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
        }).length > 0;
    }

    showBookButton() {
        let html = `<div><button type="submit" class="bookPackage" disabled>${ this.languageHelper.translate('BUTTON_BOOK_NOW') }</button></div>`;
        this.appendHtml(html);
        this.findElement('.bookPackage').addEventListener('click', this.submitBooking.bind(this));
    }

    showDiscountFields() {
        [...this.findElements('.recras-discountcode, .recras-vouchers')].forEach(el => {
            el.parentNode.removeChild(el);
        });

        let html = `
            <div class="recras-discountcode">
                <label for="discountcode">${ this.languageHelper.translate('DISCOUNT_CODE') }</label>
                <input type="text" id="discountcode" class="discountcode" maxlength="50">
                <button>${ this.languageHelper.translate('DISCOUNT_CHECK') }</button>
            </div>
            <div class="recras-vouchers">
                <div>
                    <label for="voucher">${ this.languageHelper.translate('VOUCHER') }</label>
                    <input type="text" class="voucher" maxlength="50">
                    <button>${ this.languageHelper.translate('VOUCHER_APPLY') }</button>
                </div>
            </div>
        `;
        this.findElement('.recras-contactform').insertAdjacentHTML('beforebegin', html);

        this.findElement('.recras-discountcode > button').addEventListener('click', () => {
            this.checkDiscountcode(
                this.selectedPackage.id,
                this.findElement('.recras-onlinebooking-date').value,
                this.findElement('.discountcode').value
            );
        });
        this.findElement('.recras-vouchers button').addEventListener('click', e => {
            this.applyVoucher(this.selectedPackage.id, e.srcElement.parentElement.querySelector('input').value.trim());
        });
    }

    showContactForm(pack) {
        this.getContactFormFields(pack).then(fields => {
            fields = fields.sort((a, b) => {
                return a.sort_order - b.sort_order;
            });

            let waitFor = [];

            let hasCountryField = fields.filter(field => {
                return field.field_identifier === 'contact.landcode';
            }).length > 0;

            if (hasCountryField) {
                waitFor.push(this.getCountryList(this.languageHelper.locale));
            }
            Promise.all(waitFor).then(() => {
                let html = '<form class="recras-contactform">';
                fields.forEach((field, idx) => {
                    html += '<div>' + this.showContactFormField(field, idx) + '</div>';
                });
                html += '</form>';
                this.appendHtml(html);
                this.showBookButton();

                [...this.findElements('[id^="contactformulier-"]')].forEach(el => {
                    el.addEventListener('change', this.maybeDisableBookButton.bind(this));
                });
            });
        });
    }

    showContactFormField(field, idx) {
        if (field.soort_invoer === 'header') {
            return `<h3>${ field.naam }</h3>`;
        }

        let label = this.showContactFormLabel(field, idx);
        let attrRequired = field.verplicht ? 'required' : '';
        let html;
        let fixedAttributes = `id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } data-identifier="${ field.field_identifier }"`;
        switch (field.soort_invoer) {
            case 'contactpersoon.geslacht':
                html = `<select ${ fixedAttributes } autocomplete="sex">`;
                Object.keys(this.GENDERS).forEach(key => {
                    html += `<option value="${ key }">${ this.languageHelper.translate(this.GENDERS[key]) }`;
                });
                html += '</select>';
                return label + html;
            case 'keuze':
                html = `<select ${ fixedAttributes } multiple>`;
                field.mogelijke_keuzes.forEach(choice => {
                    html += `<option value="${ choice }">${ choice }`;
                });
                html += '</select>';
                return label + html;
            case 'veel_tekst':
                return label + `<textarea ${ fixedAttributes }></textarea>`;
            case 'contactpersoon.telefoon1':
                return label + `<input type="tel" ${ fixedAttributes } autocomplete="tel">`;
            case 'contactpersoon.email1':
                return label + `<input type="email" ${ fixedAttributes } autocomplete="email">`;
            case 'contactpersoon.nieuwsbrieven':
                html = `<select ${ fixedAttributes } multiple>`;
                Object.keys(field.newsletter_options).forEach(key => {
                    html += `<option value="${ key }">${ field.newsletter_options[key] }`;
                });
                html += '</select>';
                return label + html;
            case 'contact.landcode':
                html = `<select ${ fixedAttributes }>`;
                Object.keys(this.countries).forEach(code => {
                    html += `<option value="${ code }">${ this.countries[code] }`;
                });
                html += '</select>';
                return label + html;
            default:
                let autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                return label + `<input type="text" ${ fixedAttributes } autocomplete="${ autocomplete }">`;
        }
    }

    showContactFormLabel(field, idx) {
        let labelText = field.naam;
        if (field.verplicht) {
            labelText += `<span title="${ this.languageHelper.translate('ATTR_REQUIRED') }">*</span>`;
        }
        return `<label for="contactformulier-${ idx }">${ labelText }</label>`;
    }

    showDateTimeSelection(pack) {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        return this.getAvailableDays(pack.id, startDate, endDate)
            .then(() => {
                let today = RecrasDateHelper.datePartOnly(new Date());
                let html = `<div class="recras-datetime">`;
                html += `<label for="recras-onlinebooking-date">${ this.languageHelper.translate('DATE') }</label><input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="${ today }" disabled>`;
                html += `<label for="recras-onlinebooking-time">${ this.languageHelper.translate('TIME') }</label><select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled></select>`;
                html += '</div>';
                this.appendHtml(html);

                this.datePicker = new Pikaday({
                    disableDayFn: (day) => {
                        let dateFmt = RecrasDateHelper.datePartOnly(day);
                        return this.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: this.findElement('.recras-onlinebooking-date'),
                    firstDay: 1, // Monday
                    format: 'yyyy-MM-dd', //Only used when Moment is loaded?
                    /*i18n: {}*/ //TODO: i18n
                    minDate: new Date(),
                    numberOfMonths: 2,
                    onDraw: () => {
                        //TODO: callback function for when the picker draws a new month
                    },
                    onSelect: (date) => {
                        this.selectedDate = date;
                        this.getAvailableTimes(pack.id, date).then(times => {
                            times = times.map(time => RecrasDateHelper.timePartOnly(new Date(time)));
                            this.showTimes(times);
                        });
                        this.showDiscountFields();
                    },
                    toString: (date) => RecrasDateHelper.datePartOnly(date),
                });

                this.findElement('.recras-onlinebooking-time').addEventListener('change', () => {
                    this.selectedTime = this.findElement('.recras-onlinebooking-time').value;
                    this.previewTimes();
                });
            });
    }

    showPackages(packages) {
        packages = packages.filter(p => {
            return p.mag_online;
        });
        let packagesSorted = this.sortPackages(packages);
        let packageOptions = packagesSorted.map(pack => {
            return `<option value="${ pack.id }">${ pack.weergavenaam || pack.arrangement }`;
        });

        let html = '<select class="recras-package-selection"><option>' + packageOptions.join('') + '</select>';
        this.appendHtml(`<div class="recras-package-select"><p>TODO: tekst pre</p>${ html }<p>TODO: tekst post</p></div>`);

        let packageSelectEl = this.findElement('.recras-package-selection');
        packageSelectEl.addEventListener('change', () => {
            let selectedPackageId = parseInt(packageSelectEl.value, 10);
            this.changePackage(selectedPackageId);
        });
    }

    showProducts(pack) {
        let html = '<div class="recras-amountsform">';

        if (this.shouldShowBookingSize(pack)) {
            html += `<div><div><label for="bookingsize">${ (pack.weergavenaam || pack.arrangement) }</label></div><input type="number" id="bookingsize" class="bookingsize" min="0"></div>`;
        }

        let linesNoBookingSize = this.getLinesNoBookingSize(pack);
        linesNoBookingSize.forEach((line, idx) => {
            html += '<div><div>';
            html += `<label for="packageline${ idx }">${ line.beschrijving_templated }</label>`;
            let maxAttr = line.max ? `max="${ line.max }"` : '';
            html += `</div><input id="packageline${ idx }" type="number" min="0" ${ maxAttr } data-package-id="${ line.id }">`;
            html += `<div class="recras-price">${ this.formatPrice(line.product.verkoop) }</div>`;
            html += '</div>';
        });
        html += `<div class="priceLine"><div>${ this.languageHelper.translate('PRICE_TOTAL') }</div><div class="priceSubtotal"></div>`;
        html += '</div>';
        this.appendHtml(html);

        [...this.findElements('[id^="packageline"], .bookingsize')].forEach(el => {
            el.addEventListener('input', this.updateProductAmounts.bind(this));
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

    submitBooking() {
        let bookingStart = this.selectedDate;
        bookingStart = RecrasDateHelper.setTimeForDate(bookingStart, this.selectedTime);

        let productCounts = this.productCounts().map(line => line.aantal);
        let productSum = productCounts.reduce((a, b) => a + b, 0);
        if (this.bookingSize() === 0 && productSum === 0) {
            window.alert(this.languageHelper.translate('NO_PRODUCTS'));
            return false;
        }

        this.findElement('.bookPackage').setAttribute('disabled', 'disabled');
        //console.log(this.selectedDate, this.selectedTime, this.findElement('.recras-onlinebooking-date').value);

        let vouchers = Object.keys(this.appliedVouchers).length > 0 ? Object.keys(this.appliedVouchers) : null;
        let bookingParams = {
            arrangement_id: this.selectedPackage.id,
            begin: bookingStart,
            betaalmethode: 'mollie',
            contactformulier: this.generateContactForm(),
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
            //console.log('reserveer', json);
            this.findElement('.bookPackage').removeAttribute('disabled');

            if (typeof json.boeking_id !== 'undefined') {
                //TODO
            } else {
                if (json.payment_url) {
                    window.location.href = json.payment_url;
                }
            }
        });
    }

    /*translate(string, vars = {}) {
        return this.languageHelper.translate(string, vars);
    }*/

    updateProductAmounts() {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        this.getAvailableDays(this.selectedPackage.id, startDate, endDate)
            .then(availableDays => {
                let datePickerEl = this.findElement('.recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    this.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

        this.checkDependencies();
        this.checkMinimumAmounts();
        this.showTotalPrice();
    }
}
