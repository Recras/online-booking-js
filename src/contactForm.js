class RecrasContactForm {
    constructor(options = {}) {
        this.languageHelper = new RecrasLanguageHelper();

        if (!(options instanceof RecrasOptions)) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        if (!this.options.getFormId()) {
            throw new Error(this.languageHelper.translate('ERR_NO_FORM'));
        }

        this.checkboxEventListeners = [];

        this.eventHelper = new RecrasEventHelper();
        this.eventHelper.setEvents(this.options.getAnalyticsEvents());

        this.element = this.options.getElement();
        this.element.classList.add('recras-contactform-wrapper');

        this.languageHelper.setOptions(options);
        if (RecrasLanguageHelper.isValid(this.options.getLocale())) {
            this.languageHelper.setLocale(this.options.getLocale());
        }

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error.bind(this));
        this.postJson = (url, data) => RecrasHttpHelper.postJson(this.options.getApiBase() + url, data, this.error.bind(this));

        RecrasCSSHelper.loadCSS('global');

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
                let elName = el.getAttribute('name');
                if (!this.checkboxEventListeners.includes(elName)) {
                    this.checkboxEventListeners.push(elName);
                    el.addEventListener('change', this.checkRequiredCheckboxes.bind(this));
                }
            });
        });
        return isOkay;
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    error(msg) {
        this.removeErrors('.recras-contactform');
        this.showInlineError(this.findElement('.submitForm'), msg);
    }

    findElement(querystring) {
        return this.element.querySelector(querystring);
    }

    findElements(querystring) {
        return this.element.querySelectorAll(querystring);
    }

    isStandalone(options) {
        if (options.showSubmit) {
            console.warn('Option "showSubmit" was renamed to "standalone". Please update your code.');
            options.standalone = true;
        }
        return !!options.standalone;
    }

    generateForm(extraOptions = {}) {
        let waitFor = [];

        if (this.hasCountryField()) {
            waitFor.push(this.getCountryList());
        }
        if (this.hasBookingDateField() || this.hasRelationDateField()) {
            waitFor.push(RecrasCalendarHelper.loadScript());
            RecrasCSSHelper.loadCSS('pikaday');
        }
        return Promise.all(waitFor).then(() => {
            const standalone = this.isStandalone(extraOptions);
            const validateText = standalone ? 'novalidate' : '';
            let html = `<form class="recras-contactform" ${ validateText }>`;
            if (extraOptions.voucherQuantitySelector) {
                html += this.quantitySelector(extraOptions.quantityTerm);
            }
            this.contactFormFields.forEach((field, idx) => {
                html += '<div>' + this.showField(field, idx) + '</div>';
            });
            if (standalone) {
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
        if (contactForm['boeking.datum']) {
            contactForm['boeking.datum'] = RecrasDateHelper.formatStringForAPI(contactForm['boeking.datum']);
        }

        return contactForm;
    }

    getContactFormFields() {
        return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + this.options.getFormId() + '?embed=Velden')
            .then(form => {
                this.contactFormFields = form.Velden;
                this.packages = this.sortPackages(form.Arrangementen);
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

    sortPackages(packs) {
        return packs.sort((a, b) => {
            // Prioritise package name
            if (a.arrangement < b.arrangement) {
                return -1;
            }
            if (a.arrangement > b.arrangement) {
                return 1;
            }
            // Sort by ID in the off chance that two packages are named the same
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }
            // This cannot happen
            return 0;
        });
    }

    getInvalidFields() {
        let invalid = [];
        let required = this.getEmptyRequiredFields();

        let els = this.findElements('.recras-contactform :invalid');
        for (let el of els) {
            if (!required.includes(el)) {
                invalid.push(el);
            }
        }
        return invalid;
    }

    getEmptyRequiredFields() {
        let isEmpty = [];
        let els = this.findElements('.recras-contactform :required');
        for (let el of els) {
            if (el.value === undefined || el.value === '') {
                isEmpty.push(el);
            }
        }
        return isEmpty;
    }
    getRelationExtraDateFields() {
        return this.contactFormFields.filter(
            field => field.soort_invoer === 'contact.extra' && field.input_type === 'date'
        );
    }

    hasFieldOfType(identifier) {
        return this.contactFormFields.filter(field => {
            return field.field_identifier === identifier;
        }).length > 0;
    }
    hasBookingDateField() {
        return this.hasFieldOfType('boeking.datum');
    }
    hasCountryField() {
        return this.hasFieldOfType('contact.landcode');
    }
    hasPackageField() {
        return this.hasFieldOfType('boeking.arrangement');
    }
    hasRelationDateField() {
        return this.getRelationExtraDateFields().length > 0;
    }

    isEmpty() {
        let els = this.findElements('.recras-contactform input, .recras-contactform select, .recras-contactform textarea');
        let formValues = [...els].map(el => el.value);
        return !formValues.some(v => v !== '');
    }

    isValid() {
        return this.findElement('.recras-contactform').checkValidity();
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

    quantitySelector(quantityTerm) {
        if (!quantityTerm) {
            quantityTerm = this.languageHelper.translate('VOUCHER_QUANTITY');
        }
        return `<div>
            <label for="number-of-vouchers">${ quantityTerm }</label>
            <input type="number" id="number-of-vouchers" class="number-of-vouchers" min="1" max="100" value="1" required>
        </div>`;
    }

    removeErrors(parentQuery = '') {
        [...this.findElements(parentQuery + ' .booking-error')].forEach(el => {
            el.parentNode.removeChild(el);
        });
    }

    removeWarnings() {
        [...this.findElements('.recrasError')].forEach(el => {
            el.parentNode.removeChild(el);
        });
        [...this.findElements('.recras-success')].forEach(el => {
            el.parentNode.removeChild(el);
        });
    }

    hasEmptyRequiredFields() {
        return this.getEmptyRequiredFields().length > 0;
    }

    showField(field, idx) {
        if (field.soort_invoer === 'header') {
            return `<h3>${ field.naam }</h3>`;
        }

        const today = RecrasDateHelper.toString(new Date());
        const timePattern = '(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9])';

        let label = this.showLabel(field, idx);
        let attrRequired = field.verplicht ? 'required' : '';
        let classes;
        let html;
        let placeholder;
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
            case 'contact.soort_klant':
                html = `<div class="radioGroup">`;
                field.mogelijke_keuzes.forEach(choice => {
                    html += `<label><input type="radio" name="contactformulier${ idx }" value="${ choice }" ${ attrRequired } data-identifier="${ field.field_identifier }">${ choice }</label>`;
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
                    let selectedText = code.toUpperCase() === this.options.getDefaultCountry() ? 'selected' : '';
                    html += `<option value="${ code }" ${ selectedText }>${ this.countries[code] }`;
                });
                html += '</select>';
                return label + html;
            case 'boeking.datum':
                placeholder = this.languageHelper.translate('DATE_FORMAT');
                return label + `<input type="text" ${ fixedAttributes } min="${ today }" placeholder="${ placeholder }" autocomplete="off">`;
            case 'boeking.groepsgrootte':
                return label + `<input type="number" ${ fixedAttributes } min="1">`;
            case 'boeking.starttijd':
                placeholder = this.languageHelper.translate('TIME_FORMAT');
                return label + `<input type="time" ${ fixedAttributes } placeholder="${ placeholder }" pattern="${ timePattern }" step="300">`;
            case 'boeking.arrangement':
                const preFilledPackage = this.options.getPackageId();
                if (field.verplicht && this.packages.length === 1) {
                    let pack = this.packages[0];
                    html = `<select ${ fixedAttributes }>
                        <option value="${ pack.id }" selected>${ pack.arrangement }
                    </select>`;
                    return label + html;
                }

                html = `<select ${ fixedAttributes }>`;
                html += `<option value="">`;
                this.packages.forEach(pack => {
                    const selText = preFilledPackage && preFilledPackage === pack.id ? 'selected' : '';
                    html += `<option value="${ pack.id }" ${ selText }>${ pack.arrangement }`;
                });
                html += '</select>';
                return label + html;
            case 'contact.extra':
                switch (field.input_type) {
                    case 'number':
                        return label + `<input type="number" ${ fixedAttributes } autocomplete="off">`;
                    case 'date':
                    case 'text':
                        return label + `<input type="text" ${ fixedAttributes } maxlength="200">`;
                    case 'multiplechoice':
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
                    case 'singlechoice':
                        html = `<div class="radioGroup">`;
                        field.mogelijke_keuzes.forEach(choice => {
                            html += `<label><input type="radio" name="contactformulier${ idx }" value="${ choice }" ${ attrRequired } data-identifier="${ field.field_identifier }">${ choice }</label>`;
                        });
                        html += `</div>`;
                        return label + html;
                    default:
                        console.debug('Unknown type', field.input_type, field);
                        return label + `<input type="text" ${ fixedAttributes }>`;
                }
            case 'contact.website':
                //TODO: type=url ?
            default:
                let autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                return label + `<input type="text" ${ fixedAttributes } autocomplete="${ autocomplete }">`;
        }
    }

    showForm() {
        this.loadingIndicatorShow(this.element);
        return this.getContactFormFields()
            .then(() => this.generateForm({
                standalone: true,
            }))
            .then(html => {
                this.appendHtml(html);
                this.findElement('.recras-contactform').addEventListener('submit', this.submitForm.bind(this));
                if (this.hasBookingDateField()) {
                    let pikadayOptions = Object.assign(
                        RecrasCalendarHelper.defaultOptions(),
                        {
                            field: this.findElement('[data-identifier="boeking.datum"]'),
                            i18n: RecrasCalendarHelper.i18n(this.languageHelper),
                            numberOfMonths: 1,
                        }
                    );
                    new Pikaday(pikadayOptions);
                }
                if (this.hasRelationDateField()) {
                    const fields = this.getRelationExtraDateFields();
                    const thisYear = (new Date()).getFullYear();
                    let pikadayOptions = Object.assign(
                        RecrasCalendarHelper.defaultOptions(),
                        {
                            i18n: RecrasCalendarHelper.i18n(this.languageHelper),
                            numberOfMonths: 1,
                            yearRange: [thisYear - 90, thisYear + 10]
                        }
                    );
                    delete pikadayOptions.minDate;
                    for (let field of fields) {
                        pikadayOptions.field = this.findElement(`[data-identifier="${ field.field_identifier }"]`);
                        new Pikaday(pikadayOptions);
                    }
                }
                this.loadingIndicatorHide();
            });
    }

    showInlineError(element, errorMsg) {
        element.parentNode.insertAdjacentHTML(
            'afterend',
            `<div class="booking-error">${ errorMsg }</div>`
        );
    }

    showInlineErrors() {
        for (let el of this.getEmptyRequiredFields()) {
            const labelEl = el.parentNode.querySelector('label');
            const requiredText = this.languageHelper.translate('CONTACT_FORM_FIELD_REQUIRED', {
                FIELD_NAME: labelEl.innerText,
            });
            el.parentNode.insertAdjacentHTML(
                'afterend',
                `<div class="booking-error">${ requiredText }</div>`
            );
        }
        for (let el of this.getInvalidFields()) {
            const labelEl = el.parentNode.querySelector('label');
            const invalidText = this.languageHelper.translate('CONTACT_FORM_FIELD_INVALID', {
                FIELD_NAME: labelEl.innerText,
            });
            this.showInlineError(el, invalidText);
        }
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

        let submitButton = this.findElement('.submitForm');

        this.removeErrors('.recras-contactform');
        if (this.isEmpty()) {
            submitButton.parentNode.insertAdjacentHTML(
                'beforeend',
                `<div class="booking-error">${ this.languageHelper.translate('ERR_CONTACT_FORM_EMPTY') }</div>`
            );
            return false;
        } else if (this.hasEmptyRequiredFields() || !this.isValid()) {
            this.showInlineErrors();
            return false;
        }

        if (!this.checkRequiredCheckboxes()) {
            return false;
        }

        this.eventHelper.sendEvent(
            RecrasEventHelper.PREFIX_CONTACT_FORM,
            RecrasEventHelper.EVENT_CONTACT_FORM_SUBMIT,
            null,
            this.options.getFormId()
        );

        this.loadingIndicatorHide();
        this.loadingIndicatorShow(submitButton);

        submitButton.setAttribute('disabled', 'disabled');

        this.postJson('contactformulieren/' + this.options.getFormId() + '/opslaan', this.generateJson()).then(json => {
            if (json.success) {
                if (this.options.getRedirectUrl()) {
                    window.top.location.href = this.options.getRedirectUrl();
                } else {
                    this.element.scrollIntoView({
                        behavior: 'smooth',
                    });
                    this.element.insertAdjacentHTML(
                        'afterbegin',
                        `<p class="recras-success">${ this.languageHelper.translate('CONTACT_FORM_SUBMIT_SUCCESS') }</p>`
                    );
                    submitButton.parentNode.reset();
                }
            } else {
                this.error(this.languageHelper.translate('CONTACT_FORM_SUBMIT_FAILED'));
            }
            submitButton.removeAttribute('disabled');
            this.loadingIndicatorHide();
        });
        return false;
    }
}
