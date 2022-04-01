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

    ga4EventMap(action) {
        let map = {
            [RecrasEventHelper.EVENT_BOOKING_PACKAGE_CHANGED]: 'select_content',
            [RecrasEventHelper.EVENT_BOOKING_REDIRECT_PAYMENT]: 'begin_checkout',
            [RecrasEventHelper.EVENT_VOUCHER_TEMPLATE_CHANGED]: 'select_content',
            [RecrasEventHelper.EVENT_VOUCHER_REDIRECT_PAYMENT]: 'begin_checkout',
        };

        if (map[action] === undefined) {
            return false;
        }
        return map[action];
    }

    isGA4() {
        const fn = window[window.GoogleAnalyticsObject || 'ga'];
        return fn && fn.h && fn.h.gtm4;
    }

    sendEvent(cat, action, label = undefined, value = undefined, ga4Value = undefined) {
        let event;

        try {
            event = new Event(RecrasEventHelper.PREFIX_GLOBAL + ':' + cat + ':' + action);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(action, true, true);
        }

        if (this.analyticsEnabled && this.eventEnabled(action)) {
            if (this.isGA4() && this.ga4EventMap(action) && ga4Value) {
                // v4
                this.sendGA4Event(this.ga4EventMap(action), ga4Value);
            } else if (typeof window.gtag === 'function') {
                // Global Site Tag (v3)
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
                // "Old" Google Analytics (v2) and Tag Manager
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
                window.ga(function() {
                    let prefix = window.ga.getAll()[0].get('name');
                    if (prefix) {
                        prefix += '.';
                    }
                    window.ga(prefix + 'send', eventData);
                });
            }
        }

        return document.dispatchEvent(event);
    }

    sendGA4Event(action, data) {
        const fn = window[window.GoogleAnalyticsObject || 'ga'];
        fn('event', action, data);
    }

    setAnalytics(bool) {
        this.analyticsEnabled = bool;
    }

    setEvents(events) {
        this.eventsEnabled = events;
    }
}
