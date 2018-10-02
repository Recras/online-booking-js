describe('RecrasBooking', () => {
    describe('constructor', () => {
        describe('options', () => {
            it('fails without options', () => {
                expect(() => {
                    new RecrasBooking();
                }).toThrow();
            });

            it('fails without "element"', () => {
                expect(() => {
                    let options = new RecrasOptions({});
                    new RecrasBooking(options);
                }).toThrow(new Error('Optie "element" niet ingesteld.'));
            });

            it('fails with non-element "element"', () => {
                expect(() => {
                    let options = new RecrasOptions({
                        element: 'just a string',
                    });
                    new RecrasBooking(options);
                }).toThrow(new Error('Optie "element" is geen geldig Element'));
            });

            it('fails without "recras_hostname"', () => {
                expect(() => {
                    let options = new RecrasOptions({
                        element: document.createElement('div'),
                    });
                    new RecrasBooking(options);
                }).toThrow(new Error('Optie "recras_hostname" niet ingesteld.'));
            });

            it('fails with invalid "recras_hostname"', () => {
                expect(() => {
                    let options = new RecrasOptions({
                        element: document.createElement('div'),
                        recras_hostname: 'example.com',
                    });
                    new RecrasBooking(options);
                }).toThrow(new Error('Optie "recras_hostname" is ongeldig.'));
            });
        });

        describe('locale', () => {
            it('has default locale', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    recras_hostname: 'demo.recras.nl',
                });
                let rb = new RecrasBooking(options);
                expect(rb.languageHelper.locale).toEqual('nl_NL');
            });

            it('can set locale', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    locale: 'en_GB',
                    recras_hostname: 'demo.recras.nl'
                });
                let rb = new RecrasBooking(options);
                expect(rb.languageHelper.locale).toEqual('en_GB');
            });

            it('invalid locale falls back to default', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    locale: 'xx_zz',
                    recras_hostname: 'demo.recras.nl'
                });
                let rb = new RecrasBooking(options);
                expect(rb.languageHelper.locale).toEqual('nl_NL');
            });
        });

    });
});
