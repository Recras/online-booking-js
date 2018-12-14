class RecrasEventHelper {
    static PREFIX_GLOBAL = 'Recras:';
    static PREFIX_BOOKING = 'Booking:';
    static PREFIX_CONTACT_FORM = 'ContactForm:';
    static PREFIX_VOUCHER = 'Voucher:';

    static EVENT_BOOKING_BOOKING_SUBMITTED = self.PREFIX_BOOKING + 'BuyInProgress';
    static EVENT_BOOKING_CONTACT_FORM_SHOWN = self.PREFIX_BOOKING + 'ContactFormShown';
    static EVENT_BOOKING_DATE_SELECTED = self.PREFIX_BOOKING + 'DateSelected';
    static EVENT_BOOKING_PACKAGE_CHANGED = self.PREFIX_BOOKING + 'PackageChanged';
    static EVENT_BOOKING_PACKAGES_SHOWN = self.PREFIX_BOOKING + 'PackagesShown';
    static EVENT_BOOKING_PRODUCTS_SHOWN = self.PREFIX_BOOKING + 'ProductsShown';
    static EVENT_BOOKING_REDIRECT_PAYMENT = self.PREFIX_BOOKING + 'RedirectToPayment';
    static EVENT_BOOKING_RESET = self.PREFIX_BOOKING + 'Reset';
    static EVENT_BOOKING_TIME_SELECTED = self.PREFIX_BOOKING + 'TimeSelected';

    static EVENT_CONTACT_FORM_SUBMIT = self.PREFIX_CONTACT_FORM + 'Submit';

    static EVENT_VOUCHER_REDIRECT_PAYMENT = self.PREFIX_VOUCHER + 'RedirectToPayment';
    static EVENT_VOUCHER_TEMPLATE_CHANGED = self.PREFIX_VOUCHER + 'TemplateChanged';
    static EVENT_VOUCHER_VOUCHER_SUBMITTED = self.PREFIX_VOUCHER + 'BuyInProgress';

    static allEvents() {
        return [
            self.EVENT_BOOKING_BOOKING_SUBMITTED,
            self.EVENT_BOOKING_CONTACT_FORM_SHOWN,
            self.EVENT_BOOKING_DATE_SELECTED,
            self.EVENT_BOOKING_PACKAGE_CHANGED,
            self.EVENT_BOOKING_PACKAGES_SHOWN,
            self.EVENT_BOOKING_PRODUCTS_SHOWN,
            self.EVENT_BOOKING_REDIRECT_PAYMENT,
            self.EVENT_BOOKING_RESET,
            self.EVENT_BOOKING_TIME_SELECTED,
            self.EVENT_CONTACT_FORM_SUBMIT,
            self.EVENT_VOUCHER_REDIRECT_PAYMENT,
            self.EVENT_VOUCHER_TEMPLATE_CHANGED,
            self.EVENT_VOUCHER_VOUCHER_SUBMITTED,
        ];
    }

    static sendEvent(name, analytics) {
        let event;

        try {
            event = new Event(self.PREFIX_GLOBAL + name);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(name, true, true);
        }

        if (analytics && typeof analytics === 'function') {
            analytics('send', name);
        }

        return document.dispatchEvent(event);
    }
}
