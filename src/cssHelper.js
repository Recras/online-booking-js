class RecrasCSSHelper {

    static cssBooking() {
        return `
.recras-onlinebooking {
    max-width: 800px;
}
.recras-onlinebooking > form + form, .recras-finalise {
    border-top: 2px solid #dedede; /* Any love for Kirby out there? */
}
.recras-amountsform > div {
    display: grid;
    grid-template-columns: 1fr 5em 7em;
}
.recras-amountsform input {
    width: auto; /* Firefox fix */
}
.recras-input-invalid {
    border: 1px solid hsl(0, 50%, 50%);
}
.booking-error, .minimum-amount {
    color: hsl(0, 50%, 50%);
}
.recras-success {
    color: hsl(120, 40%, 40%);
}
.minimum-amount {
    padding-left: 0.5em;
}
.recras-datetime {
    display: grid;
    grid-template-columns: 30% 70%;
}
.recras-datetime > * {
    margin: 0.25em 0;
}
.recras-datetime label {
    display: block;
}
.recras-datetime input, .recras-datetime select {
    max-width: 12em;
}
.time-preview {
    padding-right: 0.5em;
}
.recrasUnitPrice {
    opacity: 0.5;
}
.recras-onlinebooking .recrasHidden {
    display: none;
}
`;
    }

    static cssGlobal() {
        return `
.latestError, .recrasError {
    color: hsl(0, 50%, 50%);
}
.recras-onlinebooking > *:not(.latestError):not(.recrasLoadingIndicator) {
    padding: 1em 0;
}
.recras-datetime, .recras-discounts > div, .recras-contactform > div {
    display: grid;
    grid-template-columns: 1fr 12em;
}
.recras-contactform > div {
    padding-bottom: 0.25em;
    padding-top: 0.25em;
}
.recras-contactform label {
    display: block;
}
.recras-amountsform .recras-full-width {
    display: block;
}

.recrasLoadingIndicator {
    animation: recrasSpinner 1.1s infinite linear;
    border: 0.2em solid rgba(0, 0, 0, 0.2);
    border-left-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: inline-block;
    height: 2em;
    overflow: hidden;
    text-indent: -100vw;
    width: 2em;
}
@keyframes recrasSpinner {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
button .recrasLoadingIndicator, label .recrasLoadingIndicator {
    height: 1em;
    vertical-align: middle;
    width: 1em;
}
button .recrasLoadingIndicator {
    margin-left: 0.5em;
}
.bookPackage, .submitForm, .buyTemplate {
    font: inherit;
    font-weight: bold;
    padding: 0.5em 2em;
}
@media (max-width: 520px) {
    .pika-single {
        max-width: 256px; /* Single month is 240px + 2x8px margin */
    }
}
`;
    }

    static insertIntoHead(el) {
        document.head.insertAdjacentElement('afterbegin', el);
    }

    static loadInlineCss(cssName, inlineCss) {
        let styleEl = document.createElement('style');
        styleEl.id = 'recras-css-' + cssName;
        styleEl.innerHTML = inlineCss;

        RecrasCSSHelper.insertIntoHead(styleEl);
    }

    static loadExternalCss(cssName, url) {
        let linkEl = document.createElement('link');
        linkEl.id = 'recras-css-' + cssName;
        linkEl.setAttribute('rel', 'stylesheet');
        linkEl.setAttribute('type', 'text/css');
        linkEl.setAttribute('href', url);

        RecrasCSSHelper.insertIntoHead(linkEl);
    }

    static loadCSS(cssName) {
        let inlineCss;
        let url;
        switch (cssName) {
            case 'booking':
                inlineCss = this.cssBooking();
                break;
            case 'global':
                inlineCss = this.cssGlobal();
                break;
            case 'pikaday':
                url = 'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.2/css/pikaday.min.css';
                break;
            default:
                console.warn('Unknown CSS');
                break;
        }
        if (document.getElementById('recras-css-' + cssName)) {
            return;
        }

        if (inlineCss) {
            RecrasCSSHelper.loadInlineCss(cssName, inlineCss);
        }
        if (url) {
            RecrasCSSHelper.loadExternalCss(cssName, url);
        }
    }
}
