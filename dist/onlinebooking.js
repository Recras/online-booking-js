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

        var CSS = '\n.recras-contactform div {\n    display: flex;\n    justify-content: space-between;\n    padding: 0.5em 0;\n}\n';
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

        this.element.classList.add('recras-onlinebooking');
        this.loadCSS(CSS);

        this.getPackages().then(function (packages) {
            _this.showPackages(packages);
        });
    }

    _createClass(Recrasbooking, [{
        key: 'amendHtml',
        value: function amendHtml(msg) {
            this.setHtml(this.element.innerHTML + msg);
        }
    }, {
        key: 'error',
        value: function error(msg) {
            this.setHtml('<strong>Something went wrong:</strong><p>' + msg + '</p>');
        }
    }, {
        key: 'fetchJson',
        value: function fetchJson(url) {
            var _this2 = this;

            return fetch(url, {
                method: 'get'
            }).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    _this2.error(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                return json;
            }).catch(function (err) {
                _this2.error(err);
            });
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(pack) {
            var _this3 = this;

            return this.fetchJson('https://' + this.hostname + '/api2/contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden').then(function (json) {
                _this3.contactFormFields = json;
                return _this3.contactFormFields;
            });
        }
    }, {
        key: 'getPackages',
        value: function getPackages() {
            var _this4 = this;

            return this.fetchJson('https://' + this.hostname + '/api2/arrangementen').then(function (json) {
                _this4.packages = json;
                return _this4.packages;
            });
        }
    }, {
        key: 'loadCSS',
        value: function loadCSS(content) {
            var styleEl = document.createElement('style');
            styleEl.innerHTML = content;

            var refNode = document.head;
            refNode.parentNode.insertBefore(styleEl, refNode);
        }
    }, {
        key: 'setHtml',
        value: function setHtml(msg) {
            this.element.innerHTML = msg;
        }
    }, {
        key: 'sortPackages',
        value: function sortPackages(packages) {
            // Packages from the API are sorted by internal name, not by display name
            // However, display name is not required so fallback to internal name
            return packages.sort(function (a, b) {
                var aName = a.weergavenaam || a.arrangement;
                var bName = b.weergavenaam || b.arrangement;
                if (aName < bName) {
                    return -1;
                }
                if (aName > bName) {
                    return -1;
                }
                return 0;
            });
        }
    }, {
        key: 'shouldShowBookingSize',
        value: function shouldShowBookingSize(pack) {
            // TODO: pack.regels bestaat niet in openbare API
            return Math.random() > 0.5; //TODO

            /*return _.some(arrangement.regels, function(r) {
                return r.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            });*/
        }
    }, {
        key: 'showContactFormField',
        value: function showContactFormField(field, idx) {
            console.log(field);
            switch (field.soort_invoer) {
                case 'header':
                    return '<h3>' + field.naam + '</h3>';
                default:
                    var labelText = field.naam;
                    var attrRequired = '';
                    if (field.verplicht) {
                        labelText += '<span title="Required">*</span>';
                        attrRequired = ' required';
                    }
                    return '<label for="contactformulier-' + idx + '">' + labelText + '</label><input type="text" id="contactformulier-' + idx + '"' + attrRequired + '>';
            }
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this5 = this;

            packages = packages.filter(function (p) {
                return p.mag_online;
            });
            var packagesSorted = this.sortPackages(packages);
            var options = packagesSorted.map(function (pack) {
                return '<option value="' + pack.id + '">' + (pack.weergavenaam || pack.arrangement);
            });

            var html = '<select id="recras-package-selection"><option>' + options.join('') + '</select>';
            this.setHtml('<p>TODO: tekst pre</p>' + html + '<p>TODO: tekst post</p>');

            var packageSelectEl = document.getElementById('recras-package-selection');
            packageSelectEl.addEventListener('change', function (e) {
                var selectedPackageId = parseInt(packageSelectEl.value, 10);
                var selectedPackage = _this5.packages.filter(function (p) {
                    return p.id === selectedPackageId;
                });
                if (selectedPackage.length === 0) {
                    // Reset form
                    _this5.showPackages(packages);
                    return false;
                }
                _this5.selectedPackage = selectedPackage[0];
                _this5.showProducts(_this5.selectedPackage);
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this6 = this;

            //TODO: pack.regels bestaat niet in openbare API
            this.getContactFormFields(pack).then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                var html = '<div class="recras-contactform">';
                fields.forEach(function (field, idx) {
                    html += '<div>' + _this6.showContactFormField(field, idx) + '</div>';
                });
                html += '</div>';
                _this6.amendHtml(html);
            });
        }
    }]);

    return Recrasbooking;
}();