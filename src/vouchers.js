/****************************
 *  Recras voucher library  *
 *  v 0.0.1                 *
 ***************************/

class RecrasVoucher {
    constructor(options = {}) {
        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        this.element = this.options.getElement();
        this.element.classList.add('recras-buy-voucher');

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);
        this.postJson = (url, data) => RecrasHttpHelper.postJson(this.options.getApiBase() + url, data, this.error);

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', '),
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        this.languageHelper.setOptions(options)
            .then(() => this.getVoucherTemplates())
            .then(templates => this.showTemplates(templates));
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    buyTemplate() {
        this.findElement('.buyTemplate').setAttribute('disabled', 'disabled');

        let payload = {
            voucher_template_id: this.selectedTemplate.id,
            number_of_vouchers: 1, //TODO: add field to change this
            contact_form: this.contactForm.generateJson(),
        };
        if (this.options.getRedirectUrl()) {
            payload.redirect_url = this.options.getRedirectUrl();
        }
        this.postJson('vouchers/buy', payload)
            .then(json => {
                this.findElement('.buyTemplate').removeAttribute('disabled');

                if (json.payment_url) {
                    window.location.href = json.payment_url;
                } else {
                    console.log(result);
                }
            })
    }

    clearAll() {
        [...this.element.children].forEach(el => {
            el.parentNode.removeChild(el);
        });
        this.appendHtml(`<div class="latestError"></div>`);
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

    formatPrice(price) {
        return this.languageHelper.formatPrice(price);
    }

    getContactFormFields(template) {
        let contactForm = new RecrasContactForm(this.options);
        return contactForm.fromVoucherTemplate(template).then(formFields => {
            this.contactForm = contactForm;
            return formFields;
        });
    }

    getVoucherTemplates() {
        return this.fetchJson(this.options.getApiBase() + 'voucher_templates')
            .then(templates => {
                this.templates = templates;
                return templates;
            });
    }

    maybeDisableBuyButton() {
        let button = this.findElement('.buyTemplate');
        if (!button) {
            return false;
        }

        let shouldDisable = false;
        if (!this.findElement('.recras-contactform').checkValidity()) {
            shouldDisable = true;
        }

        if (shouldDisable) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    }

    showBuyButton() {
        let html = `<div><button type="submit" class="buyTemplate" disabled>${ this.languageHelper.translate('BUTTON_BUY_NOW') }</button></div>`;
        this.appendHtml(html);
        this.findElement('.buyTemplate').addEventListener('click', this.buyTemplate.bind(this));
    }

    showContactForm(templateId) {
        this.selectedTemplate = this.templates.filter(t => {
            return t.id === templateId;
        })[0];

        this.getContactFormFields(this.selectedTemplate).then(fields => {
            let waitFor = [];

            let hasCountryField = fields.filter(field => {
                return field.field_identifier === 'contact.landcode';
            }).length > 0;

            if (hasCountryField) {
                waitFor.push(this.contactForm.getCountryList());
            }
            Promise.all(waitFor).then(() => {
                let html = '<form class="recras-contactform">';
                fields.forEach((field, idx) => {
                    html += '<div>' + this.contactForm.showField(field, idx) + '</div>';
                });
                html += '</form>';
                this.appendHtml(html);
                this.showBuyButton();

                [...this.findElements('[id^="contactformulier-"]')].forEach(el => {
                    el.addEventListener('change', this.maybeDisableBuyButton.bind(this));
                });
            });

        });
    }

    showTemplates(templates) {
        let templateOptions = templates.map(template => `<option value="${ template.id }">${ template.name } (${ this.formatPrice(template.price) })`);
        let html = `<select class="recrasVoucherTemplates"><option>${ templateOptions.join('') }</select>`;
        this.appendHtml(`<div id="recras-voucher-templates">${ html }</div>`);

        let voucherSelectEl = this.findElement('.recrasVoucherTemplates');
        voucherSelectEl.addEventListener('change', () => {
            let selectedTemplateId = parseInt(voucherSelectEl.value, 10);
            this.showContactForm(selectedTemplateId);
        });
    }
}
