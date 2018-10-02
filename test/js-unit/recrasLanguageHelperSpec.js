describe('RecrasLanguageHelper', () => {
    describe('constructor', () => {
        it('has a default locale', () => {
            let lng = new RecrasLanguageHelper();
            expect(lng.locale).toBe(lng.defaultLocale);
        });
    });

    describe('extractTags', () => {
        it('Correctly parses simple tags', () => {
            let msg = 'This has a {booking_date} tag';
            let lng = new RecrasLanguageHelper();
            expect(lng.extractTags(msg)).toEqual(['booking_date']);
        });

        it('Correctly parses extended tags', () => {
            let msg = 'This message has an extended {booking_programme(start)(end)(product:Activity)} tag';
            let lng = new RecrasLanguageHelper();
            expect(lng.extractTags(msg)).toEqual(['booking_programme(start)(end)(product:Activity)']);
        });

        it('Works with multiple tags', () => {
            let msg = 'This message has two {booking_date} and {invoice_number} tags';
            let lng = new RecrasLanguageHelper();
            expect(lng.extractTags(msg)).toEqual(['booking_date', 'invoice_number']);
        });
    });

    describe('formatPrice', () => {
        it('formats Euro properly with Dutch locale', () => {
            let lng = new RecrasLanguageHelper();
            lng.currency = 'eur';
            expect(lng.formatPrice(7.5)).toBe('€ 7,50');
        });

        it('formats other currency with Dutch locale', () => {
            let lng = new RecrasLanguageHelper();
            lng.currency = 'gbp';
            expect(lng.formatPrice(7.5)).toBe('£ 7,50');
        });

        it('formats other currency with other locale', () => {
            let lng = new RecrasLanguageHelper();
            lng.locale = 'en_GB';
            lng.currency = 'gbp';
            expect(lng.formatPrice(7.5)).toBe('£7.50');
        });
    });
});
