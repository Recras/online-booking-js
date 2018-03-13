/**********************************
*  Recras Online Booking library  *
*  v 0.0.1                        *
**********************************/
'use strict';

class Recrasbooking {
    constructor(options) {
        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';

        const CSS = `
.recras-contactform div {
    display: flex;
    justify-content: space-between;
    padding: 0.25em 0;
}
`;
        const hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');

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

        this.getPackages().then(packages => {
            this.showPackages(packages);
        });
    }

    amendHtml(msg) {
        this.setHtml(this.element.innerHTML + msg);
    }

    error(msg) {
        this.setHtml(`<strong>Something went wrong:</strong><p>${ msg }</p>`);
    }

    fetchJson(url) {
        return fetch(url, {
            method: 'get'
        }).then(response => {
            if (response.status < 200 || response.status >= 400) {
                this.error(response.status + ' ' + response.statusText);
                return false;
            }
            return response.json();
        }).then(json => {
            return json;
        }).catch(err => {
            this.error(err);
        });
    }

    getContactFormFields(pack) {
        return this.fetchJson('https://' + this.hostname + '/api2/contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden')
            .then(json => {
                this.contactFormFields = json;
                return this.contactFormFields;
            });
    }

    getPackages() {
        return this.fetchJson('https://' + this.hostname + '/api2/arrangementen')
            .then(json => {
                this.packages = json;
                return this.packages;
            });
    }

    loadCSS(content) {
        let styleEl = document.createElement('style');
        styleEl.innerHTML = content;

        let refNode = document.head;
        refNode.parentNode.insertBefore(styleEl, refNode);
    }

    setHtml(msg) {
        this.element.innerHTML = msg;
    }

    sortPackages(packages) {
        // Packages from the API are sorted by internal name, not by display name
        // However, display name is not required so fallback to internal name
        return packages.sort((a, b) => {
            let aName = a.weergavenaam || a.arrangement;
            let bName = b.weergavenaam || b.arrangement;
            if (aName < bName) {
                return -1;
            }
            if (aName > bName) {
                return -1;
            }
            return 0;
        });
    }

    shouldShowBookingSize(pack) {
        // TODO: pack.regels bestaat niet in openbare API
        return Math.random() > 0.5; //TODO

        /*return _.some(arrangement.regels, function(r) {
            return r.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
        });*/
    }

    showContactFormField(field, idx) {
        console.log(field);
        switch (field.soort_invoer) {
            case 'header':
                return `<h3>${ field.naam }</h3>`;
            default:
                let labelText = field.naam;
                let attrRequired = '';
                if (field.verplicht) {
                    labelText += '<span title="Required">*</span>';
                    attrRequired = ' required';
                }
                return `<label for="contactformulier-${ idx }">${ labelText }</label><input type="text" id="contactformulier-${ idx }"${ attrRequired }>`;
        }
    }

    showPackages(packages) {
        packages = packages.filter(p => {
            return p.mag_online;
        });
        let packagesSorted = this.sortPackages(packages);
        let options = packagesSorted.map(pack => {
            return `<option value="${ pack.id }">${ pack.weergavenaam || pack.arrangement }`;
        });

        let html = '<select id="recras-package-selection"><option>' + options.join('') + '</select>';
        this.setHtml(`<p>TODO: tekst pre</p>${ html }<p>TODO: tekst post</p>`);

        let packageSelectEl = document.getElementById('recras-package-selection');
        packageSelectEl.addEventListener('change', e => {
            let selectedPackageId = parseInt(packageSelectEl.value, 10);
            let selectedPackage = this.packages.filter(p => {
                return p.id === selectedPackageId;
            });
            if (selectedPackage.length === 0) {
                // Reset form
                this.showPackages(packages);
                return false;
            }
            this.selectedPackage = selectedPackage[0];
            this.showProducts(this.selectedPackage);
        });
    }

    showProducts(pack) {
        //TODO: pack.regels bestaat niet in openbare API
        this.getContactFormFields(pack).then(fields => {
            fields = fields.sort((a, b) => {
                return a.sort_order - b.sort_order;
            });

            let html = '<div class="recras-contactform">';
            fields.forEach((field, idx) => {
                html += '<div>' + this.showContactFormField(field, idx) + '</div>';
            });
            html += '</div>';
            this.amendHtml(html);
        })
    }
}
