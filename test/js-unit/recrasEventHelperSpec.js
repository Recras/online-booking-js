describe('RecrasEventHelper', () => {
    let eventHelper = new RecrasEventHelper();

    describe('sendEvent', () => {
        it('returns a boolean when sending an event', () => {
            expect(eventHelper.sendEvent('Foo', 'Bar')).toBe(true);
        });
    });
});
