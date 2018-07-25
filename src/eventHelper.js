class RecrasEventHelper {
    static sendEvent(name) {
        let event;

        try {
            event = new Event(name);
        } catch (e) {
            // IE
            event = document.createEvent('Event');
            event.initEvent(name, true, true);
        }
        return document.dispatchEvent(event);
    }
}
