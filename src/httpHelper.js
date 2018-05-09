class RecrasHttpHelper {
    static call(url, data, errorHandler) {
        if (!url) {
            throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
        }
        return fetch(url, data).then(response => {
            if (response.status < 200 || response.status >= 400) {
                errorHandler(response.status + ' ' + response.statusText);
                return false;
            }
            return response.json();
        }).then(json => {
            return json;
        }).catch(err => {
            errorHandler(err);
        });
    }

    static fetchJson(url, errorHandler) {
        return this.call(url, {
            method: 'get',
        }, errorHandler);
    }

    static postJson(url, data, errorHandler) {
        return this.call(url, {
            body: JSON.stringify(data),
            method: 'post',
        }, errorHandler);
    }
}
