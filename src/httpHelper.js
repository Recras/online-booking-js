class RecrasHttpHelper {
    static fetchJson(url, errorHandler) {
        if (!url) {
            throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
        }
        return fetch(url, {
            method: 'get',
        }).then(response => {
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

}
