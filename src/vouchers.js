class RecrasVoucher {
    constructor(options = {}) {
        this.languageHelper = new RecrasLanguageHelper();

        if ((options instanceof RecrasOptions) === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        this.eventHelper = new RecrasEventHelper();
        this.eventHelper.setEvents(this.options.getAnalyticsEvents());

        this.element = this.options.getElement();
        this.element.classList.add('recras-buy-voucher');

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);
        this.postJson = (url, data) => RecrasHttpHelper.postJson(this.options.getApiBase() + url, data, this.error);

        RecrasCSSHelper.loadCSS('global');

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
            .then(templates => {
                if (this.options.getVoucherTemplateId()) {
                    this.changeTemplate(this.options.getVoucherTemplateId());
                } else {
                    this.showTemplates(templates);
                }
            });
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    formatGA4Item() {
        return [
            {
                item_name: this.selectedTemplate.name,
                price: this.selectedTemplate.price,
                quantity: parseInt(this.findElement('#number-of-vouchers').value),
            }
        ];
    }

    buyTemplate() {
        let status = this.contactForm.checkRequiredCheckboxes();
        if (!status) {
            return false;
        }

        this.eventHelper.sendEvent(
            RecrasEventHelper.PREFIX_VOUCHER,
            RecrasEventHelper.EVENT_VOUCHER_VOUCHER_SUBMITTED,
            this.selectedTemplate.name,
            Math.round(this.totalPrice())
        );
        this.findElement('.buyTemplate').setAttribute('disabled', 'disabled');

        let payload = {
            voucher_template_id: this.selectedTemplate.id,
            number_of_vouchers: parseInt(this.findElement('.number-of-vouchers').value, 10),
            contact_form: this.contactForm.generateJson(),
        };
        if (this.options.getRedirectUrl()) {
            payload.redirect_url = this.options.getRedirectUrl();
        }
        this.postJson('vouchers/buy', payload)
            .then(json => {
                if (json.payment_url) {
                    this.eventHelper.sendEvent(
                        RecrasEventHelper.PREFIX_VOUCHER,
                        RecrasEventHelper.EVENT_VOUCHER_REDIRECT_PAYMENT,
                        null,
                        Math.round(this.totalPrice()),
                        {
                            currency: this.languageHelper.currency,
                            value: this.totalPrice(),
                            items: this.formatGA4Item(),
                        }
                    );
                    window.top.location.href = json.payment_url;
                } else {
                    console.log(json);
                }

                this.findElement('.buyTemplate').removeAttribute('disabled');
            });
    }

    changeTemplate(templateID) {
        this.selectedTemplate = this.templates.filter(t => {
            return t.id === templateID;
        })[0];

        this.clearAllExceptTemplateSelection();
        this.showContactForm(this.selectedTemplate);
        this.eventHelper.sendEvent(
            RecrasEventHelper.PREFIX_VOUCHER,
            RecrasEventHelper.EVENT_VOUCHER_TEMPLATE_CHANGED,
            null,
            templateID,
            {
                content_type: 'voucher',
                item_id: templateID,
            }
        );
    }

    clearAll() {
        this.clearElements(this.element.children);
    }

    clearAllExceptTemplateSelection() {
        let elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-voucher-templates)');
        this.clearElements(elements);
    }

    clearElements(elements) {
        [...elements].forEach(el => {
            el.parentNode.removeChild(el);
        });
        this.maybeAddLatestErrorElement();
    }

    error(msg) {
        this.maybeAddLatestErrorElement();
        this.findElement('.latestError').innerHTML = `<strong>${ this.languageHelper.translate('ERR_GENERAL') }</strong><p>${ msg }</p>`;
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

    getContactForm(template) {
        this.options.setOption('form_id', template.contactform_id);
        let contactForm = new RecrasContactForm(this.options);
        return contactForm.getContactFormFields().then(() => {
            this.contactForm = contactForm;
            return contactForm;
        });
    }

    getVoucherTemplates() {
        return this.fetchJson(this.options.getApiBase() + 'voucher_templates')
            .then(templates => {
                templates = templates.filter(template => !!template.contactform_id);
                this.templates = templates;
                return templates;
            });
    }

    maybeAddLatestErrorElement() {
        let errorEl = this.findElement('.latestError');
        if (!errorEl) {
            this.appendHtml(`<div class="latestError"></div>`);
        }
    }

    maybeDisableBuyButton() {
        let button = this.findElement('.buyTemplate');
        if (!button) {
            return false;
        }

        let shouldDisable = false;
        this.contactForm.removeErrors();
        if (this.contactForm.hasEmptyRequiredFields() || !this.contactForm.isValid() || !this.contactForm.checkRequiredCheckboxes()) {
            this.contactForm.showInlineErrors();
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

    showContactForm(template) {
        return this.getContactForm(template)
            .then(form => form.generateForm({
                voucherQuantitySelector: true,
                quantityTerm: this.selectedTemplate.quantity_term,
            }))
            .then(html => {
                this.appendHtml(html);
                this.showBuyButton();

                [...this.findElements('#number-of-vouchers, [name^="contactformulier"]')].forEach(el => {
                    el.addEventListener('change', this.maybeDisableBuyButton.bind(this));
                });
        });
    }

    showTemplates(templates) {
        let templateOptions = templates.map(template => `<option value="${ template.id }">${ template.name } (${ this.formatPrice(template.price) })`);
        let html = `<select class="recrasVoucherTemplates"><option>${ templateOptions.join('') }</select>`;
        this.appendHtml(`<div class="recras-voucher-templates">${ html }</div>`);

        let voucherSelectEl = this.findElement('.recrasVoucherTemplates');
        voucherSelectEl.addEventListener('change', () => {
            let selectedTemplateId = parseInt(voucherSelectEl.value, 10);
            this.changeTemplate(selectedTemplateId);
        });
    }

    totalPrice() {
        return this.selectedTemplate.price * this.findElement('#number-of-vouchers').value;
    }
}
