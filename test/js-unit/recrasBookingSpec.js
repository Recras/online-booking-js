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

    describe('getAvailableDays', () => {
        beforeEach(() => {
            this.rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));

            this.rb.postJson = jasmine.createSpy('postJson').and.callFake(() => new Promise(function(resolve) {
                resolve();
            }));

            this.rb.bookingSize = () => 5;
            this.rb.productCountsBookingSize = () => [
                {
                    aantal: this.rb.bookingSize(),
                    arrangementsregel_id: 42,
                },
            ];
            this.rb.productCountsNoBookingSize = () => [
                {
                    aantal: 5,
                    arrangementsregel_id: 17,
                },
                {
                    aantal: 5,
                    arrangementsregel_id: 9,
                },
                {
                    aantal: 8,
                    arrangementsregel_id: 83,
                },
            ];
        });

        it('should add "boekingsgrootte" parameter for packages with fixed programme', () => {
            this.rb.shouldShowBookingSize = () => true;
            this.rb.productCountsNoBookingSize = () => [];
            this.rb.getAvailableDays(1, new Date('2019-05-20 12:00:00Z'), new Date('2019-05-27 12:00:00Z'));
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/beschikbaredagen', {
                arrangement_id: 1,
                begin: '2019-05-20',
                eind: '2019-05-27',
                producten: [],
                boekingsgrootte: this.rb.bookingSize(),
            });
        });

        it('should only include "producten" parameter for packages with choice programme', () => {
            this.rb.shouldShowBookingSize = () => false;
            this.rb.getAvailableDays(1, new Date('2019-05-20 12:00:00Z'), new Date('2019-05-27 12:00:00Z'));
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/beschikbaredagen', {
                arrangement_id: 1,
                begin: '2019-05-20',
                eind: '2019-05-27',
                producten: this.rb.productCountsNoBookingSize(),
            });
        });

        it('should include both "producten" and "boekingsgrootte" parameters for packages with mixed programme', () => {
            this.rb.shouldShowBookingSize = () => true;
            this.rb.getAvailableDays(1, new Date('2019-05-20 12:00:00Z'), new Date('2019-05-27 12:00:00Z'));
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/beschikbaredagen', {
                arrangement_id: 1,
                begin: '2019-05-20',
                eind: '2019-05-27',
                producten: this.rb.productCountsNoBookingSize(),
                boekingsgrootte: this.rb.bookingSize(),
            });
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
            this.rb.bookingHasErrors = () => false;
            this.rb.findElement = () => document.createElement('div');

            this.rb.bookingSize = () => 5;
            this.rb.submitBooking();
            expect(this.rb.postJson).toHaveBeenCalledWith('onlineboeking/reserveer', jasmine.objectContaining({
                betaalmethode: 'factuur',
            }));
        });
    });

    describe('Option "package_id"', () => {
        let rb;
        const package1 = {
            id: 1,
        };
        const package2 = {
            id: 2,
        };
        const package3 = {
            id: 3,
        };
        const package4 = {
            id: 4,
        };
        const getPackagesMock = () => [package1, package2, package3, package4];

        it('works with a single package', async () => {
            rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                package_id: 2,
            }));
            spyOn(rb, 'showPackages');
            spyOn(rb, 'changePackage');
            rb.getPackages = getPackagesMock;

            await rb.promise;

            expect(rb.changePackage).toHaveBeenCalledWith(2);
            expect(rb.showPackages).not.toHaveBeenCalled();
        });

        it('works with a single-item array', async () => {
            rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                package_id: [2],
            }));
            spyOn(rb, 'showPackages');
            spyOn(rb, 'changePackage');
            rb.getPackages = getPackagesMock;

            await rb.promise;

            expect(rb.changePackage).toHaveBeenCalledWith(2);
            expect(rb.showPackages).not.toHaveBeenCalled();
        });

        it('filters the visible packages', async () => {
            rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                package_id: [2, 3],
            }));
            spyOn(rb, 'showPackages');
            rb.getPackages = getPackagesMock;

            await rb.promise;

            expect(rb.showPackages).toHaveBeenCalledWith([package2, package3]);
        });

        it('works without option', async () => {
            rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));
            spyOn(rb, 'showPackages');
            rb.getPackages = getPackagesMock;

            await rb.promise;

            expect(rb.showPackages).toHaveBeenCalledWith([package1, package2, package3, package4]);
        });
    });

    describe('requiredAmount', () => {
        let rb;
        beforeEach(() => {
            rb = new RecrasBooking(new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            }));
        });

        it('should calculate "needs 3 per 2, rounded up"', () =>
            expect(rb.requiredAmount(1, {
                aantal: 3,
                per_x_aantal: 2,
                afronding: 'boven',
            })).toEqual(3)
        );

        it('should calculate "needs 4 per 2, rounded down"', () =>
            expect(rb.requiredAmount(3, {
                aantal: 4,
                per_x_aantal: 2,
                afronding: 'beneden',
            })).toEqual(4)
        );
    });

    describe('checkMinMaxAmounts', () => {
        let rb;

        beforeEach(() => {
            let mainEl = document.createElement('div');
            mainEl.id = 'onlinebooking';
            document.body.appendChild(mainEl);
            rb = new RecrasBooking(new RecrasOptions({
                element: mainEl,
                recras_hostname: 'demo.recras.nl',
                package_id: 26,
            }));
            spyOn(rb, 'setMinMaxAmountWarning');

            // Mocks
            rb.getSetting = (name) => ({
                slug: name,
                waarde: '',
            });
            rb.getPackages = () => {
                const packages = [{
                    id: 26,
                    onlineboeking_contactformulier_id: 4,
                    regels: [
                        {
                            id: 669,
                            max: 8,
                            onlineboeking_aantalbepalingsmethode: "invullen_door_gebruiker",
                            product: {
                                minimum_aantal: 5,
                                vereist_product: [],
                            }
                        },
                        {
                            id: 1337,
                            max: null,
                            onlineboeking_aantalbepalingsmethode: "invullen_door_gebruiker",
                            product: {
                                minimum_aantal: 1,
                                vereist_product: [],
                            }
                        },
                        {
                            id: 420,
                            aantal_personen: 10,
                            max: 80,
                            onlineboeking_aantalbepalingsmethode: "invullen_door_gebruiker",
                            product: {
                                minimum_aantal: 1,
                                vereist_product: [],
                            }
                        },
                    ],
                }];
                rb.packages = packages;
                return packages;
            };
        });

        it('gives error if amount is less than the product minimum', async () => {
            await rb.promise;

            let el = document.getElementById('packageline0');
            el.value = '1';
            el.dispatchEvent(new Event('input'));

            expect(rb.setMinMaxAmountWarning).toHaveBeenCalledWith('packageline0', 5, 'minimum');
        });

        it('gives error if amount is less than the line minimum', async () => {
            await rb.promise;

            let el = document.getElementById('packageline2');
            el.value = '1';
            el.dispatchEvent(new Event('input'));

            expect(rb.setMinMaxAmountWarning).toHaveBeenCalledWith('packageline2', 10, 'minimum');
        });

        it('gives error if amount is more than the maximum', async () => {
            await rb.promise;

            let el = document.getElementById('packageline0');
            el.value = '15';
            el.dispatchEvent(new Event('input'));

            expect(rb.setMinMaxAmountWarning).toHaveBeenCalledWith('packageline0', 8, 'maximum');
        });

        it('does not give error if there is no maximum', async () => {
            await rb.promise;

            let el = document.getElementById('packageline1');
            el.value = '2';
            el.dispatchEvent(new Event('input'));

            expect(rb.setMinMaxAmountWarning).not.toHaveBeenCalled();
        });
    });
});
