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

    describe('autoScroll', () => {
        it('is true if omitted', () => {
            let options = new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            });
            expect(options.getAutoScroll()).toBe(true);
        });

        it('is true if specified', () => {
            let options = new RecrasOptions({
                autoScroll: true,
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            });
            expect(options.getAutoScroll()).toBe(true);
        });

        it('is false if specified', () => {
            let options = new RecrasOptions({
                autoScroll: false,
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
            });
            expect(options.getAutoScroll()).toBe(false);
        });
    });

    describe('getAnalyticsEvents', () => {
        it('throws when "analytics" is not set', () => {
            expect(() => {
                new RecrasOptions({
                    element: document.createElement('div'),
                    recras_hostname: 'demo.recras.nl',
                    analyticsEvents: [],
                });
            }).toThrow(new Error('Optie "analytics" moet ingesteld zijn om "analyticsEvents" te laten werken.'));
        });

        it('defaults to all events when an invalid option is passed', () => {
            let options = new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                analytics: function() {},
                analyticsEvents: 'foo',
            });
            expect(options.getAnalyticsEvents().length).toBeGreaterThan(0);
        });

        it('defaults to all events when an empty array is passed', () => {
            let options = new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                analytics: function() {},
                analyticsEvents: [],
            });
            expect(options.getAnalyticsEvents().length).toBeGreaterThan(0);
        });

        it('removes invalid events', () => {
            let options = new RecrasOptions({
                element: document.createElement('div'),
                recras_hostname: 'demo.recras.nl',
                analytics: function() {},
                analyticsEvents: ['foo', RecrasEventHelper.BOOKING_DISABLED_INVALID_DATE],
            });
            expect(options.getAnalyticsEvents()).toBe([RecrasEventHelper.BOOKING_DISABLED_INVALID_DATE]);
        });
    });
});
