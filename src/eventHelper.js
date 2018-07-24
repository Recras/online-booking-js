class RecrasEventHelper {
    static sendEvent(name) {
        let event = new Event(name);
        return document.dispatchEvent(event);
    }
}
