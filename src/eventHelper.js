class RecrasEventHelper {
    static PREFIX_GLOBAL = 'Recras';
    static PREFIX_BOOKING = 'Booking';
    static PREFIX_CONTACT_FORM = 'ContactForm';
    static PREFIX_VOUCHER = 'Voucher';

    static EVENT_BOOKING_BOOKING_SUBMITTED = 'BuyInProgress';
    static EVENT_BOOKING_CONTACT_FORM_SHOWN = 'ContactFormShown';
    static EVENT_BOOKING_DATE_SELECTED = 'DateSelected';
    static EVENT_BOOKING_PACKAGE_CHANGED = 'PackageChanged';
    static EVENT_BOOKING_PACKAGES_SHOWN = 'PackagesShown';
    static EVENT_BOOKING_PRODUCTS_SHOWN = 'ProductsShown';
    static EVENT_BOOKING_REDIRECT_PAYMENT = 'RedirectToPayment';
    static EVENT_BOOKING_RESET = 'Reset';
    static EVENT_BOOKING_TIME_SELECTED = 'TimeSelected';

    static EVENT_CONTACT_FORM_SUBMIT = 'Submit';

    static EVENT_VOUCHER_REDIRECT_PAYMENT = 'RedirectToPayment';
    static EVENT_VOUCHER_TEMPLATE_CHANGED = 'TemplateChanged';
    static EVENT_VOUCHER_VOUCHER_SUBMITTED = 'BuyInProgress';

    constructor() {
        this.analyticsEnabled = false;
        this.eventsEnabled = RecrasEventHelper.allEvents();
    }


    static allEvents() {
        return [
            RecrasEventHelper.EVENT_BOOKING_BOOKING_SUBMITTED,
            RecrasEventHelper.EVENT_BOOKING_CONTACT_FORM_SHOWN,
            RecrasEventHelper.EVENT_BOOKING_DATE_SELECTED,
            RecrasEventHelper.EVENT_BOOKING_PACKAGE_CHANGED,
            RecrasEventHelper.EVENT_BOOKING_PACKAGES_SHOWN,
            RecrasEventHelper.EVENT_BOOKING_PRODUCTS_SHOWN,
            RecrasEventHelper.EVENT_BOOKING_REDIRECT_PAYMENT,
            RecrasEventHelper.EVENT_BOOKING_RESET,
            RecrasEventHelper.EVENT_BOOKING_TIME_SELECTED,
            RecrasEventHelper.EVENT_CONTACT_FORM_SUBMIT,
            RecrasEventHelper.EVENT_VOUCHER_REDIRECT_PAYMENT,
            RecrasEventHelper.EVENT_VOUCHER_TEMPLATE_CHANGED,
            RecrasEventHelper.EVENT_VOUCHER_VOUCHER_SUBMITTED,
        ];
    }

    eventEnabled(name) {
        return this.eventsEnabled.includes(name);
    }

    sendEvent(cat, action, value = undefined) {
        let event;

        try {
            event = new Event(RecrasEventHelper.PREFIX_GLOBAL + ':' + cat + ':' + action);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(action, true, true);
        }

        if (this.analyticsEnabled && typeof window.ga === 'function' && this.eventEnabled(action)) {
            let eventData = {
                eventCategory: RecrasEventHelper.PREFIX_GLOBAL + ':' + cat,
                eventAction: action,
            };
            if (value) {
                eventData.eventValue = value;
            }
            window.ga('send', 'event', eventData);
        }

        return document.dispatchEvent(event);
    }

    setAnalytics(bool) {
        this.analyticsEnabled = bool;
    }

    setEvents(events) {
        this.eventsEnabled = events;
    }
}
