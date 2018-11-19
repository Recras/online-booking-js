describe('RecrasBooking', () => {
    describe('constructor', () => {
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

    describe('submitBooking', () => {
        beforeEach(() => {
            this.rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));
            this.rb.selectedPackage = {
                mag_online_geboekt_worden_direct_betalen: false,
                mag_online_geboekt_worden_achteraf_betalen: true,
                regels: [],
            };
            this.rb.appliedVouchers = {};
            this.rb.contactForm = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 1,
                recras_hostname: 'demo.recras.nl',
            }));
        });

        it('should select only possible payment method by default', () => {
            this.rb.postJson = jasmine.createSpy('postJson').and.callFake(() => {
                return new Promise(function(resolve) {
                    resolve();
                });
            });
            this.rb.bookingSize = () => 5;
            this.rb.submitBooking();
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/reserveer', jasmine.objectContaining({
                betaalmethode: 'factuur',
            }));
        });
    });
});
