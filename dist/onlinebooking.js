/**********************************
*  Recras Online Booking library  *
*  v 0.0.1                        *
**********************************/
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Recrasbooking = function Recrasbooking(options) {
    _classCallCheck(this, Recrasbooking);

    this.PACKAGE_SELECTION = 'package_selection';
    this.DATE_SELECTION = 'date_selection';

    var hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');

    if (!options.element) {
        throw new Error('Option "element" not set.');
    }
    if (!options.recras_hostname) {
        throw new Error('Option "recras_hostname" not set.');
    }
    if (!hostnameRegex.test(options.recras_hostname)) {
        throw new Error('Option "recras_hostname" is invalid.');
    }

    console.log('Options are valid');
};