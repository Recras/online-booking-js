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
    });
});
