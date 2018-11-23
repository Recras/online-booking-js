class RecrasCSSHelper {

    static cssBooking() {
        return `
@import url('https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/css/pikaday.min.css');

.recras-onlinebooking {
    max-width: 800px;
}
.recras-onlinebooking > *:not(:first-child) + * {
    border-top: 2px solid #dedede; /* Any love for Kirby out there? */
}
.recras-input-invalid {
    border: 1px solid hsl(0, 50%, 50%);
}
.booking-error, .minimum-amount {
    color: hsl(0, 50%, 50%);
}
.minimum-amount {
    padding-left: 0.5em;
}
.recras-datetime {
    display: -ms-grid;
    display: grid;
    -ms-grid-columns: 30% 70%;
    grid-template-columns: 30% 70%;
}
.recras-datetime > * {
    margin: 0.25em 0;
}
.recras-datetime label {
    -ms-grid-column: 1;
}
.recras-datetime input, .recras-datetime select {
    max-width: 12em;
    -ms-grid-column: 2;
}
.recras-datetime > :nth-child(-n + 2) {
    -ms-grid-row: 1;
}
.recras-datetime > :nth-last-child(-n + 2) {
    -ms-grid-row: 2;
}
.time-preview {
    padding-right: 0.5em;
}
.recrasUnitPrice {
    opacity: 0.5;
}
.bookPackage {
    font: inherit;
    font-weight: bold;
    padding: 0.5em 2em;
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
.recras-contactform label {
    display: block;
}
.recras-full-width {
    flex: 0 0 100%;
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
