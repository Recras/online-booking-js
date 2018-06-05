class RecrasLanguageHelper {
    static defaultLocale = 'nl_NL';
    static validLocales = ['de_DE', 'en_GB', 'nl_NL'];

    constructor() {
        this.locale = this.defaultLocale;
        this.options = null;

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            de_DE: {
                AGREE_ATTACHMENTS: 'Ich stimme mit den folgenden Unterlagen:',
                ATTR_REQUIRED: 'Erforderlich',
                BUTTON_BOOK_NOW: 'Jetzt buchen',
                BUTTON_BUY_NOW: 'Jetzt kaufen',
                DATE: 'Datum',
                DATE_INVALID: 'Ungültiges datum',
                DATE_PICKER_NEXT_MONTH: 'Nächsten Monat',
                DATE_PICKER_PREVIOUS_MONTH: 'Vorheriger Monat',
                DATE_PICKER_MONTH_JANUARY: 'Januar',
                DATE_PICKER_MONTH_FEBRUARY: 'Februar',
                DATE_PICKER_MONTH_MARCH: 'März',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'Mai',
                DATE_PICKER_MONTH_JUNE: 'Juni',
                DATE_PICKER_MONTH_JULY: 'Juli',
                DATE_PICKER_MONTH_AUGUST: 'August',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'Oktober',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'Dezember',
                DATE_PICKER_DAY_MONDAY_LONG: 'Montag',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Mo',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Dienstag',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Di',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Mittwoch',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Mi',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Donnerstag',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Do',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Freitag',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Fr',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Samstag',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Sa',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Sonntag',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'So',
                DISCOUNT_CHECK: 'Überprüfen',
                DISCOUNT_CODE: 'Rabattcode',
                DISCOUNT_INVALID: 'Ungültiger Rabattcode',
                ERR_GENERAL: 'Etwas ist schief gelaufen:',
                ERR_INVALID_ELEMENT: 'Option "Element" ist kein gültiges Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" ist ungültig.',
                ERR_INVALID_LOCALE: 'Ungültiges Gebietsschema. Gültige Optionen sind: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ungültige redirect URL. Stellen Sie sicher, dass es mit http:// or https:// beginnt',
                ERR_NO_ELEMENT: 'Option "element" nicht eingestellt.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" nicht eingestellt.',
                GENDER_UNKNOWN: 'Unbekannte',
                GENDER_MALE: 'Mann',
                GENDER_FEMALE: 'Frau',
                LOADING: 'Wird geladen...',
                NO_PRODUCTS: 'Kein Produkt ausgewählt',
                PRICE_TOTAL: 'Insgesamt',
                PRICE_TOTAL_WITH_DISCOUNT: 'Insgesamt inklusive Rabatt',
                PRODUCT_MINIMUM: '(muss mindestens {MINIMUM} sein)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} benötigt {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} um auch gebucht zu werden.',
                TIME: 'Zeit',
                VOUCHER: 'Gutschein',
                VOUCHER_ALREADY_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLY: 'Einlösen',
                VOUCHER_EMPTY: 'Leerer Gutscheincode',
                VOUCHER_INVALID: 'Ungültiger Gutscheincode',
                VOUCHER_QUANTITY: 'Anzahl der Gutscheine',
                VOUCHERS_DISCOUNT: 'Rabatt von Gutschein(en)',
            },
            en_GB: {
                AGREE_ATTACHMENTS: 'I agree with the following documents:',
                ATTR_REQUIRED: 'Required',
                BUTTON_BOOK_NOW: 'Book now',
                BUTTON_BUY_NOW: 'Buy now',
                DATE: 'Date',
                DATE_INVALID: 'Invalid date',
                DATE_PICKER_NEXT_MONTH: 'Next month',
                DATE_PICKER_PREVIOUS_MONTH: 'Previous month',
                DATE_PICKER_MONTH_JANUARY: 'January',
                DATE_PICKER_MONTH_FEBRUARY: 'February',
                DATE_PICKER_MONTH_MARCH: 'March',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'May',
                DATE_PICKER_MONTH_JUNE: 'June',
                DATE_PICKER_MONTH_JULY: 'July',
                DATE_PICKER_MONTH_AUGUST: 'August',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'October',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'December',
                DATE_PICKER_DAY_MONDAY_LONG: 'Monday',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Mon',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Tuesday',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Tue',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Wednesday',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Wed',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Thursday',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Thu',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Friday',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Fri',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Saturday',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Sat',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Sunday',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'Sun',
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
                LOADING: 'Loading...',
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
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_INVALID: 'Invalid voucher code',
                VOUCHER_QUANTITY: 'Number of vouchers',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)',
            },
            nl_NL: {
                AGREE_ATTACHMENTS: 'Ik ga akkoord met de volgende gegevens:',
                ATTR_REQUIRED: 'Vereist',
                BUTTON_BOOK_NOW: 'Nu boeken',
                BUTTON_BUY_NOW: 'Nu kopen',
                DATE: 'Datum',
                DATE_INVALID: 'Ongeldige datum',
                DATE_PICKER_NEXT_MONTH: 'Volgende maand',
                DATE_PICKER_PREVIOUS_MONTH: 'Vorige maand',
                DATE_PICKER_MONTH_JANUARY: 'Januari',
                DATE_PICKER_MONTH_FEBRUARY: 'Februari',
                DATE_PICKER_MONTH_MARCH: 'Maart',
                DATE_PICKER_MONTH_APRIL: 'April',
                DATE_PICKER_MONTH_MAY: 'Mei',
                DATE_PICKER_MONTH_JUNE: 'Juni',
                DATE_PICKER_MONTH_JULY: 'Juli',
                DATE_PICKER_MONTH_AUGUST: 'Augustus',
                DATE_PICKER_MONTH_SEPTEMBER: 'September',
                DATE_PICKER_MONTH_OCTOBER: 'Oktober',
                DATE_PICKER_MONTH_NOVEMBER: 'November',
                DATE_PICKER_MONTH_DECEMBER: 'December',
                DATE_PICKER_DAY_MONDAY_LONG: 'Maandag',
                DATE_PICKER_DAY_MONDAY_SHORT: 'Ma',
                DATE_PICKER_DAY_TUESDAY_LONG: 'Dinsdag',
                DATE_PICKER_DAY_TUESDAY_SHORT: 'Di',
                DATE_PICKER_DAY_WEDNESDAY_LONG: 'Woensdag',
                DATE_PICKER_DAY_WEDNESDAY_SHORT: 'Wo',
                DATE_PICKER_DAY_THURSDAY_LONG: 'Donderdag',
                DATE_PICKER_DAY_THURSDAY_SHORT: 'Do',
                DATE_PICKER_DAY_FRIDAY_LONG: 'Vrijdag',
                DATE_PICKER_DAY_FRIDAY_SHORT: 'Vr',
                DATE_PICKER_DAY_SATURDAY_LONG: 'Zaterdag',
                DATE_PICKER_DAY_SATURDAY_SHORT: 'Za',
                DATE_PICKER_DAY_SUNDAY_LONG: 'Zondag',
                DATE_PICKER_DAY_SUNDAY_SHORT: 'Zo',
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
                LOADING: 'Laden...',
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
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_INVALID: 'Ongeldige tegoedbon',
                VOUCHER_QUANTITY: 'Aantal tegoedbonnen',
                VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)',
            }
        };
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    extractTags(msg) {
        let tags = msg.match(/{(.+?)}/g);
        if (!Array.isArray(tags)) {
            return [];
        }
        return tags.map(tag => tag.substring(1, tag.length - 1)); // Strip { and }
    }

    filterTags(msg, packageID) {
        return Promise.resolve(msg);
        /*let tags = this.extractTags(msg);
        if (tags.length === 0) {
            return Promise.resolve(msg);
        }

        return RecrasHttpHelper.postJson(
            this.options.getApiBase() + 'tagfilter',
            {
                tags: tags,
                context: {
                    packageID: packageID,
                },
            },
            this.error
        )
            .then(filtered => {
                Object.keys(filtered).forEach(tag => {
                    let regex = new RegExp('{' + tag + '}', 'g');
                    msg = msg.replace(regex, filtered[tag]);
                });
                return msg;
            });*/
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

    getCountry() {
        return this.locale.substr(3, 2); // nl_NL -> NL
    }

    static isValid(locale) {
        return (this.validLocales.indexOf(locale) > -1);
    }

    setCurrency() {
        const errorHandler = err => {
            this.currency = 'eur';
            this.error(err);
        };

        return RecrasHttpHelper.fetchJson(this.options.getApiBase() + 'instellingen/currency', errorHandler)
            .then(setting => {
                this.currency = setting.waarde;
            });
    }

    setLocale(locale) {
        this.locale = locale;
    }

    setOptions(options) {
        this.options = options;
        return this.setCurrency();
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
