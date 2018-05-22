class RecrasContactForm {
    constructor(options = {}) {
        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;
        this.languageHelper.setOptions(options);
        if (RecrasLanguageHelper.isValid(this.options.getLocale())) {
            this.languageHelper.setLocale(this.options.getLocale());
        }

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);

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
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    fromPackage(pack) {
        return this.getContactFormFields(pack.onlineboeking_contactformulier_id);
    }

    fromVoucherTemplate(template) {
        return this.getContactFormFields(template.contactform_id);
    }

    generateJson() {
        let elements = this.options.getElement().querySelectorAll('[id^="contactformulier-"]');
        let contactForm = {};
        [...elements].forEach(field => {
            contactForm[field.dataset.identifier] = field.value;
        });
        return contactForm;
    }

    getContactFormFields(formId) {
        return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + formId + '/velden')
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

    showField(field, idx) {
        if (field.soort_invoer === 'header') {
            return `<h3>${ field.naam }</h3>`;
        }

        let label = this.showLabel(field, idx);
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
                    let selectedText = code.toUpperCase() === this.languageHelper.getCountry() ? ' selected' : '';
                    html += `<option value="${ code }"${ selectedText }>${ this.countries[code] }`;
                });
                html += '</select>';
                return label + html;
            default:
                let autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                return label + `<input type="text" ${ fixedAttributes } autocomplete="${ autocomplete }">`;
        }
    }

    showLabel(field, idx) {
        let labelText = field.naam;
        if (field.verplicht) {
            labelText += `<span class="recras-contactform-required" title="${ this.languageHelper.translate('ATTR_REQUIRED') }"></span>`;
        }
        return `<label for="contactformulier-${ idx }">${ labelText }</label>`;
    }
}
