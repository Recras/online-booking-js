# Recras Online Booking JS library
Version: 0.11.0

JS library for easy online booking & voucher integration


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

### Online booking only
* `package_id` - optional - the ID of a package. This will hide the package selection dropdown and skip this step.
* `redirect_url` - optional - the URL to redirect to after a successful online booking. The URL will receive the created booking ID as `boeking_id` GET parameter (i.e. `?booking_id=42`). For more information on our booking API, we refer to our [booking API documentation](https://recras.github.io/docs/endpoints/boekingen.html).

### Vouchers only
* `voucher_template_id` - optional - the ID of a voucher template. This will hide the template selection dropdown and skip this step.
* `redirect_url` - optional - the URL to redirect to after a successful payment. The URL will receive the created booking ID as `boeking_id` GET parameter (i.e. `?booking_id=42`). For more information on our API's, we refer to our [booking API documentation](https://recras.github.io/docs/endpoints/boekingen.html) and [voucher API documentation](https://recras.github.io/docs/endpoints/vouchers.html).

### Contact form only
* `form_id` - **required** - the ID of the form.
* `redirect_url` - optional - the URL to redirect to after a successful form submission.


## Styling
The library provides a bit of styling to make it look okay straight from the box. If you wish to customise the layout, you can. Just style the appropriate elements from your website's CSS.


## Browser support
This library uses `promises` and `fetch`. Fetch is [unsupported in Internet Explorer, old Edge versions (12 & 13), and old Safari (up to 10.2)](https://caniuse.com/#feat=fetch) and promises are unsupported in Internet Explorer.

If you care about supporting these old browsers, a polyfill should be loaded into your website. We recommend [Polyfill.io](https://polyfill.io/v2/docs/), i.e. `https://cdn.polyfill.io/v2/polyfill.min.js?features=default,fetch,Promise`

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

You can use these events for custom actions, such as analytics.
