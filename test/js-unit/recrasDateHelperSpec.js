describe('RecrasDateHelper', () => {
    describe('datePartOnly', () => {
        it('returns an ISO string for a date', () => {
            let date = new Date(2018, 3, 20, 12);
            expect(RecrasDateHelper.datePartOnly(date)).toEqual('2018-04-20');
        });
    });

    describe('formatStringForAPI', () => {
        it('leaves ISO date intact', () => {
            const isoDate = '2019-09-17';
            expect(RecrasDateHelper.formatStringForAPI(isoDate)).toEqual(isoDate);
        });

        it('formats DD-MM-YYYY date', () => {
            expect(RecrasDateHelper.formatStringForAPI('18-12-2019')).toEqual('2019-12-18');
        });

        it('leaves other formats intact for the API to handle', () => {
            expect(RecrasDateHelper.formatStringForAPI('28/06/2019')).toEqual('28/06/2019');
        });
    });

    describe('parseMDY', () => {
        it('correctly parses entered date', () => {
            const dateStr = '11-09-2022';
            const date = RecrasDateHelper.parseMDY(dateStr);
            expect(date.getMonth()).toEqual(8); // months are 0-indexed
            expect(date.getDate()).toEqual(11);
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
