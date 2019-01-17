class RecrasHttpHelper {
    static call(url, data, errorHandler) {
        if (!url) {
            throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
        }
        let lastResponse;
        return fetch(url, data).then(response => {
            lastResponse = response;
            return response.json();
        }).then(json => {
            if (!lastResponse.ok) {
                const errorMsg = (json.error && json.error.message) ? json.error.message : (lastResponse.status + ' ' + lastResponse.statusText);
                errorHandler(errorMsg);
                return false;
            }
            return json;
        }).catch(err => {
            errorHandler(err);
        });
    }

    static fetchJson(url, errorHandler) {
        return this.call(url, {
            credentials: 'omit',
            method: 'get',
        }, errorHandler);
    }

    static postJson(url, data, errorHandler) {
        return this.call(url, {
            body: JSON.stringify(data),
            credentials: 'omit',
            method: 'post',
        }, errorHandler);
    }
}
