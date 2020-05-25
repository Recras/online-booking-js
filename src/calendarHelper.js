class RecrasCalendarHelper {
    static defaultOptions() {
        return {
            firstDay: 1, // Monday
            minDate: new Date(),
            numberOfMonths: 2,
            reposition: false,
            position: 'bottom right',
            toString: (date) => RecrasDateHelper.toString(date),
        };
    }

    static i18n(languageHelper) {
        return {
            previousMonth: languageHelper.translate('DATE_PICKER_PREVIOUS_MONTH'),
            nextMonth: languageHelper.translate('DATE_PICKER_NEXT_MONTH'),
            months: [
                languageHelper.translate('DATE_PICKER_MONTH_JANUARY'),
                languageHelper.translate('DATE_PICKER_MONTH_FEBRUARY'),
                languageHelper.translate('DATE_PICKER_MONTH_MARCH'),
                languageHelper.translate('DATE_PICKER_MONTH_APRIL'),
                languageHelper.translate('DATE_PICKER_MONTH_MAY'),
                languageHelper.translate('DATE_PICKER_MONTH_JUNE'),
                languageHelper.translate('DATE_PICKER_MONTH_JULY'),
                languageHelper.translate('DATE_PICKER_MONTH_AUGUST'),
                languageHelper.translate('DATE_PICKER_MONTH_SEPTEMBER'),
                languageHelper.translate('DATE_PICKER_MONTH_OCTOBER'),
                languageHelper.translate('DATE_PICKER_MONTH_NOVEMBER'),
                languageHelper.translate('DATE_PICKER_MONTH_DECEMBER'),
            ],
            weekdays: [
                languageHelper.translate('DATE_PICKER_DAY_SUNDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_MONDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_TUESDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_WEDNESDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_THURSDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_FRIDAY_LONG'),
                languageHelper.translate('DATE_PICKER_DAY_SATURDAY_LONG'),
            ],
            weekdaysShort: [
                languageHelper.translate('DATE_PICKER_DAY_SUNDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_MONDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_TUESDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_WEDNESDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_THURSDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_FRIDAY_SHORT'),
                languageHelper.translate('DATE_PICKER_DAY_SATURDAY_SHORT'),
            ],
        };
    }

    static loadScript() {
        return new Promise((resolve, reject) => {
            const scriptID = 'recrasPikaday';

            // Only load script once
            if (document.getElementById(scriptID)) {
                resolve(true);
            }

            let script = document.createElement('script');
            script.id = scriptID;
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/pikaday.min.js';
            script.addEventListener('load', () => resolve(script), false);
            script.addEventListener('error', () => reject(script), false);
            document.head.appendChild(script);
        });
    }
}
