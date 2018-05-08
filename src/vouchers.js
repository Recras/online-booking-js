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
        this.options = new RecrasOptions(options);
        this.languageHelper.setCurrency(options);

        this.element = this.options.getElement();
        this.element.classList.add('recras-buy-voucher');

        this.fetchJson = url => RecrasHttpHelper.fetchJson(url, this.error);

        this.getVoucherTemplates().then(templates => this.showTemplates(templates));
    }

    appendHtml(msg) {
        this.element.insertAdjacentHTML('beforeend', msg);
    }

    clearAll() {
        [...this.element.children].forEach(el => {
            el.parentNode.removeChild(el);
        });
        this.appendHtml(`<div id="latestError"></div>`); //TODO: this goes wrong when online booking script is also loaded
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    formatPrice(price) {
        return this.languageHelper.formatPrice(price);
    }

    getVoucherTemplates() {
        return this.fetchJson(this.options.getApiBase() + 'voucher_templates')
            .then(templates => {
                this.templates = templates;
                return templates;
            });
    }

    showTemplates(templates) {
        let vouchers = `<ol class="recrasVoucherTemplates">`;
        templates.forEach(template => {
            vouchers += `
<li data-template-id="${ template.id }">
    <span class="voucherTemplateName">${ template.name }</span>
    <span class="voucherTemplatePrice">${ this.formatPrice(template.price) }</span>
</li>`;
        });
        vouchers += `</ol>`;
        this.appendHtml(`<div id="recras-voucher-templates">${ vouchers }</div>`);
    }
}
