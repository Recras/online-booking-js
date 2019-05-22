# Changelog

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
