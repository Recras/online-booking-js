describe('RecrasVoucher', () => {
    describe('constructor', () => {
        describe('locale', () => {
            it('has default locale', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    recras_hostname: 'demo.recras.nl',
                });
                let rb = new RecrasVoucher(options);
                expect(rb.languageHelper.locale).toEqual('nl_NL');
            });

            it('can set locale', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    locale: 'en_GB',
                    recras_hostname: 'demo.recras.nl'
                });
                let rb = new RecrasVoucher(options);
                expect(rb.languageHelper.locale).toEqual('en_GB');
            });

            it('invalid locale falls back to default', () => {
                let options = new RecrasOptions({
                    element: document.createElement('div'),
                    locale: 'xx_zz',
                    recras_hostname: 'demo.recras.nl'
                });
                let rb = new RecrasVoucher(options);
                expect(rb.languageHelper.locale).toEqual('nl_NL');
            });
        });

    });

    describe('maybeDisableBuyButton', () => {
        //TODO
    });

    describe('buyTemplate', () => {
        //TODO
        /*beforeEach(() => {
            this.rb = new RecrasVoucher(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));
            this.rb.selectedTemplate = {
                id: 1,
            };
            this.rb.appliedVouchers = {};
            this.rb.contactForm = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 1,
                recras_hostname: 'demo.recras.nl',
            }));
        });*/
    });
});
