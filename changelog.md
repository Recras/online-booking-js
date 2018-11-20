# Changelog

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
