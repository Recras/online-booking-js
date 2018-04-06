/**********************************
*  Recras Online Booking library  *
*  v 0.1.0                        *
**********************************/
'use strict';

class RecrasDateHelper {
    static datePartOnly(date) {
        return date.toISOString().substr(0, 10); // Format as 2018-03-13
    }

    static timePartOnly(date) {
        return date.toTimeString().substr(0, 5); // Format at 09:00
    }
}

class RecrasBooking {
    constructor(options) {
        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';
        this.GENDERS = {
            onbekend: 'Unknown',
            man: 'Male',
            vrouw: 'Female',
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

.recras-onlinebooking > * {
    padding: 1em 0;
}
.recras-onlinebooking > * + * {
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
        const hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');
        const validLocales = ['de_DE', 'en_GB', 'nl_NL'];

        if (!options.element) {
            throw new Error('Option "element" not set.');
        }
        if (!options.recras_hostname) {
            throw new Error('Option "recras_hostname" not set.');
        }
        if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== '172.16.0.2') {
            throw new Error('Option "recras_hostname" is invalid.');
        }

        this.locale = 'nl_NL';
        if (options.locale) {
            if (validLocales.indexOf(options.locale) === -1) {
                console.warn('Invalid locale. Valid options are: ' + validLocales.join(', '));
            } else {
                this.locale = options.locale;
            }
        }

        this.element = options.element;
        this.apiBase = 'https://' + options.recras_hostname + '/api2/';
        if (options.recras_hostname === '172.16.0.2') {
            this.apiBase = this.apiBase.replace('https://', 'http://');
        }

        this.element.classList.add('recras-onlinebooking');
        this.loadCSS(CSS);

        this.getPackages().then(packages => {
            if (options.package_id) {
                this.changePackage(options.package_id);
            } else {
                this.showPackages(packages);
            }
        });
    }

    amountsValid() {
        let hasAtLeastOneProduct = false;
        this.getLinesNoBookingSize(this.selectedPackage).forEach(line => {
            if (line.aantal > 0) {
                hasAtLeastOneProduct = true;
            }
            if (line.aantal > 0 && line.aantal < line.aantal_personen) {
                return false;
            }
        });
        if (this.shouldShowBookingSize(this.selectedPackage) && this.bookingSize() > 0) {
            hasAtLeastOneProduct = true;
        }
        return hasAtLeastOneProduct;
    };

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    bookingSize() {
        let bookingSizeEl = document.getElementById('bookingsize');
        if (!bookingSizeEl) {
            return 0;
        }
        return bookingSizeEl.value;
    }

    changePackage(packageID) {
        let selectedPackage = this.packages.filter(p => {
            return p.id === packageID;
        });

        if (this.datePicker) {
            this.datePicker.destroy();
        }
        [...document.querySelectorAll('.recras-amountsform, .recras-datetime, .recras-contactform')].forEach(el => {
            el.parentNode.removeChild(el);
        });

        if (selectedPackage.length === 0) {
            // Reset form
            this.selectedPackage = null;
            this.showPackages(packages);
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
        [...document.querySelectorAll('.recras-product-dependency')].forEach(el => {
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
                        let message = `<span class="recras-product-dependency">${ line.aantal } ${ product.weergavenaam } requires ${ requiredAmount } ${ requiredProductName } to also be booked.</span>`;
                        document.querySelector('.recras-amountsform').insertAdjacentHTML('beforeend', message);
                    }
                });
            }
        });

        this.maybeDisableBookButton();
    }

    checkMinimumAmounts() {
        [...document.querySelectorAll('.minimum-amount')].forEach(el => {
            el.parentNode.removeChild(el);
        });

        let selectedProducts = this.productCounts();
        selectedProducts.forEach(p => {
            if (p.aantal > 0) {
                let packageLineID = p.arrangementsregel_id;

                let packageLine = this.findProduct(packageLineID);
                if (p.aantal < packageLine.aantal_personen) {
                    let input = document.querySelector(`[data-package-id="${ packageLineID }"]`);
                    let label = document.querySelector(`label[for="${ input.id }"]`);

                    let warnEl = document.createElement('span');
                    warnEl.classList.add('minimum-amount');
                    warnEl.innerHTML = `(must be at least ${ packageLine.aantal_personen })`;
                    label.parentNode.appendChild(warnEl);
                }
            }
        });
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
        this.setHtml(`<strong>Something went wrong:</strong><p>${ msg }</p>`);
    }

    fetchJson(url) {
        return fetch(url, {
            method: 'get',
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

    findProduct(packageLineID) {
        return this.selectedPackage.regels.filter(line => (line.id === packageLineID))[0];
    }

    getAvailableDays(packageID, begin, end) {
        return this.postJson(this.apiBase + 'onlineboeking/beschikbaredagen', {
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
        return this.postJson(this.apiBase + 'onlineboeking/beschikbaretijden', {
            arrangement_id: packageID,
            datum: RecrasDateHelper.datePartOnly(date),
            producten: this.productCounts(),
        }).then(json => {
            this.availableTimes = json;
            return this.availableTimes;
        });
    }

    getContactFormFields(pack) {
        return this.fetchJson(this.apiBase + 'contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden')
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

    getLinesNoBookingSize(pack) {
        return pack.regels.filter(line => (line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte'));
    }

    getPackages() {
        return this.fetchJson(this.apiBase + 'arrangementen')
            .then(json => {
                this.packages = json;
                return this.packages;
            });
    }

    getProductByID(id) {
        let products = this.selectedPackage.regels.map(r => r.product);
        return products.filter(p => (p.id === id))[0];
    }

    loadCSS(content) {
        let styleEl = document.createElement('style');
        styleEl.innerHTML = content;

        let refNode = document.head;
        refNode.parentNode.insertBefore(styleEl, refNode);
    }

    maybeDisableBookButton() {
        let button = document.getElementById('bookPackage');
        if (!button) {
            return false;
        }

        let shouldDisable = false;
        if (this.requiresProduct) {
            shouldDisable = true;
        }
        if (!this.amountsValid()) {
            shouldDisable = true;
        }
        if (!document.getElementById('recras-onlinebooking-date').value) {
            shouldDisable = true;
        }
        if (!document.getElementById('recras-onlinebooking-time').value) {
            shouldDisable = true;
        }
        if (!document.querySelector('.recras-contactform').checkValidity()) {
            shouldDisable = true;
        }

        if (shouldDisable) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    }

    postJson(url, data) {
        return fetch(url, {
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
        [...document.querySelectorAll('.time-preview')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        if (this.selectedTime) {
            let linesWithTime = this.selectedPackage.regels.filter(line => !!line.begin);
            let linesBegin = linesWithTime.map(line => new Date(line.begin));
            let packageStart = new Date(Math.min(...linesBegin)); // Math.min transforms dates to timestamps

            let bookingStart = this.selectedDate;
            bookingStart.setHours(this.selectedTime.substr(0, 2), this.selectedTime.substr(3, 2));

            let linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
            linesNoBookingSize.forEach((line, idx) => {
                let normalisedStart = this.normaliseDate(new Date(line.begin), packageStart, bookingStart);
                let normalisedEnd = this.normaliseDate(new Date(line.eind), packageStart, bookingStart);
                document.querySelector(`label[for="packageline${ idx }"]`).insertAdjacentHTML(
                    'beforeend',
                    `<span class="time-preview">(${ RecrasDateHelper.timePartOnly(normalisedStart) } – ${ RecrasDateHelper.timePartOnly(normalisedEnd) })</span>`
                );
            });
        }
    }

    productCounts() {
        let counts = [];
        [...document.querySelectorAll('[id^="packageline"]')].forEach(line => {
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
        let html = `<div><button type="submit" id="bookPackage" disabled>Book now</button></div>`;
        this.appendHtml(html);
        document.getElementById('bookPackage').addEventListener('click', this.submitBooking);
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
                waitFor.push(this.getCountryList(this.locale));
            }
            Promise.all(waitFor).then(() => {
                let html = '<form class="recras-contactform">';
                fields.forEach((field, idx) => {
                    html += '<div>' + this.showContactFormField(field, idx) + '</div>';
                });
                html += '</form>';
                this.appendHtml(html);
                this.showBookButton();

                [...document.querySelectorAll('[id^="contactformulier-"]')].forEach(el => {
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
        switch (field.soort_invoer) {
            case 'contactpersoon.geslacht':
                html = `<select id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } autocomplete="sex">`;
                Object.keys(this.GENDERS).forEach(key => {
                    html += `<option value="${ key }">${ this.GENDERS[key] }`;
                });
                html += '</select>';
                return label + html;
            case 'keuze':
                html = `<select id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } multiple>`;
                field.mogelijke_keuzes.forEach(choice => {
                    html += `<option value="${ choice }">${ choice }`;
                });
                html += '</select>';
                return label + html;
            case 'veel_tekst':
                return label + `<textarea id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired }></textarea>`;
            case 'contactpersoon.telefoon1':
                return label + `<input type="tel" id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } autocomplete="tel">`;
            case 'contactpersoon.email1':
                return label + `<input type="email" id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } autocomplete="email">`;
            case 'contactpersoon.nieuwsbrieven':
                html = `<select id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } multiple>`;
                Object.keys(field.newsletter_options).forEach(key => {
                    html += `<option value="${ key }">${ field.newsletter_options[key] }`;
                });
                html += '</select>';
                return label + html;
            case 'contact.landcode':
                html = `<select id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired }>`;
                Object.keys(this.countries).forEach(code => {
                    html += `<option value="${ code }">${ this.countries[code] }`;
                });
                html += '</select>';
                return label + html;
            default:
                let autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                return label + `<input type="text" id="contactformulier-${ idx }" name="contactformulier${ idx }" ${ attrRequired } autocomplete="${ autocomplete }">`;
        }
    }

    showContactFormLabel(field, idx) {
        let labelText = field.naam;
        if (field.verplicht) {
            labelText += '<span title="Required">*</span>';
        }
        return `<label for="contactformulier-${ idx }">${ labelText }</label>`;
    }

    showDateTimeSelection(pack) {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        return this.getAvailableDays(pack.id, startDate, endDate)
            .then(availableDays => {
                let today = RecrasDateHelper.datePartOnly(new Date());
                let html = `<div class="recras-datetime">`;
                html += `<label for="recras-onlinebooking-date">Date</label><input type="text" id="recras-onlinebooking-date" min="${ today }" disabled>`;
                html += '<label for="recras-onlinebooking-time">Time</label><select id="recras-onlinebooking-time" disabled></select>';
                html += '</div>';
                this.appendHtml(html);

                this.datePicker = new Pikaday({
                    disableDayFn: (day) => {
                        let dateFmt = RecrasDateHelper.datePartOnly(day);
                        //TODO: because of timezones, this is off by 1
                        return this.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: document.getElementById('recras-onlinebooking-date'),
                    firstDay: 1, // Monday
                    format: 'yyyy-MM-dd', //Only used when Moment is loaded?
                    /*i18n: {}*/
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
                    },
                    toString: (date) => RecrasDateHelper.datePartOnly(date),
                });

                document.getElementById('recras-onlinebooking-time').addEventListener('change', () => {
                    this.selectedTime = document.getElementById('recras-onlinebooking-time').value;
                    this.previewTimes();
                });
            });
    }

    showPackages(packages) {
        packages = packages.filter(p => {
            return p.mag_online;
        });
        let packagesSorted = this.sortPackages(packages);
        let options = packagesSorted.map(pack => {
            return `<option value="${ pack.id }">${ pack.weergavenaam || pack.arrangement }`;
        });

        let html = '<select id="recras-package-selection"><option>' + options.join('') + '</select>';
        this.setHtml(`<div class="recras-package-select"><p>TODO: tekst pre</p>${ html }<p>TODO: tekst post</p></div>`);

        let packageSelectEl = document.getElementById('recras-package-selection');
        packageSelectEl.addEventListener('change', () => {
            let selectedPackageId = parseInt(packageSelectEl.value, 10);
            this.changePackage(selectedPackageId);
        });
    }

    showProducts(pack) {
        let html = '<div class="recras-amountsform">';

        if (this.shouldShowBookingSize(pack)) {
            html += `<div><div><label for="bookingsize">${ (pack.weergavenaam || pack.arrangement) }</label></div><input type="number" id="bookingsize" min="0"></div>`;
        }

        let linesNoBookingSize = this.getLinesNoBookingSize(pack);
        linesNoBookingSize.forEach((line, idx) => {
            html += '<div><div>';
            html += `<label for="packageline${ idx }">${ line.beschrijving_templated }</label>`;
            let maxAttr = line.max ? `max="${ line.max }"` : '';
            html += `</div><input id="packageline${ idx }" type="number" min="0" ${ maxAttr } data-package-id="${ line.id }">`;
            html += '</div>';
        });
        html += '</div>';
        this.appendHtml(html);

        [...document.querySelectorAll('[id^="packageline"], #bookingsize')].forEach(el => {
            el.addEventListener('input', this.updateProductAmounts.bind(this));
        });
    }

    showTimes(times) {
        let html = `<option>`;
        times.forEach(time => {
            html += `<option value="${ time }">${ time }`;
        });
        document.getElementById('recras-onlinebooking-time').innerHTML = html;
        document.getElementById('recras-onlinebooking-time').removeAttribute('disabled');
    }

    clearTimes() {
        document.getElementById('recras-onlinebooking-time').innerHTML = '';
        document.getElementById('recras-onlinebooking-time').setAttribute('disabled', 'disabled');
    }

    submitBooking() {
        return false; //TODO
        /**************************************************/
        let productCounts = this.productCounts().map(line => line.aantal);
        let productSum = productCounts.reduce((a, b) => a + b, 0);
        if (this.bookingSize() === 0 && productSum === 0) {
            alert('No product selected');
            return false;
        }

        document.getElementById('bookPackage').setAttribute('disabled', 'disabled');
        console.log(this.selectedDate, this.selectedTime);

        let bookingParams = {
            arrangement_id: this.selectedPackage.id,
            producten: this.productCounts(),
            begin: null, //TODO: this.selectedDate, this.selectedTime
            betaalmethode: 'factuur', //TODO
            status: 'informatie', //TODO
            contactformulier: {}, //TODO
            stuur_bevestiging_email: true,
        };
        if (this.shouldShowBookingSize(this.selectedPackage)) {
            bookingParams.boekingsgrootte = this.bookingSize();
        }

        return this.postJson(this.apiBase + 'onlineboeking/reserveer', bookingParams).then(json => {
            document.getElementById('bookPackage').removeAttribute('disabled');

            if (typeof json.boeking_id !== 'undefined') {

            } else {
                alert('Yay!');
                this.resetForm();
            }
            console.log(json);
        });
    }

    updateProductAmounts() {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        this.getAvailableDays(this.selectedPackage.id, startDate, endDate)
            .then(availableDays => {
                let datePickerEl = document.getElementById('recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    this.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

        this.checkDependencies();
        this.checkMinimumAmounts();
    }
}
