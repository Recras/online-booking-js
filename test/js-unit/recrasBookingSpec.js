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

    describe('amountsValid', () => {
        let rb;
        let inputLessThanMinimum;
        let inputMoreThanMaximum;

        beforeEach(() => {
            let mainEl = document.createElement('div');
            rb = new RecrasBooking(new RecrasOptions({
                element: mainEl,
                recras_hostname: 'demo.recras.nl',
            }));

            inputLessThanMinimum = document.createElement('input');
            inputLessThanMinimum.value = 1;
            inputLessThanMinimum.dataset.packageId = '1';

            inputMoreThanMaximum = document.createElement('input');
            inputMoreThanMaximum.value = 4;
            inputMoreThanMaximum.dataset.packageId = '2';

            let inputBookingSize = document.createElement('input');
            inputBookingSize.id = 'bookingsize';
            inputBookingSize.value = 1;

            mainEl.appendChild(inputLessThanMinimum);
            mainEl.appendChild(inputMoreThanMaximum);
            mainEl.appendChild(inputBookingSize);
        });

        it('handles minimum amount', function() {
            const pack = {
                regels: [
                    {
                        id: inputLessThanMinimum.dataset.packageId,
                        aantal_personen: 2,
                        onlineboeking_aantalbepalingsmethode: 'invullen_door_gebruiker',
                    },
                ],
            };
            expect(rb.amountsValid(pack)).toBe(false);
        });

        it('handles maximum amount', function() {
            const pack = {
                regels: [
                    {
                        id: inputMoreThanMaximum.dataset.packageId,
                        aantal_personen: 1,
                        max: 2,
                        onlineboeking_aantalbepalingsmethode: 'invullen_door_gebruiker',
                    },
                ],
            };
            expect(rb.amountsValid(pack)).toBe(false);
        });

        it('handles booking size minimum', function() {
            const pack = {
                regels: [
                    {
                        aantal_personen: 1,
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                        product: {
                            minimum_aantal: 2,
                        }
                    },
                ],
            };
            expect(rb.amountsValid(pack)).toBe(false);
        });

        it('handles zero products', function() {
            const pack = {
                regels: [
                    {
                        id: inputLessThanMinimum.dataset.packageId,
                        aantal_personen: 0,
                        onlineboeking_aantalbepalingsmethode: 'invullen_door_gebruiker',
                    },
                ],
            };
            inputLessThanMinimum.value = '';
            expect(rb.amountsValid(pack)).toBe(false);
        });

        it('handles happy path', function() {
            const pack = {
                regels: [
                    {
                        id: inputLessThanMinimum.dataset.packageId,
                        aantal_personen: 0,
                        onlineboeking_aantalbepalingsmethode: 'invullen_door_gebruiker',
                    },
                ],
            };
            expect(rb.amountsValid(pack)).toBe(true);
        });
    });

    describe('bookingSizeMaximum', () => {
        beforeEach(() => {
            this.rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));
        });

        it('returns lowest value of booking size maximums', () => {
            let pack = {
                regels: [
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                        max: 25,
                    },
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                        max: 42,
                    },
                ],
            };
            expect(this.rb.bookingSizeMaximum(pack)).toBe(25);
        });

        it('discards lines without maximum', () => {
            let pack = {
                regels: [
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                    },
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                        max: 42,
                    },
                ],
            };
            expect(this.rb.bookingSizeMaximum(pack)).toBe(42);
        });

        it('returns infinity when no line has a maximum', () => {
            let pack = {
                regels: [
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                    },
                    {
                        onlineboeking_aantalbepalingsmethode: 'boekingsgrootte',
                    },
                ],
            };
            expect(this.rb.bookingSizeMaximum(pack)).toBe(99999);
        });
    });

    describe('selectSingleTime', () => {
        beforeEach(() => {
            let mainEl = document.createElement('div');
            this.rb = new RecrasBooking(new RecrasOptions({
                element: mainEl,
                recras_hostname: 'demo.recras.nl',
            }));

            let timesEl = document.createElement('select');
            timesEl.id = 'recras-onlinebooking-time';
            timesEl.classList.add('recras-onlinebooking-time');
            mainEl.appendChild(timesEl);
        });

        it('does not select a timeslot when there are multiple', () => {
            this.rb.showTimes(['10:00', '11:00']);
            this.rb.selectSingleTime();
            expect(this.rb.findElements('#recras-onlinebooking-time option[value]:checked').length).toEqual(0);
        });
        it('selects the timeslot when there is only one', () => {
            this.rb.showTimes(['10:00']);
            this.rb.selectSingleTime();
            expect(this.rb.findElements('#recras-onlinebooking-time option[value]:checked').length).toEqual(1);
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
            this.rb.contactForm.generateJson = jasmine.createSpy('generateJson').and.callFake(() => {
                return new Promise(function(resolve) {
                    resolve();
                });
            });

            this.rb.bookingSize = () => 5;
            this.rb.submitBooking();//
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/reserveer', jasmine.objectContaining({
                betaalmethode: 'factuur',
            }));
        });
    });
});
