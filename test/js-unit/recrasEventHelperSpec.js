describe('RecrasEventHelper', () => {
    describe('sendEvent', () => {
        it('returns a boolean when sending an event', () => {
            expect(RecrasEventHelper.sendEvent('Foo')).toBe(true);
        });
    });
});
