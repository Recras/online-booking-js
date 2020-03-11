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
        this.eCommerceEnabled = false;
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

    createEvent(type) {
        let event;

        try {
            event = new Event(type);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(type, true, true);
        }

        return event;
    }

    ecommerceItem({
        amount,
        id,
        name,
        listName,
        price,
    }) {
        return {
            id: id,
            name: name,
            list_name: listName,
            quantity: amount,
            price: price,
        };
    }

    eventEnabled(name) {
        return this.eventsEnabled.includes(name);
    }

    sendECommerceEvent({
        amount,
        coupon,
        id,
        items,
    } = {}) {
        if (!this.eCommerceEnabled) {
            return false;
        }
        window.gtag('event', 'purchase', {
            transaction_id: id,
            affiliation: 'Recras',
            value: amount,
            items: items,
            coupon: coupon,
        });
    }

    sendEvent(cat, action, label = undefined, value = undefined) {
        const event = this.createEvent(RecrasEventHelper.PREFIX_GLOBAL + ':' + cat + ':' + action);

        if (this.analyticsEnabled && this.eventEnabled(action)) {
            if (typeof window.gtag === 'function') {
                // Global Site Tag - the more modern variant
                let eventData = {
                    event_category: RecrasEventHelper.PREFIX_GLOBAL + ':' + cat,
                };
                if (label) {
                    eventData.event_label = label;
                }
                if (value) {
                    eventData.value = value;
                }
                window.gtag('event', action, eventData);
            } else if (typeof window.ga === 'function') {
                // "Old" Google Analytics
                let eventData = {
                    hitType: 'event',
                    eventCategory: RecrasEventHelper.PREFIX_GLOBAL + ':' + cat,
                    eventAction: action,
                };
                if (label) {
                    eventData.eventLabel = label;
                }
                if (value) {
                    eventData.eventValue = value;
                }
                // Google Analytics via Google Tag Manager doesn't work without a prefix
                let prefix = window.ga.getAll()[0].get('name');
                if (prefix) {
                    prefix += '.';
                }
                window.ga(prefix + 'send', eventData);
            }
        }

        return document.dispatchEvent(event);
    }

    setAnalytics(bool) {
        this.analyticsEnabled = bool;
    }

    setECommerce(bool) {
        if (!this.analyticsEnabled) {
            console.error('Google Analytics integration is required for Ecommerce integration to work. Please set the parameter "analytics" to "true". Ecommerce integration has NOT been enabled!');
            this.eCommerceEnabled = false;
            return;
        }
        if (typeof window.gtag !== 'function') {
            console.error('Ecommerce integration requires Google Analytics to be loaded through gtag.js. Ecommerce integration has NOT been enabled!');
            this.eCommerceEnabled = false;
            return;
        }
        this.eCommerceEnabled = bool;
    }

    setEvents(events) {
        this.eventsEnabled = events;
    }
}
