class RecrasLanguageHelper {
    static validLocales = ['de_DE', 'en_GB', 'nl_NL'];

    constructor() {
        this.defaultLocale = 'nl_NL';
        this.locale = this.defaultLocale;
        this.options = null;

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            de_DE: {
                AGREE_ATTACHMENTS: 'Ich stimme den folgenden Unterlagen zu:',
                ATTR_REQUIRED: 'Erforderlich',
                BOOKING_DISABLED_AGREEMENT: 'Sie haben den Bedingungen noch nicht zugestimmt',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programmbeträge sind ungültig',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Das Kontaktformular ist nicht korrekt ausgefüllt',
                BOOKING_DISABLED_INVALID_DATE: 'Kein Datum ausgewählt',
                BOOKING_DISABLED_INVALID_TIME: 'Keine Zeit ausgewählt',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Erforderliches Produkt noch nicht ausgewählt',
                BUTTON_BOOK_NOW: 'Jetzt buchen',
                BUTTON_BUY_NOW: 'Jetzt kaufen',
                BUTTON_SUBMIT_CONTACT_FORM: 'Senden',
                CONTACT_FORM_CHECKBOX_REQUIRED: 'Es muss mindestens eine Option aktiviert sein',
                CONTACT_FORM_FIELD_INVALID: '"{FIELD_NAME}" ist ungültig',
                CONTACT_FORM_FIELD_REQUIRED: '"{FIELD_NAME}" ist ein erforderliches Feld',
                CONTACT_FORM_SUBMIT_FAILED: 'Das Kontaktformular konnte nicht gesendet werden. Bitte versuchen Sie es später noch einmal.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'Das Kontaktformular wurde erfolgreich gesendet.',
                DATE: 'Datum',
                DATE_FORMAT: 'TT-MM-JJJJ',
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
                DISCOUNT_APPLIED: 'Rabatt eingelöst',
                DISCOUNT_CHECK: 'Überprüfen',
                DISCOUNT_TITLE: 'Rabattcode oder Gutschein',
                DISCOUNT_INVALID: 'Ungültiger Rabattcode oder Gutschein',
                ERR_AMOUNTS_NO_PACKAGE: 'Die Option "productAmounts" ist gesetzt, aber "package_id" ist nicht gesetzt',
                ERR_CONTACT_FORM_EMPTY: 'Das Kontaktformular ist nicht ausgefüllt',
                ERR_DATE_NO_SINGLE_PACKAGE: 'Die Option "date" erfordert ein einzelnes vorgefülltes Arrangement ("package_id")',
                ERR_DATE_PAST: 'Option "date" ist ein Datum in der Vergangenheit',
                ERR_GENERAL: 'Etwas ist schief gelaufen:',
                ERR_INVALID_DATE: 'Die Option "date" ist keine gültige ISO 8601-Datumszeichenfolge (z. B. "2019-06-28")',
                ERR_INVALID_ELEMENT: 'Option "Element" ist kein gültiges Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" ist ungültig.',
                ERR_INVALID_LOCALE: 'Ungültiges Gebietsschema. Gültige Optionen sind: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ungültige redirect URL. Stellen Sie sicher, dass es mit http:// or https:// beginnt',
                ERR_INVALID_TIME: 'Die Option "time" ist keine gültige Zeitzeichenfolge (z. B. "16:15")',
                ERR_NO_ELEMENT: 'Option "element" nicht eingestellt.',
                ERR_NO_FORM: 'Option "form_id" nicht eingestellt.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" nicht eingestellt.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unbekannte',
                GENDER_MALE: 'Mann',
                GENDER_FEMALE: 'Frau',
                HEADING_PRICE: 'Preis',
                HEADING_QUANTITY: 'Anzahl',
                LOADING: 'Wird geladen...',
                NO_PRODUCTS: 'Kein Produkt ausgewählt',
                PRICE_TOTAL: 'Insgesamt',
                PRICE_TOTAL_WITH_DISCOUNT: 'Insgesamt inklusive Rabatt',
                PRODUCT_MAXIMUM: '(höchstens {MAXIMUM})',
                PRODUCT_MINIMUM: '(mindestens {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} benötigt {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} um auch gebucht zu werden.',
                TIME: 'Zeit',
                TIME_FORMAT: 'UU:MM',
                VOUCHER_ALREADY_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_APPLIED: 'Gutschein bereits eingelöst',
                VOUCHER_EMPTY: 'Leerer Gutscheincode',
                VOUCHER_QUANTITY: 'Anzahl der Gutscheine',
                VOUCHERS_DISCOUNT: 'Rabatt von Gutschein(en)',
            },
            en_GB: {
                AGREE_ATTACHMENTS: 'I agree with the following documents:',
                ATTR_REQUIRED: 'Required',
                BOOKING_DISABLED_AGREEMENT: 'You have not agreed to the terms yet',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Programme amounts are invalid',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contact form is not filled in correctly',
                BOOKING_DISABLED_INVALID_DATE: 'No date selected',
                BOOKING_DISABLED_INVALID_TIME: 'No time selected',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Required product not yet selected',
                BUTTON_BOOK_NOW: 'Book now',
                BUTTON_BUY_NOW: 'Buy now',
                BUTTON_SUBMIT_CONTACT_FORM: 'Submit',
                CONTACT_FORM_CHECKBOX_REQUIRED: 'At least one option must be checked',
                CONTACT_FORM_FIELD_INVALID: '"{FIELD_NAME}" is invalid',
                CONTACT_FORM_FIELD_REQUIRED: '"{FIELD_NAME}" is a required field',
                CONTACT_FORM_SUBMIT_FAILED: 'The contact form could not be sent. Please try again later.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'The contact form was sent successfully.',
                DATE: 'Date',
                DATE_FORMAT: 'DD-MM-YYYY',
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
                DISCOUNT_APPLIED: 'Discount applied',
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_TITLE: 'Discount code or voucher',
                DISCOUNT_INVALID: 'Invalid discount code or voucher',
                ERR_AMOUNTS_NO_PACKAGE: 'Option "productAmounts" is set, but "package_id" is not set',
                ERR_CONTACT_FORM_EMPTY: 'Contact form is not filled in',
                ERR_DATE_NO_SINGLE_PACKAGE: 'Option "date" requires a single pre-filled package ("package_id")',
                ERR_DATE_PAST: 'Option "date" is a date in the past',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_DATE: 'Option "date" is not a valid ISO 8601 date string (e.g. "2019-06-28")',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Invalid redirect URL. Make sure you it starts with http:// or https://',
                ERR_INVALID_TIME: 'Option "time" is not a valid time string (e.g. "16:15")',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_FORM: 'Option "form_id" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                ERR_OPTIONS_INVALID: 'Options is not a "RecrasOptions" object',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                HEADING_PRICE: 'Price',
                HEADING_QUANTITY: 'Quantity',
                LOADING: 'Loading...',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_MAXIMUM: '(at most {MAXIMUM})',
                PRODUCT_MINIMUM: '(at least {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                TIME_FORMAT: 'HH:MM',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_QUANTITY: 'Number of vouchers',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)',
            },
            nl_NL: {
                AGREE_ATTACHMENTS: 'Ik ga akkoord met de volgende gegevens:',
                ATTR_REQUIRED: 'Vereist',
                BOOKING_DISABLED_AGREEMENT: 'Je bent nog niet akkoord met de voorwaarden',
                BOOKING_DISABLED_AMOUNTS_INVALID: 'Aantallen in programma zijn ongeldig',
                BOOKING_DISABLED_CONTACT_FORM_INVALID: 'Contactformulier is niet correct ingevuld',
                BOOKING_DISABLED_INVALID_DATE: 'Geen datum geselecteerd',
                BOOKING_DISABLED_INVALID_TIME: 'Geen tijd geselecteerd',
                BOOKING_DISABLED_REQUIRED_PRODUCT: 'Vereist product nog niet geselecteerd',
                BUTTON_BOOK_NOW: 'Nu boeken',
                BUTTON_BUY_NOW: 'Nu kopen',
                BUTTON_SUBMIT_CONTACT_FORM: 'Versturen',
                CONTACT_FORM_CHECKBOX_REQUIRED: 'Ten minste één optie moet aangevinkt worden',
                CONTACT_FORM_FIELD_INVALID: '"{FIELD_NAME}" is ongeldig',
                CONTACT_FORM_FIELD_REQUIRED: '"{FIELD_NAME}" is een verplicht veld',
                CONTACT_FORM_SUBMIT_FAILED: 'Het contactformulier kon niet worden verstuurd. Probeer het later nog eens.',
                CONTACT_FORM_SUBMIT_SUCCESS: 'Het contactformulier is succesvol verstuurd.',
                DATE: 'Datum',
                DATE_FORMAT: 'DD-MM-JJJJ',
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
                DISCOUNT_APPLIED: 'Kortingscode toegepast',
                DISCOUNT_CHECK: 'Controleren',
                DISCOUNT_TITLE: 'Kortingscode of tegoedbon',
                DISCOUNT_INVALID: 'Ongeldige kortingscode of tegoedbon',
                ERR_AMOUNTS_NO_PACKAGE: 'Optie "productAmounts" is ingesteld, maar "package_id" is niet ingesteld',
                ERR_CONTACT_FORM_EMPTY: 'Contactformulier is niet ingevuld',
                ERR_DATE_NO_SINGLE_PACKAGE: 'Optie "date" vereist een enkel vooraf ingevuld arrangement ("package_id")',
                ERR_DATE_PAST: 'Optie "date" is een datum in het verleden',
                ERR_GENERAL: 'Er ging iets mis:',
                ERR_INVALID_DATE: 'Optie "date" is geen geldige ISO 8601-datumstring (bijv. "2019-06-28")',
                ERR_INVALID_ELEMENT: 'Optie "element" is geen geldig Element',
                ERR_INVALID_HOSTNAME: 'Optie "recras_hostname" is ongeldig.',
                ERR_INVALID_LOCALE: 'Ongeldige locale. Geldige opties zijn: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ongeldige redirect-URL. Zorg ervoor dat deze begint met http:// of https://',
                ERR_INVALID_TIME: 'Optie "time" is geen geldige tijd-string (bijv. "16:15")',
                ERR_NO_ELEMENT: 'Optie "element" niet ingesteld.',
                ERR_NO_FORM: 'Optie "form_id" niet ingesteld.',
                ERR_NO_HOSTNAME: 'Optie "recras_hostname" niet ingesteld.',
                ERR_OPTIONS_INVALID: 'Opties is geen "RecrasOptions"-object',
                GENDER_UNKNOWN: 'Onbekend',
                GENDER_MALE: 'Man',
                GENDER_FEMALE: 'Vrouw',
                HEADING_PRICE: 'Prijs',
                HEADING_QUANTITY: 'Aantal',
                LOADING: 'Laden...',
                NO_PRODUCTS: 'Geen product gekozen',
                PRICE_TOTAL: 'Totaal',
                PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
                PRODUCT_MAXIMUM: '(maximaal {MAXIMUM})',
                PRODUCT_MINIMUM: '(minimaal {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
                TIME: 'Tijd',
                TIME_FORMAT: 'UU:MM',
                VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
                VOUCHER_APPLIED: 'Tegoedbon toegepast',
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_QUANTITY: 'Aantal tegoedbonnen',
                VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)',
            }
        };
    }

    error(msg) {
        console.log('Error', msg); //TODO
    }

    extractTags(msg) {
        const alphanumericWithUnderscore = '[a-zA-Z0-9_]';
        const regexPartMulticolumn = '((?:\\((?:\\w+)(?::[^)]*)?\\))*)';
        const regex = new RegExp('{' + alphanumericWithUnderscore + '+' + regexPartMulticolumn + '}', 'g');

        let tags = msg.match(regex);
        if (!Array.isArray(tags)) {
            return [];
        }
        return tags.map(tag => tag.substring(1, tag.length - 1)); // Strip { and }
    }

    filterTags(msg, packageID) {
        let tags = this.extractTags(msg);
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
                    msg = msg.split('{' + tag + '}').join(filtered[tag]);
                });
                return msg;
            });
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
        return parseFloat(price).toLocaleString(this.formatLocale('currency'), {
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
