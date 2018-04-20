describe('RecrasDateHelper', () => {
    describe('datePartOnly', () => {
        it('returns an ISO string for a date', () => {
            let date = new Date(2018, 3, 20, 12);
            expect(RecrasDateHelper.datePartOnly(date)).toEqual('2018-04-20');
        });
    });

    describe('setTimeForDate', () => {
        it('Correctly sets the time', () => {
            let date = new Date(2018, 3, 20);
            RecrasDateHelper.setTimeForDate(date, '12:30');
            expect(date.getHours()).toEqual(12);
            expect(date.getMinutes()).toEqual(30);
        });
    });

    describe('timePartOnly', () => {
        it('returns an ISO string for a date', () => {
            let date = new Date(2018, 3, 20, 12);
            expect(RecrasDateHelper.timePartOnly(date)).toEqual('12:00');
        });
    });
});
