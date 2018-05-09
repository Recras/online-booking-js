class RecrasOptions {
    static hostnameDebug = '172.16.0.2';

    constructor(options) {
        this.languageHelper = new RecrasLanguageHelper();
        this.validate(options);
        this.options = this.setOptions(options);
    }

    getApiBase() {
        return this.options.apiBase;
    }
    getElement() {
        return this.options.element;
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

    setOptions(options) {
        options.apiBase = 'https://' + options.recras_hostname + '/api2/';
        if (options.recras_hostname === '172.16.0.2') {
            options.apiBase = options.apiBase.replace('https://', 'http://');
        }
        return options;
    }

    validate(options) {
        const hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');

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
