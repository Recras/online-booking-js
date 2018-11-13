class RecrasOptions {
    static hostnameDebug = '172.16.0.2';

    constructor(options) {
        this.languageHelper = new RecrasLanguageHelper();
        this.validate(options);
        this.options = this.setOptions(options);
    }

    getApiBase() {
        return this.getHostname() + '/api2/';
    }
    getElement() {
        return this.options.element;
    }
    getFormId() {
        return this.options.form_id;
    }
    getHostname() {
        return this.options.hostname;
    }
    getLocale() {
        return this.options.locale;
    }
    getPackageId() {
        return this.options.package_id;
    }
    getRedirectUrl() {
        return this.options.redirect_url;
    }
    getVoucherTemplateId() {
        return this.options.voucher_template_id;
    }

    setOption(option, value) {
        this.options[option] = value;
    }

    setOptions(options) {
        let protocol = (options.recras_hostname === RecrasOptions.hostnameDebug) ? 'http' : 'https';
        options.hostname = protocol + '://' + options.recras_hostname;

        return options;
    }

    validate(options) {
        const hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/i);

        if (!options.element) {
            throw new Error(this.languageHelper.translate('ERR_NO_ELEMENT'));
        }
        if (options.element instanceof Element === false) {
            throw new Error(this.languageHelper.translate('ERR_INVALID_ELEMENT'));
        }

        if (!options.recras_hostname) {
            throw new Error(this.languageHelper.translate('ERR_NO_HOSTNAME'));
        }
        if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== RecrasOptions.hostnameDebug) {
            throw new Error(this.languageHelper.translate('ERR_INVALID_HOSTNAME'));
        }
        if (options.redirect_url) {
            if (options.redirect_url.indexOf('http://') === -1 && options.redirect_url.indexOf('https://') === -1) {
                throw new Error(this.languageHelper.translate('ERR_INVALID_REDIRECT_URL'));
            }
        }
    }
}
