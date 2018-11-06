class RecrasCSSHelper {

    static cssBooking() {
        return `
@import url('https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/css/pikaday.min.css');

.recras-onlinebooking > *:not(:first-child) + * {
    border-top: 2px solid #dedede; /* Any love for Kirby out there? */
}

.booking-error, .minimum-amount {
    color: hsl(0, 50%, 50%);
}
.minimum-amount {
    padding-left: 0.5em;
}
.time-preview {
    padding-right: 0.5em;
}
`;
    }
    static cssGlobal() {
        return `
.recras-onlinebooking > *:not(.latestError):not(.recrasLoadingIndicator) {
    padding: 1em 0;
}
.recras-contactform > div, .recras-amountsform > div {
    align-items: start;
    display: flex;
    justify-content: space-between;
    padding: 0.25em 0;
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
button .recrasLoadingIndicator {
    height: 1em;
    margin-left: 0.5em;
    vertical-align: middle;
    width: 1em;
}
`;
    }

    static loadCSS(css) {
        let styleEl = document.createElement('style');
        styleEl.innerHTML = css;

        let refNode = document.head;
        refNode.parentNode.insertBefore(styleEl, refNode);
    }
}
