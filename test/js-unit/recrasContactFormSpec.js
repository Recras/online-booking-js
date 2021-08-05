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
            this.fieldPackageRequired = {
                naam: 'Package required',
                soort_invoer: 'boeking.arrangement',
                verplicht: true,
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
                {
                    id: 10,
                    arrangement: 'Other package',
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

            it('selects package if there is only one and field is required', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages.slice(0, 1);

                let html = rc.showField(this.fieldPackageRequired, 0);
                expect(html.includes('selected')).toBe(true);
                expect((html.match(/<option/g) || []).length).toBe(1);
            });

            it('includes empty option and does not select package if there is only one but field is not required', () => {
                let rc = new RecrasContactForm(new RecrasOptions({
                    element: this.mainEl,
                    form_id: 1,
                    recras_hostname: 'demo.recras.nl',
                }));
                rc.packages = this.packages.slice(0, 1);

                let html = rc.showField(this.fieldPackage, 0);
                expect(html.includes('selected')).toBe(false);
                expect((html.match(/<option/g) || []).length).toBe(2);
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
    });

    describe('hasFieldOfType', () => {
        let rc;
        beforeEach(() => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
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
            expect(rc.hasBookingDateField()).toBe(false);
            rc.contactFormFields.push({
                field_identifier: 'boeking.datum',
            });
            expect(rc.hasBookingDateField()).toBe(true);
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

    describe('hasRelationDateField', () => {
        let rc;
        beforeEach(() => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 1,
                package_id: 7,
                recras_hostname: 'demo.recras.nl',
            }));
            rc.contactFormFields = [];
        });

        it('works on empty set', () => {
            expect(rc.hasRelationDateField()).toBe(false);
        });

        it('works for relation date field', () => {
            rc.contactFormFields.push({
                input_type: 'date',
                soort_invoer: 'contact.extra',
            });
            expect(rc.hasRelationDateField()).toBe(true);
        });
    });

    describe('sortPackages', () => {
        let rc;
        beforeEach(() => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
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
    });

    describe('getEmptyRequiredFields', () => {
        let rc;

        beforeEach(async () => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 1,
                recras_hostname: 'demo.recras.nl',
            }));
            await rc.showForm();
        });

        it('only returns required fields', () => {
            const els = rc.getEmptyRequiredFields();
            expect(els.length).toBeGreaterThan(0);
            for (const el of els) {
                expect(el.getAttribute('required')).not.toBeNull();
            }
        });
    });

    describe('getInvalidFields', () => {
        let rc;

        beforeEach(async () => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 1,
                recras_hostname: 'demo.recras.nl',
            }));
            await rc.showForm();
        });

        it('returns invalid fields', () => {
            let elEmail = rc.findElement('[type="email"]');
            elEmail.value = 'invalid';

            let invalid = rc.getInvalidFields();
            expect(invalid.length).toBe(1);
            expect(invalid[0]).toBe(elEmail);

            elEmail.value = 'info@recras.com';

            invalid = rc.getInvalidFields();
            expect(invalid.length).toBe(0);
        });
    });

    describe('isEmpty', () => {
        let rc;

        beforeEach(async () => {
            rc = new RecrasContactForm(new RecrasOptions({
                element: document.createElement('div'),
                form_id: 5,
                recras_hostname: 'demo.recras.nl',
            }));
            await rc.showForm();
        });

        it('returns if form is empty', () => {
            expect(rc.isEmpty()).toBe(true);
            let elEmail = rc.findElement('[type="email"]');
            elEmail.value = 'hi@example.com';

            expect(rc.isEmpty()).toBe(false);
        });
    });

    describe('contact form with quantity term', () => {
        it('can change the default quantity term', async () => {
            let options = new RecrasOptions({
                element: document.createElement('div'),
                form_id: 5,
                recras_hostname: 'demo.recras.nl',
            });
            let cf = new RecrasContactForm(options);
            cf.contactFormFields = [];

            let form = await cf.generateForm({
                voucherQuantitySelector: true,
                quantityTerm: 'How many?',
            });
            expect(form.includes('How many?')).toBe(true);
        });
    });
});
