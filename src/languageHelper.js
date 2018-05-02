class RecrasLocaleHelper {
    static defaultLocale = 'nl_NL';
    static validLocales = ['de_DE', 'en_GB', 'nl_NL'];

    isValid(locale) {
        return (this.validLocales.indexOf(locale) > -1);
    }
}
