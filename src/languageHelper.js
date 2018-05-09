class RecrasLanguageHelper {
    static defaultLocale = 'nl_NL';
    static validLocales = ['de_DE', 'en_GB', 'nl_NL'];

    constructor() {
        this.locale = this.defaultLocale;

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            en_GB: {
                ATTR_REQUIRED: 'Required',
                BUTTON_BOOK_NOW: 'Book now',
                DATE: 'Date',
                DATE_INVALID: 'Invalid date',
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_CODE: 'Discount code',
                DISCOUNT_INVALID: 'Invalid discount code',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Invalid redirect URL. Make sure you it starts with http:// or https://',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_MINIMUM: '(must be at least {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                VOUCHER: 'Voucher',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_APPLY: 'Apply',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_INVALID: 'Invalid voucher code',
            },
            nl_NL: {
                ATTR_REQUIRED: 'Vereist',
                BUTTON_BOOK_NOW: 'Nu boeken',
                DATE: 'Datum',
                DATE_INVALID: 'Ongeldige datum',
                DISCOUNT_CHECK: 'Controleren',
                DISCOUNT_CODE: 'Kortingscode',
                DISCOUNT_INVALID: 'Ongeldige kortingscode',
                ERR_GENERAL: 'Er ging iets mis:',
                ERR_INVALID_ELEMENT: 'Optie "element" is geen geldig Element',
                ERR_INVALID_HOSTNAME: 'Optie "recras_hostname" is ongeldig.',
                ERR_INVALID_LOCALE: 'Ongeldige locale. Geldige opties zijn: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ongeldige redirect-URL. Zorg ervoor dat deze begint met http:// of https://',
                ERR_NO_ELEMENT: 'Optie "element" niet ingesteld.',
                ERR_NO_HOSTNAME: 'Optie "recras_hostname" niet ingesteld.',
                GENDER_UNKNOWN: 'Onbekend',
                GENDER_MALE: 'Man',
                GENDER_FEMALE: 'Vrouw',
                NO_PRODUCTS: 'Geen product gekozen',
                PRICE_TOTAL: 'Totaal',
                PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
                PRODUCT_MINIMUM: '(moet minstens {MINIMUM} zijn)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
                TIME: 'Tijd',
                VOUCHER: 'Tegoedbon',
                VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
                VOUCHER_APPLIED: 'Tegoedbon toegepast',
                VOUCHER_APPLY: 'Toepassen',
                VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)',
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_INVALID: 'Ongeldige tegoedbon',
            }
        };
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    formatLocale(what) {
        switch (what) {
            case 'currency':
                return this.locale.replace('_', '-').toUpperCase();
            default:
                return this.locale;
        }
    }

    formatPrice(price) {
        return price.toLocaleString(this.formatLocale('currency'), {
            currency: this.currency,
            style: 'currency',
        });
    }

    static isValid(locale) {
        return (this.validLocales.indexOf(locale) > -1);
    }

    setCurrency(options) {
        const errorHandler = err => {
            this.currency = 'eur';
            this.error(err);
        };

        RecrasHttpHelper.fetchJson(options.getApiBase() + 'instellingen/currency', errorHandler)
            .then(setting => {
                this.currency = setting.waarde;
            });
    }

    setLocale(locale) {
        this.locale = locale;
    }

    translate(string, vars = {}) {
        let translated;
        if (this.i18n[this.locale] && this.i18n[this.locale][string]) {
            translated = this.i18n[this.locale][string];
        } else if (this.i18n.en_GB[string]) {
            translated = this.i18n.en_GB[string];
        } else {
            translated = string;
            console.warn('String not translated: ' + string);
        }
        if (Object.keys(vars).length > 0) {
            Object.keys(vars).forEach(key => {
                translated = translated.replace('{' + key + '}', vars[key]);
            });
        }
        return translated;
    }
}
