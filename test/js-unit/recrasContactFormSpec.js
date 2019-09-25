describe('RecrasContactForm', () => {
    describe('showField', () => {
        beforeEach(() => {
            this.mainEl = document.createElement('div');

            this.fieldPackage = {
                naam: 'Package',
                soort_invoer: 'boeking.arrangement',
                verplicht: false,
                field_identifier: 'boeking.arrangement',
            };
            this.fieldCustomerType = {
                naam: 'Customer type',
                soort_invoer: 'contact.soort_klant',
                verplicht: false,
                field_identifier: 'contact.soort_klant',
                mogelijke_keuzes: [
                    'Family',
                    'Kids party',
                    'Friend group',
                ],
            };
            this.packages = [
                {
                    id: 7,
                    arrangement: 'Package',
                },
            ];
        });

        describe('package field', () => {
            it('can pre-select a package', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    package_id: 7,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages;

                let html = rc.showField(this.fieldPackage, 0);
                expect(html.indexOf('value="7" selected')).not.toBe(-1);
            });

            it('does not pre-select an invalid package', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    package_id: 42,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages;

                let html = rc.showField(this.fieldPackage, 0);
                expect(html.indexOf('selected')).toBe(-1);
            });

            it('does not pre-select anything if no package is specified', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages;

                let html = rc.showField(this.fieldPackage, 0);
                expect(html.indexOf('selected')).toBe(-1);
            });
        });

        describe('customer type field', () => {
            it('shows as a radio button', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    package_id: 7,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages;

                let html = rc.showField(this.fieldCustomerType, 0);
                expect(html.indexOf('type="radio"')).not.toBe(-1);
                expect(html.indexOf('Kids party')).not.toBe(-1);
            });
        });

        describe('hasFieldOfType', () => {
            let rc;
            beforeEach(() => {
                rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    package_id: 7,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.contactFormFields = [];
            });

            it('works on empty set', () => {
                expect(rc.hasFieldOfType('foo')).toBe(false);
            });

            it('works for general field', () => {
                rc.contactFormFields.push({
                    field_identifier: 'foo',
                });
                expect(rc.hasFieldOfType('foo')).toBe(true);
            });

            it('works for date field', () => {
                expect(rc.hasDateField()).toBe(false);
                rc.contactFormFields.push({
                    field_identifier: 'boeking.datum',
                });
                expect(rc.hasDateField()).toBe(true);
            });

            it('works for country field', () => {
                expect(rc.hasCountryField()).toBe(false);
                rc.contactFormFields.push({
                    field_identifier: 'contact.landcode',
                });
                expect(rc.hasCountryField()).toBe(true);
            });

            it('works for package field', () => {
                expect(rc.hasPackageField()).toBe(false);
                rc.contactFormFields.push({
                    field_identifier: 'boeking.arrangement',
                });
                expect(rc.hasPackageField()).toBe(true);
            });
        });

        describe('sortPackages', () => {
            let rc;
            beforeEach(() => {
                rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    package_id: 7,
                    recras_hostname: 'demo.recras.nl',
                }));
            });

            it('sorts by package name first', () => {
                let packs = [
                    {
                        arrangement: 'BBB',
                    },
                    {
                        arrangement: 'AAA',
                    },
                    {
                        arrangement: 'CCC',
                    },
                ];
                let unsorted = JSON.parse(JSON.stringify(packs));
                let sorted = rc.sortPackages(unsorted);
                expect(sorted[0]).toEqual(packs[1]);
                expect(sorted[1]).toEqual(packs[0]);
                expect(sorted[2]).toEqual(packs[2]);
            });

            it('sorts by ID second', () => {
                let packs = [
                    {
                        arrangement: 'Same',
                        id: 42,
                    },
                    {
                        arrangement: 'Zzz',
                        id: 9,
                    },
                    {
                        arrangement: 'Same',
                        id: 17,
                    },
                ];
                let unsorted = JSON.parse(JSON.stringify(packs));
                let sorted = rc.sortPackages(unsorted);
                expect(sorted[0]).toEqual(packs[2]);
                expect(sorted[1]).toEqual(packs[0]);
                expect(sorted[2]).toEqual(packs[1]);
            });
        })
    });
});
