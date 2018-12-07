class RecrasEventHelper {
    static sendEvent(name, analytics) {
        let event;

        try {
            event = new Event(name);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(name, true, true);
        }

        if (analytics && typeof analytics === 'function') {
            analytics('send', name);
        }

        return document.dispatchEvent(event);
    }
}
