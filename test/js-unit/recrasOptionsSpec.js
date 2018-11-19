describe('RecrasOptions', () => {
    describe('constructor options', () => {
        it('fails without options', () => {
            expect(() => {
                new RecrasOptions();
            }).toThrow();
        });

        it('fails without "element"', () => {
            expect(() => {
                new RecrasOptions({});
            }).toThrow(new Error('Optie "element" niet ingesteld.'));
        });

        it('fails with non-element "element"', () => {
            expect(() => {
                new RecrasOptions({
                    element: 'just a string',
                });
            }).toThrow(new Error('Optie "element" is geen geldig Element'));
        });

        it('fails without "recras_hostname"', () => {
            expect(() => {
                new RecrasOptions({
                    element: document.createElement('div'),
                });
            }).toThrow(new Error('Optie "recras_hostname" niet ingesteld.'));
        });

        it('fails with invalid "recras_hostname"', () => {
            expect(() => {
                new RecrasOptions({
                    element: document.createElement('div'),
                    recras_hostname: 'example.com',
                });
            }).toThrow(new Error('Optie "recras_hostname" is ongeldig.'));
        });
    });
});
