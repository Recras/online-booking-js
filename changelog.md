# Changelog

## 3.0.0 (unreleased)
* Support for Google Analytics v3 has been dropped

## 2.0.6 (2023-02-27)
* Fetch available dates until the end of the month, to prevent half filled months in calendar

## 2.0.5 (2023-01-30)
* Contact form time field only allowed time in 5-minute intervals, but browser time pickers don't show this in their UI. Removed this limitation.

## 2.0.4 (2022-10-07)
* Contact form/Voucher sales no longer shows error messages inline, but after the form

## 2.0.3 (2022-07-21)
* Fix entering DD-MM-YYYY dates by hand

## 2.0.2 (2022-06-29)
* No changes from 2.0.1 - previous version on NPM contained wrong compiled version

## 2.0.1 (2022-06-22)
* "Number of people" on a package line was incorrectly used as minimum quantity - fixed

## 2.0.0 (2022-05-16)
* Fix GA4 events
* Support for Google Analytics v2 has been dropped
* Support for Internet Explorer and old Edge (12-15) has been dropped

## 1.11.0 (2022-04-04)
* Add support for Google Analytics v4 (GA4)
* Minified version of the script is now included

## 1.10.3 (2021-12-16)
* Change value of "BuyInProgress" events from package/template ID (bookings/vouchers, respectively) to total price

## 1.10.2 (2021-10-07)
* Clicking required checkboxes would become slow after clicking a few times - fixed

## 1.10.1 (2021-09-09)
* Make redirect without Mollie more robust

## 1.10.0 (2021-09-08)
* Replace alerts with inline messages

## 1.9.0 (2021-08-16)
* Allow changing the term for number of vouchers

## 1.8.3 (2021-07-05)
* Prevent submitting the amounts form when pressing Enter

## 1.8.2 (2021-06-29)
* Fix discount code with prefilled date

## 1.8.1 (2021-05-27)
* Fix tests to fix build

## 1.8.0 (2021-05-27)
* Add Swedish translation, courtesy of Lienke Nanninga

## 1.7.0 (2021-03-18)
* Add `defaultCountry` option to contact forms

## 1.6.8 (2021-03-05)
* Make selecting dates in the past easier for "relation extra field"

## 1.6.7 (2021-01-21)
* Allow dates in the past for "relation extra field"

## 1.6.6 (2021-01-08)
* Check if a discount is still valid after changing the date

## 1.6.5 (2020-12-11)
* When a list of packages to show is given, don't show all after resetting package selection

## 1.6.4 (2020-08-18)
* Show error message in contact form in addition to general "form could not be sent" popup

## 1.6.3 (2020-08-05)
* Show warning if the selected date has no available time slots

## 1.6.2 (2020-06-30)
* Fix german translation for 'Voucher applied'

## 1.6.1 (2020-06-22)
* Fix "window.ga.getAll is not a function" error in Firefox

## 1.6.0 (2020-06-09)
* Show customer extra fields in contact forms
* Fix checking discount codes containing "special" characters, such as `#`

## 1.5.1 (2020-05-26)
* Fix calendar alignment on small screens
* Fix attachments not being visible when pre-filling amounts

## 1.5.0 (2020-05-25)
* Allow pre-filling of date and time

## 1.4.8 (2020-05-15)
* After submitting a form, re-enable button later, to prevent users being able to submit twice

## 1.4.7 (2020-04-16)
* Update German translations, courtesy of Wiljon Bolten

## 1.4.6 (2020-04-09)
* Fix NPM build

## 1.4.5 (2020-04-09)
* only check minimum quantity if quantity is > 0

## 1.4.4 (2020-03-19)
* update a dependency to remove npm audit warning

## 1.4.3 (2020-03-18)
* Use minimum quantity of a line, if it is set

## 1.4.2 (2020-03-13)
* Add some more German translations

## 1.4.1 (2020-03-12)
* Fix a German translation error with customer's suggestion

## 1.4.0 (2020-03-02)
* Include amount in 'RedirectToPayment' events

## 1.3.4 (2020-02-10)
* Buying vouchers is limited to 100

## 1.3.3 (2020-02-04)
* Update event sending for Google Analytics integrated through Google Tag Manager

## 1.3.2 (2020-02-03)
* Fix amount inputs in Firefox

## 1.3.1 (2020-01-30)
* Update event sending for Google Analytics

## 1.3.0 (2020-01-23)
* Better error messages for standalone contact forms
* Don't fetch available days when no products have been selected
* Add missing error message for minimum amount
* Recheck vouchers when changing product amounts
* Improve interaction (particularly on mobile)
* Option `showSubmit` for contact forms (only used internally) is now named `standalone`. The old option will remain as alias until the next major version

## 1.2.1 (2019-12-18)
* Fix error when trying to book a product that has no material

## 1.2.0 (2019-12-03)
* Show error when input is higher than allowed
* Allow selecting only a few package IDs

## 1.1.4 (2019-11-18)
* Change date format for booking date field in contact forms

## 1.1.3 (2019-11-12)
* Styling fixes for Internet Explorer
* Handle 'require X per Y' requirements (not just 1 per Y)

## 1.1.2 (2019-11-11)
* Small styling improvement/fix
* Contact form: if there is only 1 package and the field is required, fill it automatically

## 1.1.1 (2019-10-03)
* Technical: Upgrade to Babel 7
* Fix position of styling in the `head`, making overriding styles easier
* Fix checking discount codes/vouchers

## 1.1.0 (2019-09-25)
* Optimise loading of contact form that contains a "package" field
* Add datepicker to date field in contact forms

## 1.0.0 (2019-09-17)
**CONTAINS BREAKING CHANGES - please see [upgrading.md](upgrading.md)**
* Show discount fields straight from the start, not after entering date
* Make Discounts section a `form` and add a wrapper to be able to align label and input without affecting the button and message
* Update default CSS
* Optimise loading of CSS
* Fix sorting of packages in a contact form

## 0.18.0 (2019-08-28)
* Add heading to quantity form
* Add placeholders to quantity form inputs

## 0.17.10 (2019-07-09)
* Remove the time-preview for lines that have no specified time in the programme

## 0.17.9 (2019-05-29)
* Fix filtering of invalid tags. For IE compatibility, a polyfill for `RegExp` flags should be loaded (i.e. https://cdn.polyfill.io/v2/polyfill.min.js?features=RegExp.prototype.flags)

## 0.17.8 (2019-05-22)
* Fix availability check for packages with "booking size" in some edge cases

## 0.17.7 (2019-05-10)
* Contact form `showForm` now returns a promise when done

## 0.17.6 (2019-04-23)
* Add "customer type" field in contact forms

## 0.17.5 (2019-04-19)
* Styling fix for Internet Explorer

## 0.17.4 (2019-04-17)
* Add missing maximum value for the booking size field

## 0.17.3 (2019-04-12)
* Fix build in Internet Explorer

## 0.17.2 (2019-04-12)
* Fix sending of Google Analytics events

## 0.17.1 (2019-03-26)
* Add message when entering an quantity more than the maximum of a line

## 0.17.0 (2019-03-20)
* Add the ability to pre-fill the package in a contact form

## 0.16.0 (2019-03-08)
* If there is only one available timeslot for the selected date, select it automatically

## 0.15.1 (2019-02-28)
* Fix error for invalid pre-filled amounts

## 0.15.0 (2019-02-27)
* Add the ability to pre-fill the amounts form

## 0.14.0 (2019-02-27)
* Add Google Analytics integration

## 0.13.4 (2019-01-29)
* Add `recras-input-invalid` class to inputs for products that require an other product
* Fix minimum booking size

## 0.13.3 (2019-01-17)
* Fix required products not working when you are logged in to the Recras being used

## 0.13.2 (2019-01-16)
* Fix error message related to default attachments when you are logged in to the Recras being used

## 0.13.1 (2019-01-08)
* Fix the test for development instances

## 0.13.0 (2019-01-07)
* Disable date selection if there are min/max amount or dependency errors
* Fix "NaN" price when booking size input field was cleared
* Add `previewTimes` option to disable programme times preview for online bookings
* Add `recras-completed` and `recras-active` classes. `recras-completed` is added to each section
 the user has successfully completed, `recras-active` is added to the currently active section.
* Add loading indicator when loading available time slots
  
**Notes for developers**

- When returning to an already completed section (i.e. changing amounts after selecting a date and time) can make multiple sections active.
- Entering an invalid amount to the already completed amounts section will leave the section completed. If you want to do things like hide completed sections, be aware of this and test thoroughly!

## 0.12.0 (2018-11-30)
* Add `autoScroll` option to online bookings
* Fixed attachments being shown even when "Send standard attachments" was disabled for a package
* Show console warning when you are logged in to the Recras being used

## 0.11.0 (2018-11-27)
* Don't fetch unused booking text
* Show "choice - multiple" & "newsletter" fields as checkboxes
* Get ready for "website" field
* Improve autocomplete

## 0.10.4 (2018-11-26)
* Show "amount is more than allowed for online booking" message directly underneath the corresponding input instead of at the end of the form.
* Add `recras-input-invalid` class to invalid amount inputs
* Use minimum amount instead of number of people for "minimum amount" calculation
* Fix book button being enabled despite "I agree" checkbox not being checked
* Show line price based on amount selected
* Fix form validation for standalone contact forms
* Fix subtotal when logged in
* Move generic error message to the bottom (when possible)

## 0.10.3 (2018-11-20)
* Fix standalone contact forms

## 0.10.2 (2018-11-20)
* Fix not being able to submit online booking form

## 0.10.1 (2018-11-19)
* Voucher sales showed templates without contact form when logged in - fixed

## 0.10.0 (2018-11-16)
* Add standalone contact form integration
* Implement `keuze_enkel` fields in contact forms
* Fix "NaN" price when amount input field was cleared
* Fix "Programme amounts are invalid" error in some cases

## 0.9.0 (2018-11-12)
* Clear forms after successful submit
* Improve certain error messages
* Check booking size lines for minimum amount
 
## 0.8.1 (2018-11-06)
* Fix datepicker position on mobile

## 0.8.0 (2018-10-29)
* Disable autocomplete on date/time fields
* Combine discount codes and vouchers into a single field

**Note for developers:** certain CSS classes have been removed, changed meaning, or have been renamed:
- Removed: `.voucher-status`, `.recras-vouchers`
- Changed: `.discount-status` is now also used for voucher messages
- Renamed: `.recras-discountcode` to `.recras-discounts`; `.priceLine` to `.priceWithoutDiscount`; `.priceTotal` to `.priceWithDiscount`

## 0.7.5 (2018-10-19)
* Fix date check for vouchers

## 0.7.4 (2018-10-19)
* Fix prices being shown incorrectly (i.e. 2.50000 instead of € 2,50)

## 0.7.3 (2018-10-04)
* Fix selection of disallowed payment method

## 0.7.2 (2018-10-01)
* Fix potential race condition

## 0.7.1 (2018-09-25)
* Version 0.7.0 was missing the minified `dist/onlinebooking.js` file

## 0.7.0 (2018-09-25)
* Show reasons why 'Book now' button is disabled
* Fix disabled 'Book now' button after changing date/time

## 0.6.3 (2018-09-03)
* Don't crash on minimum amount of booking size row

## 0.6.2 (2018-07-25)
* Added 3 more custom events needed for internal use

## 0.6.1 (2018-07-25)
* Fixed package sorting
* Fixed custom events in Internet Explorer
* Various other fixes for IE

## 0.6.0 (2018-07-24)
* Added [custom events](README.md#Events)

## 0.5.4 (2018-07-17)
* Fixed: changing product amounts didn't reset available days

## 0.5.3 (2018-07-05)
* Fixed: the redirect to Mollie's payment page didn't work if the library was loaded in an iframe

## 0.5.2 (2018-07-02)
* Show programme times before the product description instead of after it. This better reflects what the programme usually looks like in the booking confirmation email/PDF.
* Fixed default styling of voucher module

## 0.5.1 (2018-06-20)
* Fixed price for "booking size" lines

## 0.5.0 (2018-06-20)
* First version available on NPM
