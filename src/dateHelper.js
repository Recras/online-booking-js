class RecrasDateHelper {
    static clone(date) {
        return new Date(date.getTime());
    }

    static datePartOnly(date) {
        let x = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000)); // Fix off-by-1 errors
        return x.toISOString().substr(0, 10); // Format as 2018-03-13
    }

    static formatStringForAPI(date) {
        // Handle DD-MM-YYYY pattern in code
        const datePatternDMY = '(0[1-9]|1[0-9]|2[0-9]|3[01])-(0[1-9]|1[012])-([0-9]{4})';
        const dmyMatches = date.match(datePatternDMY);
        if (dmyMatches) {
            return dmyMatches[3] + '-' + dmyMatches[2] + '-' + dmyMatches[1];
        }

        // Let API handle the rest. That way, the user will get an error if the input is invalid
        return date;
    }

    static parseMDY(dateStr) {
        const parts = dateStr.split('-');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
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
