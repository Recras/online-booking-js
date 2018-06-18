class RecrasDateHelper {
    static datePartOnly(date) {
        let x = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000)); // Fix off-by-1 errors
        return x.toISOString().substr(0, 10); // Format as 2018-03-13
    }

    static setTimeForDate(date, timeStr) {
        date.setHours(timeStr.substr(0, 2), timeStr.substr(3, 2));
        return date;
    }

    static timePartOnly(date) {
        return date.toTimeString().substr(0, 5); // Format at 09:00
    }

    static toString(date) {
        let x = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000)); // Fix off-by-1 errors
        x = x.toISOString();
        return x.substr(8, 2) + '-' + x.substr(5, 2) + '-' + x.substr(0, 4);
    }
}
