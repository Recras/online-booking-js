class RecrasContactForm {
    constructor(options = {}) {
        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
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

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);
        this.postJson = (url, data) => RecrasHttpHelper.postJson(this.options.getApiBase() + url, data, this.error);

        RecrasCSSHelper.loadCSS(RecrasCSSHelper.cssGlobal());

        this.GENDERS = {
            onbekend: 'GENDER_UNKNOWN',
            man: 'GENDER_MALE',
            vrouw: 'GENDER_FEMALE',
        };
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control
        this.AUTOCOMPLETE_OPTIONS = {
            'contact.naam': 'organization',
            'contact.website': 'url',
            'contactpersoon.achternaam': 'family-name',
            'contactpersoon.adres': 'address-line1',
            'contactpersoon.plaats': 'address-level2',
            'contactpersoon.postcode': 'postal-code',
            'contactpersoon.voornaam': 'given-name',
        };
    }

    checkRequiredCheckboxes() {
        this.removeWarnings();
        let isOkay = true;
        [...this.findElements('.checkboxGroupRequired')].forEach(group => {
            let checked = group.querySelectorAll('input:checked');
            if (checked.length === 0) {
                group.parentNode.querySelector('label').insertAdjacentHTML('beforeend', `<div class="recrasError">${ this.languageHelper.translate('CONTACT_FORM_CHECKBOX_REQUIRED') }</div>`);
                isOkay = false;
            }
            [...group.querySelectorAll('input')].forEach(el => {
                el.addEventListener('change', this.checkRequiredCheckboxes.bind(this));
            })
        });
        return isOkay;
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    findElement(querystring) {
        return this.element.querySelector(querystring);
    }

    findElements(querystring) {
        return this.element.querySelectorAll(querystring);
    }

    generateForm(extraOptions = {}) {
        let waitFor = [];

        if (this.hasCountryField()) {
            waitFor.push(this.getCountryList());
        }
        if (this.hasPackageField()) {
            waitFor.push(this.getPackages(this.options.getFormId()));
        }
        return Promise.all(waitFor).then(() => {
            let html = '<form class="recras-contactform">';
            if (extraOptions.voucherQuantitySelector) {
                html += this.quantitySelector();
            }
            this.contactFormFields.forEach((field, idx) => {
                html += '<div>' + this.showField(field, idx) + '</div>';
            });
            if (extraOptions.showSubmit) {
                html += this.submitButtonHtml();
            }
            html += '</form>';

            return html;
        });
    }

    generateJson() {
        let formEl = this.options.getElement().querySelector('.recras-contactform');
        let elements = formEl.querySelectorAll('[id^="contactformulier-"], input[type="radio"]:checked');
        let contactForm = {};

        [...elements].forEach(field => {
            contactForm[field.dataset.identifier] = field.value;
        });
        [...formEl.querySelectorAll('input[type="checkbox"]:checked')].forEach(field => {
            if (contactForm[field.dataset.identifier] === undefined) {
                contactForm[field.dataset.identifier] = [];
            }
            contactForm[field.dataset.identifier].push(field.value);
        });

        return contactForm;
    }

    getContactFormFields() {
        return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + this.options.getFormId() + '/velden')
            .then(fields => {
                fields = fields.sort((a, b) => {
                    return a.sort_order - b.sort_order;
                });

                this.contactFormFields = fields;
                return this.contactFormFields;
            });
    }

    getCountryList() {
        return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + this.languageHelper.locale + '/country.json')
            .then(json => {
                this.countries = json;
                return this.countries;
            });
    }

    getPackages(contactFormID) {
        return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + contactFormID)
            .then(json => {
                this.packages = json.Arrangementen;
                return this.packages;
            });
    }

    hasFieldOfType(identifier) {
        return this.contactFormFields.filter(field => {
            return field.field_identifier === identifier;
        }).length > 0;
    }
    hasCountryField() {
        return this.hasFieldOfType('contact.landcode');
    }
    hasPackageField() {
        return this.hasFieldOfType('boeking.arrangement');
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

    quantitySelector() {
        return `<div><label for="number-of-vouchers">${ this.languageHelper.translate('VOUCHER_QUANTITY') }</label><input type="number" id="number-of-vouchers" class="number-of-vouchers" min="1" value="1" required></div>`;
    }

    removeWarnings() {
        [...this.findElements('.recrasError')].forEach(el => {
            el.parentNode.removeChild(el);
        });
    }

    showField(field, idx) {
        if (field.soort_invoer === 'header') {
            return `<h3>${ field.naam }</h3>`;
        }

        let label = this.showLabel(field, idx);
        let attrRequired = field.verplicht ? 'required' : '';
        let classes;
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
                classes = ['checkboxGroup'];
                if (field.verplicht) {
                    classes.push('checkboxGroupRequired');
                }

                html = `<div class="${ classes.join(' ') }">`;
                field.mogelijke_keuzes.forEach(choice => {
                    html += `<label><input type="checkbox" name="contactformulier${ idx }" value="${ choice }" data-identifier="${ field.field_identifier }">${ choice }</label>`;
                });
                html += '</div>';
                return label + html;
            case 'keuze_enkel':
                html = `<div class="radioGroup">`;
                field.mogelijke_keuzes.forEach(choice => {
                    html += `<label><input type="radio" name="contactformulier${ idx }" value="${ choice }"${ attrRequired } data-identifier="${ field.field_identifier }">${ choice }</label>`;
                });
                html += `</div>`;
                return label + html;
            case 'veel_tekst':
                return label + `<textarea ${ fixedAttributes }></textarea>`;
            case 'contactpersoon.telefoon1':
            case 'contactpersoon.telefoon2':
                return label + `<input type="tel" ${ fixedAttributes } autocomplete="tel">`;
            case 'contactpersoon.email1':
            case 'contactpersoon.email2':
                return label + `<input type="email" ${ fixedAttributes } autocomplete="email">`;
            case 'contactpersoon.nieuwsbrieven':
                classes = ['checkboxGroup'];
                if (field.verplicht) {
                    classes.push('checkboxGroupRequired');
                }

                html = `<div class="${ classes.join(' ') }">`;
                Object.keys(field.newsletter_options).forEach(key => {
                    html += `<label><input type="checkbox" name="contactformulier${ idx }" value="${ key }" data-identifier="${ field.field_identifier }">${ field.newsletter_options[key] }</label>`;
                });
                html += '</div>';
                return label + html;
            case 'contact.landcode':
                html = `<select ${ fixedAttributes } autocomplete="country">`;
                Object.keys(this.countries).forEach(code => {
                    let selectedText = code.toUpperCase() === this.languageHelper.getCountry() ? ' selected' : '';
                    html += `<option value="${ code }"${ selectedText }>${ this.countries[code] }`;
                });
                html += '</select>';
                return label + html;
            case 'boeking.datum': //TODO: add optional fallback
                const today = RecrasDateHelper.toString(new Date());
                return label + `<input type="date" ${ fixedAttributes } min="${ today }" pattern="[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[01])">`;
            case 'boeking.groepsgrootte':
                return label + `<input type="number" ${ fixedAttributes } min="1">`;
            case 'boeking.starttijd': //TODO: add optional fallback
                return label + `<input type="time" ${ fixedAttributes } pattern="(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9])">`;
            case 'boeking.arrangement':
                const preFilledPackage = this.options.getPackageId();

                html = `<select ${ fixedAttributes }>`;
                html += `<option value="">`;
                Object.values(this.packages).forEach(pack => {
                    const selText = preFilledPackage && preFilledPackage === pack.id ? 'selected' : '';
                    html += `<option value="${ pack.id }" ${ selText }>${ pack.arrangement }`;
                });
                html += '</select>';
                return label + html;
            case 'contact.website':
                //TODO: type=url ?
            default:
                let autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                return label + `<input type="text" ${ fixedAttributes } autocomplete="${ autocomplete }">`;
        }
    }

    showForm() {
        this.loadingIndicatorShow(this.element);
        this.getContactFormFields()
            .then(() => this.generateForm({
                showSubmit: true,
            }))
            .then(html => {
                this.appendHtml(html);
                this.findElement('.recras-contactform').addEventListener('submit', this.submitForm.bind(this));
                this.loadingIndicatorHide();
            });
    }

    showLabel(field, idx) {
        let labelText = field.naam;
        if (field.verplicht) {
            labelText += `<span class="recras-contactform-required" title="${ this.languageHelper.translate('ATTR_REQUIRED') }"></span>`;
        }
        return `<label for="contactformulier-${ idx }">${ labelText }</label>`;
    }

    submitButtonHtml() {
        return `<button type="submit" class="submitForm">${ this.languageHelper.translate('BUTTON_SUBMIT_CONTACT_FORM') }</button>`;
    }

    submitForm(e) {
        e.preventDefault();
        this.eventHelper.sendEvent(RecrasEventHelper.PREFIX_CONTACT_FORM, RecrasEventHelper.EVENT_CONTACT_FORM_SUBMIT);
        let submitButton = this.findElement('.submitForm');

        let status = this.checkRequiredCheckboxes();
        if (!status) {
            return false;
        }

        this.loadingIndicatorHide();
        this.loadingIndicatorShow(submitButton);

        submitButton.setAttribute('disabled', 'disabled');

        this.postJson('contactformulieren/' + this.options.getFormId() + '/opslaan', this.generateJson()).then(json => {
            submitButton.removeAttribute('disabled');
            this.loadingIndicatorHide();

            if (json.success) {
                if (this.options.getRedirectUrl()) {
                    window.top.location.href = this.options.getRedirectUrl();
                } else {
                    window.alert(this.languageHelper.translate('CONTACT_FORM_SUBMIT_SUCCESS'));
                    submitButton.parentNode.reset();
                }
            } else {
                window.alert(this.languageHelper.translate('CONTACT_FORM_SUBMIT_FAILED'));
            }
        });
        return false;
    }
}
