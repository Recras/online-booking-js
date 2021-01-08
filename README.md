[![Build Status](https://travis-ci.org/Recras/online-booking-js.svg?branch=master)](https://travis-ci.org/Recras/online-booking-js)

# Recras JS Integration Library
Version: 1.6.6

JS library for easy online booking, contact form, and voucher integration


## Getting started
### Online booking
In your HTML document,
1. include the `dist/onlinebooking.js` script
1. add an element where you want the integration to appear
1. give the element a unique ID, i.e. `<div id="recras-onlinebooking"></div>`
1. initialize the script like this:
```
var options = new RecrasOptions({
    recras_hostname: 'demo.recras.nl', // Required
    element: document.getElementById('recras-onlinebooking'), // Required
});
new RecrasBooking(options);
```

### Buying vouchers
In your HTML document,
1. include the `dist/onlinebooking.js` script
1. add an element where you want the integration to appear
1. give the element a unique ID, i.e. `<div id="recras-vouchers"></div>`
1. initialize the script like this:
```
var options = new RecrasOptions({
    recras_hostname: 'demo.recras.nl', // Required
    element: document.getElementById('recras-vouchers'), // Required
});
new RecrasVoucher(options);
```
See the section Options below for an overview of all options

### Contact form
In your HTML document,
1. include the `dist/onlinebooking.js` script
1. add an element where you want the integration to appear
1. give the element a unique ID, i.e. `<div id="recras-contactform"></div>`
1. initialize the script like this:
```
var options = new RecrasOptions({
    recras_hostname: 'demo.recras.nl', // Required
    element: document.getElementById('recras-contactform'), // Required
    form_id: 4, // Required
});
var form = new RecrasContactForm(options);
form.showForm();
```
See the section Options below for an overview of all options

### Demos
See `/demo/index.html` for integration demos


## Options
### Global options
* `recras_hostname` - **required** - the name of your Recras, i.e. `demo.recras.nl`
* `element` - **required** - a single HTML element, using `getElementById` or `querySelector`
* `locale` - optional, defaults to nl_NL - a valid locale (de_DE, en_GB, and nl_NL). This is used for country names, error messages, etc. Package names from Recras are not affected.
* `analytics` - optional, defaults to `false` - set to `true` if you want to enable Google Analytics integration.
* `analyticsEvents` - optional - a list of events to track. `analytics` must be set to `true` for this to 
work. If omitted, all events will be sent. For a list of events, refer to the section Events at the end of this document.

### Online booking only
* `package_id` - optional - can be the following:
  - the single ID of a package. This will pre-fill the package and skip the package selection dropdown step.
  - an array of multiple package IDs. This will only show the selected packages in the package selection dropdown. If there is only one package in the array, it will behave the same as the first method.
* `redirect_url` - optional - the URL to redirect to after a successful online booking. The URL will receive the created booking ID as `boeking_id` GET parameter (i.e. `?booking_id=42`). For more information on our booking API, we refer to our [booking API documentation](https://recras.github.io/docs/endpoints/boekingen.html).
* `autoScroll` - optional, defaults to `true` - whether or not to scroll the amounts form into view when changing packages. This is most useful if you select a package by default and don't want to scroll past the intro text, set it to `false` in that case.
* `previewTimes` - optional, defaults to `true` - whether or not to preview times for each line 
in the programme after selecting a date and time.
* `productAmounts` - optional, use in combination with a single `package_id`. Set this to an object where the keys are the package line ID's and the values are the amounts to enter, i.e. :
    ```
    {
        bookingsize: 16,
        1: 12,
        42: 16,
        43: 16,
    }
    ```
    The package line ID's can be obtained by inspecting the amounts form, or by checking the [packages API specification](https://demo.recras.nl/docs/api/endpoints/arrangementen.html) - use the `id` field for each entry in `regels`.
* `date` - optional, use in combination with a single `package_id`. Set this to an ISO 8601 date (e.g. "2021-06-28") to prefill the date. If the selected date is not available for the chosen package or selected products, the date selection will be visible.
* `time` - optional, use in combination with a single `package_id`. Set this to a 24-hour time string (e.g. "16:00") to prefill the time. This can be used in combination with `date`, but this is not required. If the selected time is not available for the chosen date, the time selection will be visible.

### Vouchers only
* `voucher_template_id` - optional - the ID of a voucher template. This will hide the template selection dropdown and skip this step.
* `redirect_url` - optional - the URL to redirect to after a successful payment. The URL will receive the created booking ID as `boeking_id` GET parameter (i.e. `?booking_id=42`). For more information on our API's, we refer to our [booking API documentation](https://recras.github.io/docs/endpoints/boekingen.html) and [voucher API documentation](https://recras.github.io/docs/endpoints/vouchers.html).

### Contact form only
* `form_id` - **required** - the ID of the form.
* `package_id` - optional - can be used to programmatically fill a "Booking - Package" field present in the contact form.
* `redirect_url` - optional - the URL to redirect to after a successful form submission.


## Styling
The library provides a bit of styling to make it look okay straight from the box. If you wish to customise the layout, you can. Just style the appropriate elements from your website's CSS.


## Browser support
This library uses various modern techniques that are unsupported in Internet Explorer, and/or old Edge, and/or old Safari. If you care about supporting old browsers, a polyfill should be loaded into your website. We recommend loading the following [Polyfill.io](https://polyfill.io/v3/) script: `https://polyfill.io/v3/polyfill.min.js?features=default,fetch,Promise,Array.prototype.includes,RegExp.prototype.flags`

In modern browsers, this is only a very small file causing little overhead.


## Events
The library sends out a few custom events when certain things change:

* `Recras:Booking:Reset` - when the entire form is reset
* `Recras:Booking:PackagesShown` - when the list of packages is shown
* `Recras:Booking:PackageChanged` - when a new package is selected
* `Recras:Booking:ProductsShown` - when the products are shown after a package is selected
* `Recras:Booking:ContactFormShown` - when the contact form is shown after a package is selected
* `Recras:Booking:DateSelected` - when the date is changed
* `Recras:Booking:TimeSelected` - when the time is changed
* `Recras:Booking:BuyInProgress` - when the online booking form is submitted
* `Recras:Booking:RedirectToPayment` - when the user is redirected to the payment provider
* `Recras:ContactForm:Submit` - when a standalone form is submitted
* `Recras:Voucher:TemplateChanged` - when a new voucher template is selected
* `Recras:Voucher:BuyInProgress` - when the voucher form is submitted
* `Recras:Voucher:RedirectToPayment` - when the user is redirected to the payment provider

You can use these events for custom actions, such as analytics. For use in code, please refer to 
the constants in [src/eventHelper.js](src/eventHelper.js).

When Google Analytics integration is enabled, certain events sent to GA include a label and/or value:

| Event                              | Label                             | Value                               |
| ---------------------------------- | --------------------------------- | ----------------------------------- |
| `Recras:Booking:PackageChanged`    | Package name                      | Package ID                          |
| `Recras:Booking:DateSelected`      | Selected date, in ISO 8601 format | N/A                                 |
| `Recras:Booking:BuyInProgress`     | Package name                      | Package ID                          |
| `Recras:Booking:RedirectToPayment` | N/A                               | Rounded total amount of the booking |
| `Recras:ContactForm:Submit`        | N/A                               | Form ID                             |
| `Recras:Voucher:TemplateChanged`   | N/A                               | Template ID                         |
| `Recras:Voucher:BuyInProgress`     | Template name                     | Template ID                         |
| `Recras:Voucher:RedirectToPayment` | N/A                               | Rounded total amount of the order   |
