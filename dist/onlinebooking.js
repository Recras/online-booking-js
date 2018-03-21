/**********************************
*  Recras Online Booking library  *
*  v 0.0.1                        *
**********************************/
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Recrasbooking = function () {
    function Recrasbooking(options) {
        var _this = this;

        _classCallCheck(this, Recrasbooking);

        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';
        this.GENDERS = {
            onbekend: 'Unknown',
            man: 'Male',
            vrouw: 'Female'
        };
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control
        this.AUTOCOMPLETE_OPTIONS = {
            'contactpersoon.voornaam': 'given-name',
            'contactpersoon.achternaam': 'family-name',
            'contact.landcode': 'country',
            'contact.naam': 'organization',
            'contactpersoon.adres': 'address-line1',
            'contactpersoon.postcode': 'postal-code',
            'contactpersoon.plaats': 'address-level2'
        };

        var CSS = '\n.recras-onlinebooking > div {\nborder-top: 2px solid #dedede; /* Any love for Kirby out there? */\n    padding: 1em 0;\n}\n.recras-contactform div, .recras-amountsform div {\n    display: flex;\n    justify-content: space-between;\n    padding: 0.25em 0;\n}\n';
        var hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');
        var validLocales = ['de_DE', 'en_GB', 'nl_NL'];

        if (!options.element) {
            throw new Error('Option "element" not set.');
        }
        if (!options.recras_hostname) {
            throw new Error('Option "recras_hostname" not set.');
        }
        if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== '172.16.0.2') {
            throw new Error('Option "recras_hostname" is invalid.');
        }

        this.locale = 'nl_NL';
        if (options.locale) {
            if (validLocales.indexOf(options.locale) === -1) {
                console.warn('Invalid locale. Valid options are: ' + validLocales.join(', '));
            } else {
                this.locale = options.locale;
            }
        }

        this.element = options.element;
        this.apiBase = 'https://' + options.recras_hostname + '/api2/';
        if (options.recras_hostname === '172.16.0.2') {
            this.apiBase = this.apiBase.replace('https://', 'http://');
        }

        this.element.classList.add('recras-onlinebooking');
        this.loadCSS(CSS);
        this.loadScripts();

        this.getPackages().then(function (packages) {
            _this.showPackages(packages);
        });
    }

    _createClass(Recrasbooking, [{
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'datePartOnly',
        value: function datePartOnly(date) {
            return date.toISOString().substr(0, 10); // Format as 2018-03-13
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
        key: 'getAvailableDays',
        value: function getAvailableDays(packageID, begin, end) {
            var _this3 = this;

            return this.postJson(this.apiBase + 'onlineboeking/beschikbaredagen', {
                arrangement_id: packageID,
                begin: this.datePartOnly(begin),
                eind: this.datePartOnly(end),
                producten: this.productCounts()
            }).then(function (json) {
                _this3.availableDays = json;
                return _this3.availableDays;
            });
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(pack) {
            var _this4 = this;

            return this.fetchJson(this.apiBase + 'contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden').then(function (json) {
                _this4.contactFormFields = json;
                return _this4.contactFormFields;
            });
        }
    }, {
        key: 'getCountryList',
        value: function getCountryList(locale) {
            var _this5 = this;

            return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + locale + '/country.json').then(function (json) {
                _this5.countries = json;
                return _this5.countries;
            });
        }
    }, {
        key: 'getPackages',
        value: function getPackages() {
            var _this6 = this;

            return this.fetchJson(this.apiBase + 'arrangementen').then(function (json) {
                _this6.packages = json;
                return _this6.packages;
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
        key: 'loadScripts',
        value: function loadScripts() {
            //TODO: load Pikaday
        }
    }, {
        key: 'postJson',
        value: function postJson(url, data) {
            var _this7 = this;

            return fetch(url, {
                body: JSON.stringify(data),
                method: 'post'
            }).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    _this7.error(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                return json;
            }).catch(function (err) {
                _this7.error(err);
            });
        }
    }, {
        key: 'productCounts',
        value: function productCounts() {
            var counts = [];
            [].concat(_toConsumableArray(document.querySelectorAll('[id^="packageline"]'))).forEach(function (line) {
                counts.push({
                    aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
                    arrangementsregel_id: parseInt(line.dataset.packageId, 10)
                });
            });
            return counts;
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
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            }).length > 0;
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(pack) {
            var _this8 = this;

            this.getContactFormFields(pack).then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this8.getCountryList(_this8.locale));
                }
                Promise.all(waitFor).then(function () {
                    var html = '<div class="recras-contactform">';
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this8.showContactFormField(field, idx) + '</div>';
                    });
                    html += '</div>';
                    _this8.appendHtml(html);
                });
            });
        }
    }, {
        key: 'showContactFormField',
        value: function showContactFormField(field, idx) {
            var _this9 = this;

            if (field.soort_invoer === 'header') {
                return '<h3>' + field.naam + '</h3>';
            }

            var label = this.showContactFormLabel(field, idx);
            var attrRequired = field.verplicht ? 'required' : '';
            var html = void 0;
            switch (field.soort_invoer) {
                case 'contactpersoon.geslacht':
                    html = '<select id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' autocomplete="sex">';
                    Object.keys(this.GENDERS).forEach(function (key) {
                        html += '<option value="' + key + '">' + _this9.GENDERS[key];
                    });
                    html += '</select>';
                    return label + html;
                case 'keuze':
                    html = '<select id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' multiple>';
                    field.mogelijke_keuzes.forEach(function (choice) {
                        html += '<option value="' + choice + '">' + choice;
                    });
                    html += '</select>';
                    return label + html;
                case 'veel_tekst':
                    return label + ('<textarea id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + '></textarea>');
                case 'contactpersoon.telefoon1':
                    return label + ('<input type="tel" id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' autocomplete="tel">');
                case 'contactpersoon.email1':
                    return label + ('<input type="email" id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' autocomplete="email">');
                case 'contactpersoon.nieuwsbrieven':
                    html = '<select id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' multiple>';
                    Object.keys(field.newsletter_options).forEach(function (key) {
                        html += '<option value="' + key + '">' + field.newsletter_options[key];
                    });
                    html += '</select>';
                    return label + html;
                case 'contact.landcode':
                    html = '<select id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + '>';
                    Object.keys(this.countries).forEach(function (code) {
                        html += '<option value="' + code + '">' + _this9.countries[code];
                    });
                    html += '</select>';
                    return label + html;
                default:
                    var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                    return label + ('<input type="text" id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' autocomplete="' + autocomplete + '">');
            }
        }
    }, {
        key: 'showContactFormLabel',
        value: function showContactFormLabel(field, idx) {
            var labelText = field.naam;
            if (field.verplicht) {
                labelText += '<span title="Required">*</span>';
            }
            return '<label for="contactformulier-' + idx + '">' + labelText + '</label>';
        }
    }, {
        key: 'showDateTimeSelection',
        value: function showDateTimeSelection(pack) {
            var _this10 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            return this.getAvailableDays(pack.id, startDate, endDate).then(function (availableDays) {
                var today = _this10.datePartOnly(new Date());
                var html = '<div class="recras-datetime">';
                html += '<label for="recras-onlinebooking-date">Date</label><input type="date" id="recras-onlinebooking-date" min="' + today + '">';
                html += JSON.stringify(availableDays); //DEBUG
                html += '<label for="recras-onlinebooking-time">Time</label><input type="time" id="recras-onlinebooking-time">';
                html += '</div>';
                _this10.appendHtml(html);
            });
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this11 = this;

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
                var selectedPackage = _this11.packages.filter(function (p) {
                    return p.id === selectedPackageId;
                });

                [].concat(_toConsumableArray(document.querySelectorAll('.recras-amountsform, .recras-datetime, .recras-contactform'))).forEach(function (el) {
                    el.parentNode.removeChild(el);
                });

                if (selectedPackage.length === 0) {
                    // Reset form
                    _this11.showPackages(packages);
                    return false;
                }
                _this11.selectedPackage = selectedPackage[0];
                _this11.showProducts(_this11.selectedPackage);
                _this11.showDateTimeSelection(_this11.selectedPackage).then(function () {
                    _this11.showContactForm(_this11.selectedPackage);
                });
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this12 = this;

            var html = '<div class="recras-amountsform">';

            if (this.shouldShowBookingSize(pack)) {
                html += '<div><label for="bookingsize">' + (pack.weergavenaam || pack.arrangement) + '</label><input type="number" id="bookingsize" min="0"></div>';
            }

            var linesNoBookingSize = pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte';
            });
            linesNoBookingSize.forEach(function (line, idx) {
                html += '<div>';
                html += '<label for="packageline' + idx + '">' + line.beschrijving_templated + '</label>';
                //TODO: time, amount too low?, required products?
                var maxAttr = line.max ? 'max="' + line.max + '"' : '';
                html += '<input id="packageline' + idx + '" type="number" min="0" ' + maxAttr + ' data-package-id="' + line.id + '">';
                html += '</div>';
            });
            html += '</div>';
            this.appendHtml(html);

            [].concat(_toConsumableArray(document.querySelectorAll('[id^="packageline"], #bookingsize'))).forEach(function (el) {
                el.addEventListener('input', function (e) {
                    return _this12.updateProductAmounts();
                });
            });
        }
    }, {
        key: 'updateProductAmounts',
        value: function updateProductAmounts() {
            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            this.getAvailableDays(this.selectedPackage.id, startDate, endDate).then(function (availableDays) {
                console.log(availableDays);
            });
        }
    }]);

    return Recrasbooking;
}();