describe('RecrasBooking', () => {
    let app;
    beforeEach(() => {
        app = new RecrasBooking({
            element: document.createElement('div'),
            recras_hostname: 'demo.recras.nl',
        });
    });

    describe('constructor', () => {
        describe('options', () => {
            it('fails without options', () => {
                expect(() => {
                    new RecrasBooking();
                }).toThrow();
            });

            it('fails without "element"', () => {
                expect(() => {
                    new RecrasBooking({});
                }).toThrow(new Error('Option "element" not set.'));
            });

            it('fails with non-element "element"', () => {
                expect(() => {
                    new RecrasBooking({
                        element: 'just a string',
                    });
                }).toThrow(new Error('Option "element" is not a valid Element'));
            });

            it('fails without "recras_hostname"', () => {
                expect(() => {
                    new RecrasBooking({
                        element: document.createElement('div'),
                    });
                }).toThrow(new Error('Option "recras_hostname" not set.'));
            });

            it('fails with invalid "recras_hostname"', () => {
                expect(() => {
                    new RecrasBooking({
                        element: document.createElement('div'),
                        recras_hostname: 'example.com',
                    });
                }).toThrow(new Error('Option "recras_hostname" is invalid.'));
            });
        });

        describe('locale', () => {
            it('has default locale', () => {
                expect(app.locale).toEqual('nl_NL');
            });

            it('can set locale', () => {
                let rb = new RecrasBooking({
                    element: document.createElement('div'),
                    locale: 'en_GB',
                    recras_hostname: 'demo.recras.nl'
                });
                expect(rb.locale).toEqual('en_GB');
            });

            it('invalid locale falls back to default', () => {
                let rb = new RecrasBooking({
                    element: document.createElement('div'),
                    locale: 'xx_zz',
                    recras_hostname: 'demo.recras.nl'
                });
                expect(rb.locale).toEqual('nl_NL');
            });
        });

    });
});
