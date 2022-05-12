# 1.11.0 -> 2.0.0
* Support for Internet Explorer (all versions) and old Edge (12-15) has been removed.

# 1.10.2 -> 1.10.3
* The value of "BuyInProgress" events sent to Google Analytics was changed from package ID to total price. This is true for both bookings and vouchers. We consider this a bugfix and not a backwards-compatibility breaking change.

# 1.2.0 -> 1.3.0
* Option `showSubmit` for contact forms (only used internally) is now named `standalone`. The old option will remain as alias until the next major version.

# 0.18.0 -> 1.0.0
* Discount field is now visible from the start.
* Default CSS was updated. Various elements that were using Flexbox before are now using CSS Grid. If you have custom CSS for these elements, you might need to rewrite this a bit.
