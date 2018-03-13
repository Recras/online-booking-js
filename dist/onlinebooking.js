/**********************************
*  Recras Online Booking library  *
*  v 0.0.1                        *
**********************************/
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Recrasbooking = function () {
    function Recrasbooking(options) {
        var _this = this;

        _classCallCheck(this, Recrasbooking);

        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';

        this.TEMPLATE = '<div></div>';

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

        this.element = options.element;
        this.hostname = options.recras_hostname;

        this.getPackages().then(function (packages) {
            _this.showPackages(packages);
        });
    }

    _createClass(Recrasbooking, [{
        key: 'error',
        value: function error(msg) {
            this.setHtml('<strong>Something went wrong:</strong><p>' + msg + '</p>');
        }
    }, {
        key: 'getPackages',
        value: function getPackages() {
            var _this2 = this;

            return fetch('https://' + this.hostname + '/api2/arrangementen', {
                method: 'get'
            }).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    _this2.error(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                _this2.packages = json;
                return _this2.packages;
            }).catch(function (err) {
                _this2.error(err);
            });
        }
    }, {
        key: 'setHtml',
        value: function setHtml(msg) {
            this.element.innerHTML = msg;
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            // Packages are sorted by internal name, not by displayname
            var packagesSorted = packages.sort(function (a, b) {
                if (a.weergavenaam < b.weergavenaam) {
                    return -1;
                }
                if (a.weergavenaam > b.weergavenaam) {
                    return -1;
                }
                return 0;
            });
            var options = packagesSorted.map(function (pack) {
                return '<option value="' + pack.id + '">' + pack.weergavenaam;
            });

            var html = '<select><option>' + options.join('') + '</select>';
            this.setHtml('<p>TODO: tekst pre</p>' + html + '<p>TODO: tekst post</p>');
        }
    }]);

    return Recrasbooking;
}();