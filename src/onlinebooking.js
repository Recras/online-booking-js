/**********************************
*  Recras Online Booking library  *
*  v 0.0.1                        *
**********************************/
'use strict';

class Recrasbooking {
    constructor(options) {
        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';

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

        this.getPackages().then(packages => {
            this.showPackages(packages);
        });
    }

    error(msg) {
        this.setHtml(`<strong>Something went wrong:</strong><p>${ msg }</p>`);
    }

    getPackages() {
        return fetch('https://' + this.hostname + '/api2/arrangementen', {
            method: 'get'
        }).then(response => {
            if (response.status < 200 || response.status >= 400) {
                this.error(response.status + ' ' + response.statusText);
                return false;
            }
            return response.json();
        }).then(json => {
            this.packages = json;
            return this.packages;
        }).catch(err => {
            this.error(err);
        });
    }

    setHtml(msg) {
        this.element.innerHTML = msg;
    }

    showPackages(packages) {
        // Packages are sorted by internal name, not by displayname
        let packagesSorted = packages.sort((a, b) => {
            if (a.weergavenaam < b.weergavenaam) {
                return -1;
            }
            if (a.weergavenaam > b.weergavenaam) {
                return -1;
            }
            return 0;
        });
        let options = packagesSorted.map(pack => {
            return `<option value="${ pack.id }">${ pack.weergavenaam }`;
        });

        let html = '<select><option>' + options.join('') + '</select>';
        this.setHtml(`<p>TODO: tekst pre</p>${ html }<p>TODO: tekst post</p>`);
    }
}
