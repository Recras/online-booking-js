/*!
 * Pikaday
 *
 * Copyright © 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory)
{
    'use strict';

    var moment;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        try { moment = require('moment'); } catch (e) {}
        module.exports = factory(moment);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req)
        {
            // Load moment.js as an optional dependency
            var id = 'moment';
            try { moment = req(id); } catch (e) {}
            return factory(moment);
        });
    } else {
        root.Pikaday = factory(root.moment);
    }
}(this, function (moment)
{
    'use strict';

    /**
     * feature detection and helper functions
     */
    var hasMoment = typeof moment === 'function',

    hasEventListeners = !!window.addEventListener,

    document = window.document,

    sto = window.setTimeout,

    addEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.addEventListener(e, callback, !!capture);
        } else {
            el.attachEvent('on' + e, callback);
        }
    },

    removeEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.removeEventListener(e, callback, !!capture);
        } else {
            el.detachEvent('on' + e, callback);
        }
    },

    trim = function(str)
    {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
    },

    hasClass = function(el, cn)
    {
        return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = function(el, cn)
    {
        if (!hasClass(el, cn)) {
            el.className = (el.className === '') ? cn : el.className + ' ' + cn;
        }
    },

    removeClass = function(el, cn)
    {
        el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    isArray = function(obj)
    {
        return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = function(obj)
    {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isWeekend = function(date)
    {
        var day = date.getDay();
        return day === 0 || day === 6;
    },

    isLeapYear = function(year)
    {
        // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function(year, month)
    {
        return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    setToStartOfDay = function(date)
    {
        if (isDate(date)) date.setHours(0,0,0,0);
    },

    compareDates = function(a,b)
    {
        // weak date comparison (use setToStartOfDay(date) to ensure correct result)
        return a.getTime() === b.getTime();
    },

    extend = function(to, from, overwrite)
    {
        var prop, hasProp;
        for (prop in from) {
            hasProp = to[prop] !== undefined;
            if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                if (isDate(from[prop])) {
                    if (overwrite) {
                        to[prop] = new Date(from[prop].getTime());
                    }
                }
                else if (isArray(from[prop])) {
                    if (overwrite) {
                        to[prop] = from[prop].slice(0);
                    }
                } else {
                    to[prop] = extend({}, from[prop], overwrite);
                }
            } else if (overwrite || !hasProp) {
                to[prop] = from[prop];
            }
        }
        return to;
    },

    fireEvent = function(el, eventName, data)
    {
        var ev;

        if (document.createEvent) {
            ev = document.createEvent('HTMLEvents');
            ev.initEvent(eventName, true, false);
            ev = extend(ev, data);
            el.dispatchEvent(ev);
        } else if (document.createEventObject) {
            ev = document.createEventObject();
            ev = extend(ev, data);
            el.fireEvent('on' + eventName, ev);
        }
    },

    adjustCalendar = function(calendar) {
        if (calendar.month < 0) {
            calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
            calendar.month += 12;
        }
        if (calendar.month > 11) {
            calendar.year += Math.floor(Math.abs(calendar.month)/12);
            calendar.month -= 12;
        }
        return calendar;
    },

    /**
     * defaults and localisation
     */
    defaults = {

        // bind the picker to a form field
        field: null,

        // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
        bound: undefined,

        // position of the datepicker, relative to the field (default to bottom & left)
        // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
        position: 'bottom left',

        // automatically fit in the viewport even if it means repositioning from the position option
        reposition: true,

        // the default output format for `.toString()` and `field` value
        format: 'YYYY-MM-DD',

        // the toString function which gets passed a current date object and format
        // and returns a string
        toString: null,

        // used to create date object from current input string
        parse: null,

        // the initial date to view when first opened
        defaultDate: null,

        // make the `defaultDate` the initial selected value
        setDefaultDate: false,

        // first day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // the default flag for moment's strict date parsing
        formatStrict: false,

        // the minimum/earliest date that can be selected
        minDate: null,
        // the maximum/latest date that can be selected
        maxDate: null,

        // number of years either side, or array of upper/lower range
        yearRange: 10,

        // show week numbers at head of row
        showWeekNumber: false,

        // Week picker mode
        pickWholeWeek: false,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        startRange: null,
        endRange: null,

        isRTL: false,

        // Additional text to append to the year in the calendar title
        yearSuffix: '',

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // Render days of the calendar grid that fall in the next or previous month
        showDaysInNextAndPreviousMonths: false,

        // Allows user to select days that fall in the next or previous month
        enableSelectionDaysInNextAndPreviousMonths: false,

        // how many months are visible
        numberOfMonths: 1,

        // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
        // only used for the first display or when a selected date is not visible
        mainCalendar: 'left',

        // Specify a DOM element to render the calendar in
        container: undefined,

        // Blur field when date is selected
        blurFieldOnSelect : true,

        // internationalization
        i18n: {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        },

        // Theme Classname
        theme: null,

        // events array
        events: [],

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null,
        onDraw: null,

        // Enable keyboard input
        keyboardInput: true
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function(opts, day, abbr)
    {
        day += opts.firstDay;
        while (day >= 7) {
            day -= 7;
        }
        return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function(opts)
    {
        var arr = [];
        var ariaSelected = 'false';
        if (opts.isEmpty) {
            if (opts.showDaysInNextAndPreviousMonths) {
                arr.push('is-outside-current-month');

                if(!opts.enableSelectionDaysInNextAndPreviousMonths) {
                    arr.push('is-selection-disabled');
                }

            } else {
                return '<td class="is-empty"></td>';
            }
        }
        if (opts.isDisabled) {
            arr.push('is-disabled');
        }
        if (opts.isToday) {
            arr.push('is-today');
        }
        if (opts.isSelected) {
            arr.push('is-selected');
            ariaSelected = 'true';
        }
        if (opts.hasEvent) {
            arr.push('has-event');
        }
        if (opts.isInRange) {
            arr.push('is-inrange');
        }
        if (opts.isStartRange) {
            arr.push('is-startrange');
        }
        if (opts.isEndRange) {
            arr.push('is-endrange');
        }
        return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '" aria-selected="' + ariaSelected + '">' +
                 '<button class="pika-button pika-day" type="button" ' +
                    'data-pika-year="' + opts.year + '" data-pika-month="' + opts.month + '" data-pika-day="' + opts.day + '">' +
                        opts.day +
                 '</button>' +
               '</td>';
    },

    renderWeek = function (d, m, y) {
        // Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
        var onejan = new Date(y, 0, 1),
            weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay()+1)/7);
        return '<td class="pika-week">' + weekNum + '</td>';
    },

    renderRow = function(days, isRTL, pickWholeWeek, isRowSelected)
    {
        return '<tr class="pika-row' + (pickWholeWeek ? ' pick-whole-week' : '') + (isRowSelected ? ' is-selected' : '') + '">' + (isRTL ? days.reverse() : days).join('') + '</tr>';
    },

    renderBody = function(rows)
    {
        return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = function(opts)
    {
        var i, arr = [];
        if (opts.showWeekNumber) {
            arr.push('<th></th>');
        }
        for (i = 0; i < 7; i++) {
            arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
        }
        return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
    },

    renderTitle = function(instance, c, year, month, refYear, randId)
    {
        var i, j, arr,
            opts = instance._o,
            isMinYear = year === opts.minYear,
            isMaxYear = year === opts.maxYear,
            html = '<div id="' + randId + '" class="pika-title" role="heading" aria-live="assertive">',
            monthHtml,
            yearHtml,
            prev = true,
            next = true;

        for (arr = [], i = 0; i < 12; i++) {
            arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
                (i === month ? ' selected="selected"': '') +
                ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled="disabled"' : '') + '>' +
                opts.i18n.months[i] + '</option>');
        }

        monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

        if (isArray(opts.yearRange)) {
            i = opts.yearRange[0];
            j = opts.yearRange[1] + 1;
        } else {
            i = year - opts.yearRange;
            j = 1 + year + opts.yearRange;
        }

        for (arr = []; i < j && i <= opts.maxYear; i++) {
            if (i >= opts.minYear) {
                arr.push('<option value="' + i + '"' + (i === year ? ' selected="selected"': '') + '>' + (i) + '</option>');
            }
        }
        yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

        if (opts.showMonthAfterYear) {
            html += yearHtml + monthHtml;
        } else {
            html += monthHtml + yearHtml;
        }

        if (isMinYear && (month === 0 || opts.minMonth >= month)) {
            prev = false;
        }

        if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
            next = false;
        }

        if (c === 0) {
            html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
        }
        if (c === (instance._o.numberOfMonths - 1) ) {
            html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
        }

        return html += '</div>';
    },

    renderTable = function(opts, data, randId)
    {
        return '<table cellpadding="0" cellspacing="0" class="pika-table" role="grid" aria-labelledby="' + randId + '">' + renderHead(opts) + renderBody(data) + '</table>';
    },


    /**
     * Pikaday constructor
     */
    Pikaday = function(options)
    {
        var self = this,
            opts = self.config(options);

        self._onMouseDown = function(e)
        {
            if (!self._v) {
                return;
            }
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }

            if (!hasClass(target, 'is-disabled')) {
                if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty') && !hasClass(target.parentNode, 'is-disabled')) {
                    self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
                    if (opts.bound) {
                        sto(function() {
                            self.hide();
                            if (opts.blurFieldOnSelect && opts.field) {
                                opts.field.blur();
                            }
                        }, 100);
                    }
                }
                else if (hasClass(target, 'pika-prev')) {
                    self.prevMonth();
                }
                else if (hasClass(target, 'pika-next')) {
                    self.nextMonth();
                }
            }
            if (!hasClass(target, 'pika-select')) {
                // if this is touch event prevent mouse events emulation
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                    return false;
                }
            } else {
                self._c = true;
            }
        };

        self._onChange = function(e)
        {
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }
            if (hasClass(target, 'pika-select-month')) {
                self.gotoMonth(target.value);
            }
            else if (hasClass(target, 'pika-select-year')) {
                self.gotoYear(target.value);
            }
        };

        self._onKeyChange = function(e)
        {
            e = e || window.event;

            if (self.isVisible()) {

                switch(e.keyCode){
                    case 13:
                    case 27:
                        if (opts.field) {
                            opts.field.blur();
                        }
                        break;
                    case 37:
                        e.preventDefault();
                        self.adjustDate('subtract', 1);
                        break;
                    case 38:
                        self.adjustDate('subtract', 7);
                        break;
                    case 39:
                        self.adjustDate('add', 1);
                        break;
                    case 40:
                        self.adjustDate('add', 7);
                        break;
                }
            }
        };

        self._onInputChange = function(e)
        {
            var date;

            if (e.firedBy === self) {
                return;
            }
            if (opts.parse) {
                date = opts.parse(opts.field.value, opts.format);
            } else if (hasMoment) {
                date = moment(opts.field.value, opts.format, opts.formatStrict);
                date = (date && date.isValid()) ? date.toDate() : null;
            }
            else {
                date = new Date(Date.parse(opts.field.value));
            }
            if (isDate(date)) {
              self.setDate(date);
            }
            if (!self._v) {
                self.show();
            }
        };

        self._onInputFocus = function()
        {
            self.show();
        };

        self._onInputClick = function()
        {
            self.show();
        };

        self._onInputBlur = function()
        {
            // IE allows pika div to gain focus; catch blur the input field
            var pEl = document.activeElement;
            do {
                if (hasClass(pEl, 'pika-single')) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));

            if (!self._c) {
                self._b = sto(function() {
                    self.hide();
                }, 50);
            }
            self._c = false;
        };

        self._onClick = function(e)
        {
            e = e || window.event;
            var target = e.target || e.srcElement,
                pEl = target;
            if (!target) {
                return;
            }
            if (!hasEventListeners && hasClass(target, 'pika-select')) {
                if (!target.onchange) {
                    target.setAttribute('onchange', 'return;');
                    addEvent(target, 'change', self._onChange);
                }
            }
            do {
                if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));
            if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
                self.hide();
            }
        };

        self.el = document.createElement('div');
        self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '') + (opts.theme ? ' ' + opts.theme : '');

        addEvent(self.el, 'mousedown', self._onMouseDown, true);
        addEvent(self.el, 'touchend', self._onMouseDown, true);
        addEvent(self.el, 'change', self._onChange);

        if (opts.keyboardInput) {
            addEvent(document, 'keydown', self._onKeyChange);
        }

        if (opts.field) {
            if (opts.container) {
                opts.container.appendChild(self.el);
            } else if (opts.bound) {
                document.body.appendChild(self.el);
            } else {
                opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
            }
            addEvent(opts.field, 'change', self._onInputChange);

            if (!opts.defaultDate) {
                if (hasMoment && opts.field.value) {
                    opts.defaultDate = moment(opts.field.value, opts.format).toDate();
                } else {
                    opts.defaultDate = new Date(Date.parse(opts.field.value));
                }
                opts.setDefaultDate = true;
            }
        }

        var defDate = opts.defaultDate;

        if (isDate(defDate)) {
            if (opts.setDefaultDate) {
                self.setDate(defDate, true);
            } else {
                self.gotoDate(defDate);
            }
        } else {
            self.gotoDate(new Date());
        }

        if (opts.bound) {
            this.hide();
            self.el.className += ' is-bound';
            addEvent(opts.trigger, 'click', self._onInputClick);
            addEvent(opts.trigger, 'focus', self._onInputFocus);
            addEvent(opts.trigger, 'blur', self._onInputBlur);
        } else {
            this.show();
        }
    };


    /**
     * public Pikaday API
     */
    Pikaday.prototype = {


        /**
         * configure functionality
         */
        config: function(options)
        {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.isRTL = !!opts.isRTL;

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.theme = (typeof opts.theme) === 'string' && opts.theme ? opts.theme : null;

            opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            opts.disableWeekends = !!opts.disableWeekends;

            opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;

            var nom = parseInt(opts.numberOfMonths, 10) || 1;
            opts.numberOfMonths = nom > 4 ? 4 : nom;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                this.setMinDate(opts.minDate);
            }
            if (opts.maxDate) {
                this.setMaxDate(opts.maxDate);
            }

            if (isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                if (opts.yearRange > 100) {
                    opts.yearRange = 100;
                }
            }

            return opts;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function(format)
        {
            format = format || this._o.format;
            if (!isDate(this._d)) {
                return '';
            }
            if (this._o.toString) {
              return this._o.toString(this._d, format);
            }
            if (hasMoment) {
              return moment(this._d).format(format);
            }
            return this._d.toDateString();
        },

        /**
         * return a Moment.js object of the current selection (if available)
         */
        getMoment: function()
        {
            return hasMoment ? moment(this._d) : null;
        },

        /**
         * set the current selection from a Moment.js object (if available)
         */
        setMoment: function(date, preventOnSelect)
        {
            if (hasMoment && moment.isMoment(date)) {
                this.setDate(date.toDate(), preventOnSelect);
            }
        },

        /**
         * return a Date object of the current selection
         */
        getDate: function()
        {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },

        /**
         * set the current selection
         */
        setDate: function(date, preventOnSelect)
        {
            if (!date) {
                this._d = null;

                if (this._o.field) {
                    this._o.field.value = '';
                    fireEvent(this._o.field, 'change', { firedBy: this });
                }

                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        /**
         * change view to a specific date
         */
        gotoDate: function(date)
        {
            var newCalendar = true;

            if (!isDate(date)) {
                return;
            }

            if (this.calendars) {
                var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(this.calendars[this.calendars.length-1].year, this.calendars[this.calendars.length-1].month, 1),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth()+1);
                lastVisibleDate.setDate(lastVisibleDate.getDate()-1);
                newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
            }

            if (newCalendar) {
                this.calendars = [{
                    month: date.getMonth(),
                    year: date.getFullYear()
                }];
                if (this._o.mainCalendar === 'right') {
                    this.calendars[0].month += 1 - this._o.numberOfMonths;
                }
            }

            this.adjustCalendars();
        },

        adjustDate: function(sign, days) {

            var day = this.getDate() || new Date();
            var difference = parseInt(days)*24*60*60*1000;

            var newDay;

            if (sign === 'add') {
                newDay = new Date(day.valueOf() + difference);
            } else if (sign === 'subtract') {
                newDay = new Date(day.valueOf() - difference);
            }

            this.setDate(newDay);
        },

        adjustCalendars: function() {
            this.calendars[0] = adjustCalendar(this.calendars[0]);
            for (var c = 1; c < this._o.numberOfMonths; c++) {
                this.calendars[c] = adjustCalendar({
                    month: this.calendars[0].month + c,
                    year: this.calendars[0].year
                });
            }
            this.draw();
        },

        gotoToday: function()
        {
            this.gotoDate(new Date());
        },

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        gotoMonth: function(month)
        {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        },

        nextMonth: function()
        {
            this.calendars[0].month++;
            this.adjustCalendars();
        },

        prevMonth: function()
        {
            this.calendars[0].month--;
            this.adjustCalendars();
        },

        /**
         * change view to a specific full year (e.g. "2012")
         */
        gotoYear: function(year)
        {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        },

        /**
         * change the minDate
         */
        setMinDate: function(value)
        {
            if(value instanceof Date) {
                setToStartOfDay(value);
                this._o.minDate = value;
                this._o.minYear  = value.getFullYear();
                this._o.minMonth = value.getMonth();
            } else {
                this._o.minDate = defaults.minDate;
                this._o.minYear  = defaults.minYear;
                this._o.minMonth = defaults.minMonth;
                this._o.startRange = defaults.startRange;
            }

            this.draw();
        },

        /**
         * change the maxDate
         */
        setMaxDate: function(value)
        {
            if(value instanceof Date) {
                setToStartOfDay(value);
                this._o.maxDate = value;
                this._o.maxYear = value.getFullYear();
                this._o.maxMonth = value.getMonth();
            } else {
                this._o.maxDate = defaults.maxDate;
                this._o.maxYear = defaults.maxYear;
                this._o.maxMonth = defaults.maxMonth;
                this._o.endRange = defaults.endRange;
            }

            this.draw();
        },

        setStartRange: function(value)
        {
            this._o.startRange = value;
        },

        setEndRange: function(value)
        {
            this._o.endRange = value;
        },

        /**
         * refresh the HTML
         */
        draw: function(force)
        {
            if (!this._v && !force) {
                return;
            }
            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '',
                randId;

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            randId = 'pika-title-' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 2);

            for (var c = 0; c < opts.numberOfMonths; c++) {
                html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year, randId) + this.render(this.calendars[c].year, this.calendars[c].month, randId) + '</div>';
            }

            this.el.innerHTML = html;

            if (opts.bound) {
                if(opts.field.type !== 'hidden') {
                    sto(function() {
                        opts.trigger.focus();
                    }, 1);
                }
            }

            if (typeof this._o.onDraw === 'function') {
                this._o.onDraw(this);
            }

            if (opts.bound) {
                // let the screen reader user know to use arrow keys
                opts.field.setAttribute('aria-label', 'Use the arrow keys to pick a date');
            }
        },

        adjustPosition: function()
        {
            var field, pEl, width, height, viewportWidth, viewportHeight, scrollTop, left, top, clientRect;

            if (this._o.container) return;

            this.el.style.position = 'absolute';

            field = this._o.trigger;
            pEl = field;
            width = this.el.offsetWidth;
            height = this.el.offsetHeight;
            viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top  = pEl.offsetTop + pEl.offsetHeight;
                while((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top  += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if ((this._o.reposition && left + width > viewportWidth) ||
                (
                    this._o.position.indexOf('right') > -1 &&
                    left - width + field.offsetWidth > 0
                )
            ) {
                left = left - width + field.offsetWidth;
            }
            if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
                (
                    this._o.position.indexOf('top') > -1 &&
                    top - height - field.offsetHeight > 0
                )
            ) {
                top = top - height - field.offsetHeight;
            }

            this.el.style.left = left + 'px';
            this.el.style.top = top + 'px';
        },

        /**
         * render HTML for a particular month
         */
        render: function(year, month, randId)
        {
            var opts   = this._o,
                now    = new Date(),
                days   = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data   = [],
                row    = [];
            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            var previousMonth = month === 0 ? 11 : month - 1,
                nextMonth = month === 11 ? 0 : month + 1,
                yearOfPreviousMonth = month === 0 ? year - 1 : year,
                yearOfNextMonth = month === 11 ? year + 1 : year,
                daysInPreviousMonth = getDaysInMonth(yearOfPreviousMonth, previousMonth);
            var cells = days + before,
                after = cells;
            while(after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            var isWeekSelected = false;
            for (var i = 0, r = 0; i < cells; i++)
            {
                var day = new Date(year, month, 1 + (i - before)),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    hasEvent = opts.events.indexOf(day.toDateString()) !== -1 ? true : false,
                    isEmpty = i < before || i >= (days + before),
                    dayNumber = 1 + (i - before),
                    monthNumber = month,
                    yearNumber = year,
                    isStartRange = opts.startRange && compareDates(opts.startRange, day),
                    isEndRange = opts.endRange && compareDates(opts.endRange, day),
                    isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
                    isDisabled = (opts.minDate && day < opts.minDate) ||
                                 (opts.maxDate && day > opts.maxDate) ||
                                 (opts.disableWeekends && isWeekend(day)) ||
                                 (opts.disableDayFn && opts.disableDayFn(day));

                if (isEmpty) {
                    if (i < before) {
                        dayNumber = daysInPreviousMonth + dayNumber;
                        monthNumber = previousMonth;
                        yearNumber = yearOfPreviousMonth;
                    } else {
                        dayNumber = dayNumber - days;
                        monthNumber = nextMonth;
                        yearNumber = yearOfNextMonth;
                    }
                }

                var dayConfig = {
                        day: dayNumber,
                        month: monthNumber,
                        year: yearNumber,
                        hasEvent: hasEvent,
                        isSelected: isSelected,
                        isToday: isToday,
                        isDisabled: isDisabled,
                        isEmpty: isEmpty,
                        isStartRange: isStartRange,
                        isEndRange: isEndRange,
                        isInRange: isInRange,
                        showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths,
                        enableSelectionDaysInNextAndPreviousMonths: opts.enableSelectionDaysInNextAndPreviousMonths
                    };

                if (opts.pickWholeWeek && isSelected) {
                    isWeekSelected = true;
                }

                row.push(renderDay(dayConfig));

                if (++r === 7) {
                    if (opts.showWeekNumber) {
                        row.unshift(renderWeek(i - before, month, year));
                    }
                    data.push(renderRow(row, opts.isRTL, opts.pickWholeWeek, isWeekSelected));
                    row = [];
                    r = 0;
                    isWeekSelected = false;
                }
            }
            return renderTable(opts, data, randId);
        },

        isVisible: function()
        {
            return this._v;
        },

        show: function()
        {
            if (!this.isVisible()) {
                this._v = true;
                this.draw();
                removeClass(this.el, 'is-hidden');
                if (this._o.bound) {
                    addEvent(document, 'click', this._onClick);
                    this.adjustPosition();
                }
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function()
        {
            var v = this._v;
            if (v !== false) {
                if (this._o.bound) {
                    removeEvent(document, 'click', this._onClick);
                }
                this.el.style.position = 'static'; // reset
                this.el.style.left = 'auto';
                this.el.style.top = 'auto';
                addClass(this.el, 'is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /**
         * GAME OVER
         */
        destroy: function()
        {
            var opts = this._o;

            this.hide();
            removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            removeEvent(this.el, 'touchend', this._onMouseDown, true);
            removeEvent(this.el, 'change', this._onChange);
            if (opts.keyboardInput) {
                removeEvent(document, 'keydown', this._onKeyChange);
            }
            if (opts.field) {
                removeEvent(opts.field, 'change', this._onInputChange);
                if (opts.bound) {
                    removeEvent(opts.trigger, 'click', this._onInputClick);
                    removeEvent(opts.trigger, 'focus', this._onInputFocus);
                    removeEvent(opts.trigger, 'blur', this._onInputBlur);
                }
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return Pikaday;
}));
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**********************************
*  Recras Online Booking library  *
*  v 0.2.0                        *
**********************************/

var RecrasBooking = function () {
    function RecrasBooking(options) {
        var _this = this;

        _classCallCheck(this, RecrasBooking);

        options = options || {};

        this.PACKAGE_SELECTION = 'package_selection';
        this.DATE_SELECTION = 'date_selection';
        this.GENDERS = {
            onbekend: 'GENDER_UNKNOWN',
            man: 'GENDER_MALE',
            vrouw: 'GENDER_FEMALE'
        };
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#inappropriate-for-the-control
        this.AUTOCOMPLETE_OPTIONS = {
            'contactpersoon.voornaam': 'given-name',
            'contactpersoon.achternaam': 'family-name',
            'contact.landcode': 'country',
            'contact.naam': 'organization',
            'contactpersoon.adres': 'address-line1',
            'contactpersoon.postcode': 'postal-code',
            'contactpersoon.plaats': 'address-level2'
        };

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            en_GB: {
                ATTR_REQUIRED: 'Required',
                BUTTON_BOOK_NOW: 'Book now',
                DATE: 'Date',
                DATE_INVALID: 'Invalid date',
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_CODE: 'Discount code',
                DISCOUNT_INVALID: 'Invalid discount code',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                VOUCHER: 'Voucher',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_APPLY: 'Apply',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_INVALID: 'Invalid voucher code'
            }
        };

        this.datePicker = null;

        var CSS = '\n@import url(\'https://cdn.rawgit.com/dbushell/Pikaday/eddaaa3b/css/pikaday.css\');\n\n.recras-onlinebooking > * {\n    padding: 1em 0;\n}\n.recras-onlinebooking > * + * {\n    border-top: 2px solid #dedede; /* Any love for Kirby out there? */\n}\n.recras-contactform div, .recras-amountsform div {\n    align-items: start;\n    display: flex;\n    justify-content: space-between;\n    padding: 0.25em 0;\n}\n.time-preview, .minimum-amount {\n    padding-left: 0.5em;\n} \n.minimum-amount {\n    color: hsl(0, 50%, 50%);\n}\n';
        this.validateOptions(options);

        this.element = options.element;
        this.element.classList.add('recras-onlinebooking');

        this.locale = RecrasLanguageHelper.defaultLocale;
        if (options.locale) {
            if (!RecrasLanguageHelper.isValid(options.locale)) {
                console.warn(this.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', ')
                }));
            } else {
                this.locale = options.locale;
            }
        }

        this.apiBase = 'https://' + options.recras_hostname + '/api2/';
        if (options.recras_hostname === '172.16.0.2') {
            this.apiBase = this.apiBase.replace('https://', 'http://');
        }

        this.loadCSS(CSS);
        this.setCurrency();

        this.getPackages().then(function (packages) {
            if (options.package_id) {
                _this.changePackage(options.package_id);
            } else {
                _this.showPackages(packages);
            }
        });
    }

    _createClass(RecrasBooking, [{
        key: 'amountsValid',
        value: function amountsValid(pack) {
            var hasAtLeastOneProduct = false;
            this.getLinesNoBookingSize(pack).forEach(function (line) {
                var aantal = document.querySelector('[data-package-id="' + line.id + '"]').value;
                if (aantal > 0) {
                    hasAtLeastOneProduct = true;
                }
                if (aantal > 0 && aantal < line.aantal_personen) {
                    return false;
                }
            });
            if (this.shouldShowBookingSize(pack) && this.bookingSize() > 0) {
                hasAtLeastOneProduct = true;
            }
            return hasAtLeastOneProduct;
        }
    }, {
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'applyVoucher',
        value: function applyVoucher(packageID, voucherCode) {
            var _this2 = this;

            var statusEl = document.getElementById('voucher-status');
            if (statusEl) {
                statusEl.parentNode.removeChild(statusEl);
            }

            if (!voucherCode) {
                document.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span id="voucher-status">' + this.translate('VOUCHER_EMPTY') + '</span>');
                return false;
            }
            if (this.appliedVouchers[voucherCode]) {
                document.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span id="voucher-status">' + this.translate('VOUCHER_ALREADY_APPLIED') + '</span>');
                return false;
            }
            var date = document.getElementById('recras-onlinebooking-date').value;
            if (isNaN(Date.parse(date))) {
                document.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span id="voucher-status">' + this.translate('DATE_INVALID') + '</span>');
                return false;
            }

            this.postJson(this.apiBase + 'onlineboeking/controleervoucher', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(new Date(date)),
                producten: this.productCounts(),
                vouchers: [voucherCode]
            }).then(function (json) {
                var result = json[voucherCode];
                if (!result.valid) {
                    document.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span id="voucher-status">' + _this2.translate('VOUCHER_INVALID') + '</span>');
                    return false;
                }

                _this2.appliedVouchers[voucherCode] = result.processed;
                _this2.showTotalPrice();

                document.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span id="voucher-status">' + _this2.translate('VOUCHER_APPLIED') + '</span>');
            });
        }
    }, {
        key: 'bookingSize',
        value: function bookingSize() {
            var bookingSizeEl = document.getElementById('bookingsize');
            if (!bookingSizeEl) {
                return 0;
            }
            return bookingSizeEl.value;
        }
    }, {
        key: 'changePackage',
        value: function changePackage(packageID) {
            var _this3 = this;

            var selectedPackage = this.packages.filter(function (p) {
                return p.id === packageID;
            });

            this.appliedVouchers = {};
            this.discount = null;

            if (this.datePicker) {
                this.datePicker.destroy();
            }
            [].concat(_toConsumableArray(document.querySelectorAll('.recras-amountsform, .recras-datetime, .recras-contactform'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            if (selectedPackage.length === 0) {
                // Reset form
                this.selectedPackage = null;
                this.showPackages(packages);
                return false;
            }
            this.selectedPackage = selectedPackage[0];
            this.showProducts(this.selectedPackage);
            this.checkDependencies();
            this.showDateTimeSelection(this.selectedPackage).then(function () {
                _this3.showContactForm(_this3.selectedPackage);
            });
        }
    }, {
        key: 'checkDependencies',
        value: function checkDependencies() {
            var _this4 = this;

            [].concat(_toConsumableArray(document.querySelectorAll('.recras-product-dependency'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.requiresProduct = false;

            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var packageLineID = line.arrangementsregel_id;
                    var product = _this4.findProduct(packageLineID).product;
                    product.vereist_product.forEach(function (vp) {
                        if (!_this4.dependencySatisfied(line.aantal, vp)) {
                            _this4.requiresProduct = true;
                            var requiredAmount = _this4.requiredAmount(line.aantal, vp);
                            var requiredProductName = _this4.getProductByID(vp.vereist_product_id).weergavenaam;
                            var message = _this4.translate('PRODUCT_REQUIRED', {
                                NUM: line.aantal,
                                PRODUCT: product.weergavenaam,
                                REQUIRED_AMOUNT: requiredAmount,
                                REQUIRED_PRODUCT: requiredProductName
                            });
                            document.querySelector('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="recras-product-dependency">' + message + '</span>');
                        }
                    });
                }
            });

            this.maybeDisableBookButton();
        }
    }, {
        key: 'checkDiscountcode',
        value: function checkDiscountcode(packageID, date, code) {
            var _this5 = this;

            var statusEl = document.getElementById('discount-status');
            if (statusEl) {
                statusEl.parentNode.removeChild(statusEl);
            }
            return this.fetchJson(this.apiBase + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code).then(function (discount) {
                if (discount === false) {
                    document.querySelector('.recras-discountcode').insertAdjacentHTML('beforeend', '<span id="discount-status">' + _this5.translate('DISCOUNT_INVALID') + '</span>');
                    return;
                }
                discount.code = code;
                _this5.discount = discount;

                _this5.showTotalPrice();
            });
        }
    }, {
        key: 'checkMinimumAmounts',
        value: function checkMinimumAmounts() {
            var _this6 = this;

            [].concat(_toConsumableArray(document.querySelectorAll('.minimum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var selectedProducts = this.productCounts();
            selectedProducts.forEach(function (p) {
                if (p.aantal > 0) {
                    var packageLineID = p.arrangementsregel_id;

                    var packageLine = _this6.findProduct(packageLineID);
                    if (p.aantal < packageLine.aantal_personen) {
                        var input = document.querySelector('[data-package-id="' + packageLineID + '"]');
                        var label = document.querySelector('label[for="' + input.id + '"]');

                        var warnEl = document.createElement('span');
                        warnEl.classList.add('minimum-amount');
                        warnEl.innerHTML = '(must be at least ' + packageLine.aantal_personen + ')';
                        label.parentNode.appendChild(warnEl);
                    }
                }
            });
        }
    }, {
        key: 'dependencySatisfied',
        value: function dependencySatisfied(hasNow, requiredProduct) {
            var productLines = this.productCounts();
            for (var i = 0; i < productLines.length; i++) {
                var line = productLines[i];
                if (line.aantal === 0) {
                    continue;
                }

                var product = this.findProduct(line.arrangementsregel_id).product;
                if (product.id !== parseInt(requiredProduct.vereist_product_id, 10)) {
                    continue;
                }

                var requiredAmount = this.requiredAmount(hasNow, requiredProduct);

                return line.aantal >= requiredAmount;
            }
            return false;
        }
    }, {
        key: 'error',
        value: function error(msg) {
            this.setHtml('<strong>{ this.translate(\'ERR_GENERAL\') }</strong><p>' + msg + '</p>');
        }
    }, {
        key: 'fetchJson',
        value: function fetchJson(url) {
            var _this7 = this;

            return fetch(url, {
                method: 'get'
            }).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    _this7.error(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                return json;
            }).catch(function (err) {
                _this7.error(err);
            });
        }
    }, {
        key: 'findProduct',
        value: function findProduct(packageLineID) {
            return this.selectedPackage.regels.filter(function (line) {
                return line.id === packageLineID;
            })[0];
        }
    }, {
        key: 'formatLocale',
        value: function formatLocale(what) {
            switch (what) {
                case 'currency':
                    return this.locale.replace('_', '-').toUpperCase();
                default:
                    return this.locale;
            }
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return price.toLocaleString(this.formatLocale('currency'), {
                currency: this.currency,
                style: 'currency'
            });
        }
    }, {
        key: 'generateContactForm',
        value: function generateContactForm() {
            var contactForm = {};
            [].concat(_toConsumableArray(document.querySelectorAll('[id^="contactformulier-"]'))).forEach(function (field) {
                contactForm[field.dataset.identifier] = field.value;
            });
            return contactForm;
        }
    }, {
        key: 'getAvailableDays',
        value: function getAvailableDays(packageID, begin, end) {
            var _this8 = this;

            return this.postJson(this.apiBase + 'onlineboeking/beschikbaredagen', {
                arrangement_id: packageID,
                begin: RecrasDateHelper.datePartOnly(begin),
                eind: RecrasDateHelper.datePartOnly(end),
                producten: this.productCounts()
            }).then(function (json) {
                _this8.availableDays = json;
                return _this8.availableDays;
            });
        }
    }, {
        key: 'getAvailableTimes',
        value: function getAvailableTimes(packageID, date) {
            var _this9 = this;

            return this.postJson(this.apiBase + 'onlineboeking/beschikbaretijden', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(date),
                producten: this.productCounts()
            }).then(function (json) {
                _this9.availableTimes = json;
                return _this9.availableTimes;
            });
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(pack) {
            var _this10 = this;

            return this.fetchJson(this.apiBase + 'contactformulieren/' + pack.onlineboeking_contactformulier_id + '/velden').then(function (json) {
                _this10.contactFormFields = json;
                return _this10.contactFormFields;
            });
        }
    }, {
        key: 'getCountryList',
        value: function getCountryList(locale) {
            var _this11 = this;

            return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + locale + '/country.json').then(function (json) {
                _this11.countries = json;
                return _this11.countries;
            });
        }
    }, {
        key: 'getDiscountPrice',
        value: function getDiscountPrice(discount) {
            if (!discount) {
                return 0;
            }
            return discount.percentage / 100 * this.getSubTotal() * -1;
        }
    }, {
        key: 'getLinesNoBookingSize',
        value: function getLinesNoBookingSize(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode !== 'boekingsgrootte';
            });
        }
    }, {
        key: 'getPackages',
        value: function getPackages() {
            var _this12 = this;

            return this.fetchJson(this.apiBase + 'arrangementen').then(function (json) {
                _this12.packages = json;
                return _this12.packages;
            });
        }
    }, {
        key: 'getProductByID',
        value: function getProductByID(id) {
            var products = this.selectedPackage.regels.map(function (r) {
                return r.product;
            });
            return products.filter(function (p) {
                return p.id === id;
            })[0];
        }
    }, {
        key: 'getSubTotal',
        value: function getSubTotal() {
            var _this13 = this;

            var total = 0;
            this.productCounts().forEach(function (line) {
                var product = _this13.findProduct(line.arrangementsregel_id).product;
                total += line.aantal * product.verkoop;
            });
            return total;
        }
    }, {
        key: 'getTotalPrice',
        value: function getTotalPrice() {
            var total = this.getSubTotal();

            total += this.getDiscountPrice(this.discount);
            total += this.getVouchersPrice();

            return total;
        }
    }, {
        key: 'getVouchersPrice',
        value: function getVouchersPrice() {
            var voucherPrice = 0;
            Object.values(this.appliedVouchers).forEach(function (voucher) {
                Object.values(voucher).forEach(function (line) {
                    voucherPrice -= line.aantal * line.prijs_per_stuk;
                });
            });

            return voucherPrice;
        }
    }, {
        key: 'loadCSS',
        value: function loadCSS(content) {
            var styleEl = document.createElement('style');
            styleEl.innerHTML = content;

            var refNode = document.head;
            refNode.parentNode.insertBefore(styleEl, refNode);
        }
    }, {
        key: 'maybeDisableBookButton',
        value: function maybeDisableBookButton() {
            var button = document.getElementById('bookPackage');
            if (!button) {
                return false;
            }

            var shouldDisable = false;
            if (this.requiresProduct) {
                shouldDisable = true;
            }
            if (!this.amountsValid(this.selectedPackage)) {
                shouldDisable = true;
            }
            if (!document.getElementById('recras-onlinebooking-date').value) {
                shouldDisable = true;
            }
            if (!document.getElementById('recras-onlinebooking-time').value) {
                shouldDisable = true;
            }
            if (!document.querySelector('.recras-contactform').checkValidity()) {
                shouldDisable = true;
            }

            if (shouldDisable) {
                button.setAttribute('disabled', 'disabled');
            } else {
                button.removeAttribute('disabled');
            }
        }
    }, {
        key: 'postJson',
        value: function postJson(url, data) {
            var _this14 = this;

            return fetch(url, {
                body: JSON.stringify(data),
                method: 'post'
            }).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    _this14.error(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                return json;
            }).catch(function (err) {
                _this14.error(err);
            });
        }
    }, {
        key: 'normaliseDate',
        value: function normaliseDate(date, packageStart, bookingStart) {
            var diffSeconds = (date - packageStart) / 1000;
            return new Date(bookingStart.setSeconds(bookingStart.getSeconds() + diffSeconds));
        }
    }, {
        key: 'previewTimes',
        value: function previewTimes() {
            var _this15 = this;

            [].concat(_toConsumableArray(document.querySelectorAll('.time-preview'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            if (this.selectedTime) {
                var linesWithTime = this.selectedPackage.regels.filter(function (line) {
                    return !!line.begin;
                });
                var linesBegin = linesWithTime.map(function (line) {
                    return new Date(line.begin);
                });
                var packageStart = new Date(Math.min.apply(Math, _toConsumableArray(linesBegin))); // Math.min transforms dates to timestamps

                var bookingStart = this.selectedDate;
                bookingStart = RecrasDateHelper.setTimeForDate(bookingStart, this.selectedTime);

                var linesNoBookingSize = this.getLinesNoBookingSize(this.selectedPackage);
                linesNoBookingSize.forEach(function (line, idx) {
                    var normalisedStart = _this15.normaliseDate(new Date(line.begin), packageStart, bookingStart);
                    var normalisedEnd = _this15.normaliseDate(new Date(line.eind), packageStart, bookingStart);
                    document.querySelector('label[for="packageline' + idx + '"]').insertAdjacentHTML('beforeend', '<span class="time-preview">(' + RecrasDateHelper.timePartOnly(normalisedStart) + ' \u2013 ' + RecrasDateHelper.timePartOnly(normalisedEnd) + ')</span>');
                });
            }
        }
    }, {
        key: 'productCounts',
        value: function productCounts() {
            var counts = [];
            [].concat(_toConsumableArray(document.querySelectorAll('[id^="packageline"]'))).forEach(function (line) {
                counts.push({
                    aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
                    arrangementsregel_id: parseInt(line.dataset.packageId, 10)
                });
            });
            return counts;
        }
    }, {
        key: 'requiredAmount',
        value: function requiredAmount(hasNow, requiredProduct) {
            var requiredAmount = hasNow / requiredProduct.per_x_aantal;
            if (requiredProduct.afronding === 'boven') {
                requiredAmount = Math.ceil(requiredAmount);
            } else {
                requiredAmount = Math.floor(requiredAmount);
            }
            return requiredAmount;
        }
    }, {
        key: 'resetForm',
        value: function resetForm() {
            this.changePackage(null);
        }
    }, {
        key: 'setCurrency',
        value: function setCurrency() {
            this.currency = 'eur'; //TODO: will be available on 2018-05-07
            /*this.fetchJson(this.apiBase + 'instellingen/currency')
                .then(setting => {
                    this.currency = setting.waarde;
                });*/
        }
    }, {
        key: 'setHtml',
        value: function setHtml(msg) {
            this.element.innerHTML = msg;
        }
    }, {
        key: 'showTotalPrice',
        value: function showTotalPrice() {
            [].concat(_toConsumableArray(document.querySelectorAll('.discountLine, .voucherLine, .priceTotal'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '';

            if (this.discount) {
                html += '<div class="discountLine"><div>' + this.discount.naam + '</div><div>' + this.formatPrice(this.getDiscountPrice(this.discount)) + '</div></div>';
            }
            if (Object.keys(this.appliedVouchers).length) {
                html += '<div class="voucherLine"><div>' + this.translate('VOUCHERS_DISCOUNT') + '</div><div>' + this.formatPrice(this.getVouchersPrice()) + '</div></div>';
            }
            if (this.discount || Object.keys(this.appliedVouchers).length) {
                html += '<div class="priceTotal"><div>' + this.translate('PRICE_TOTAL_WITH_DISCOUNT') + '</div><div>' + this.formatPrice(this.getTotalPrice()) + '</div></div>';
            }

            document.querySelector('.priceLine').parentElement.insertAdjacentHTML('beforeend', html);
            document.getElementById('priceSubtotal').innerHTML = this.formatPrice(this.getSubTotal());
        }
    }, {
        key: 'sortPackages',
        value: function sortPackages(packages) {
            // Packages from the API are sorted by internal name, not by display name
            // However, display name is not required so fallback to internal name
            return packages.sort(function (a, b) {
                var aName = a.weergavenaam || a.arrangement;
                var bName = b.weergavenaam || b.arrangement;
                if (aName < bName) {
                    return -1;
                }
                if (aName > bName) {
                    return -1;
                }
                return 0;
            });
        }
    }, {
        key: 'shouldShowBookingSize',
        value: function shouldShowBookingSize(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            }).length > 0;
        }
    }, {
        key: 'showBookButton',
        value: function showBookButton() {
            var html = '<div><button type="submit" id="bookPackage" disabled>' + this.translate('BUTTON_BOOK_NOW') + '</button></div>';
            this.appendHtml(html);
            document.getElementById('bookPackage').addEventListener('click', this.submitBooking.bind(this));
        }
    }, {
        key: 'showDiscountFields',
        value: function showDiscountFields() {
            var _this16 = this;

            [].concat(_toConsumableArray(document.querySelectorAll('.recras-discountcode, .recras-vouchers'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '\n            <div class="recras-discountcode">\n                <label for="discountcode">' + this.translate('DISCOUNT_CODE') + '</label>\n                <input type="text" id="discountcode" maxlength="50">\n                <button>' + this.translate('DISCOUNT_CHECK') + '</button>\n            </div>\n            <div class="recras-vouchers">\n                <div>\n                    <label for="voucher">' + this.translate('VOUCHER') + '</label>\n                    <input type="text" class="voucher" maxlength="50">\n                    <button>' + this.translate('VOUCHER_APPLY') + '</button>\n                </div>\n            </div>\n        ';
            document.querySelector('.recras-contactform').insertAdjacentHTML('beforebegin', html);

            document.querySelector('.recras-discountcode > button').addEventListener('click', function () {
                _this16.checkDiscountcode(_this16.selectedPackage.id, document.getElementById('recras-onlinebooking-date').value, document.getElementById('discountcode').value);
            });
            document.querySelector('.recras-vouchers button').addEventListener('click', function (e) {
                _this16.applyVoucher(_this16.selectedPackage.id, e.srcElement.parentElement.querySelector('input').value.trim());
            });
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(pack) {
            var _this17 = this;

            this.getContactFormFields(pack).then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this17.getCountryList(_this17.locale));
                }
                Promise.all(waitFor).then(function () {
                    var html = '<form class="recras-contactform">';
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this17.showContactFormField(field, idx) + '</div>';
                    });
                    html += '</form>';
                    _this17.appendHtml(html);
                    _this17.showBookButton();

                    [].concat(_toConsumableArray(document.querySelectorAll('[id^="contactformulier-"]'))).forEach(function (el) {
                        el.addEventListener('change', _this17.maybeDisableBookButton.bind(_this17));
                    });
                });
            });
        }
    }, {
        key: 'showContactFormField',
        value: function showContactFormField(field, idx) {
            var _this18 = this;

            if (field.soort_invoer === 'header') {
                return '<h3>' + field.naam + '</h3>';
            }

            var label = this.showContactFormLabel(field, idx);
            var attrRequired = field.verplicht ? 'required' : '';
            var html = void 0;
            var fixedAttributes = 'id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' data-identifier="' + field.field_identifier + '"';
            switch (field.soort_invoer) {
                case 'contactpersoon.geslacht':
                    html = '<select ' + fixedAttributes + ' autocomplete="sex">';
                    Object.keys(this.GENDERS).forEach(function (key) {
                        html += '<option value="' + key + '">' + _this18.translate(_this18.GENDERS[key]);
                    });
                    html += '</select>';
                    return label + html;
                case 'keuze':
                    html = '<select ' + fixedAttributes + ' multiple>';
                    field.mogelijke_keuzes.forEach(function (choice) {
                        html += '<option value="' + choice + '">' + choice;
                    });
                    html += '</select>';
                    return label + html;
                case 'veel_tekst':
                    return label + ('<textarea ' + fixedAttributes + '></textarea>');
                case 'contactpersoon.telefoon1':
                    return label + ('<input type="tel" ' + fixedAttributes + ' autocomplete="tel">');
                case 'contactpersoon.email1':
                    return label + ('<input type="email" ' + fixedAttributes + ' autocomplete="email">');
                case 'contactpersoon.nieuwsbrieven':
                    html = '<select ' + fixedAttributes + ' multiple>';
                    Object.keys(field.newsletter_options).forEach(function (key) {
                        html += '<option value="' + key + '">' + field.newsletter_options[key];
                    });
                    html += '</select>';
                    return label + html;
                case 'contact.landcode':
                    html = '<select ' + fixedAttributes + '>';
                    Object.keys(this.countries).forEach(function (code) {
                        html += '<option value="' + code + '">' + _this18.countries[code];
                    });
                    html += '</select>';
                    return label + html;
                default:
                    var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                    return label + ('<input type="text" ' + fixedAttributes + ' autocomplete="' + autocomplete + '">');
            }
        }
    }, {
        key: 'showContactFormLabel',
        value: function showContactFormLabel(field, idx) {
            var labelText = field.naam;
            if (field.verplicht) {
                labelText += '<span title="' + this.translate('ATTR_REQUIRED') + '">*</span>';
            }
            return '<label for="contactformulier-' + idx + '">' + labelText + '</label>';
        }
    }, {
        key: 'showDateTimeSelection',
        value: function showDateTimeSelection(pack) {
            var _this19 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            return this.getAvailableDays(pack.id, startDate, endDate).then(function (availableDays) {
                var today = RecrasDateHelper.datePartOnly(new Date());
                var html = '<div class="recras-datetime">';
                html += '<label for="recras-onlinebooking-date">' + _this19.translate('DATE') + '</label><input type="text" id="recras-onlinebooking-date" min="' + today + '" disabled>';
                html += '<label for="recras-onlinebooking-time">' + _this19.translate('TIME') + '</label><select id="recras-onlinebooking-time" disabled></select>';
                html += '</div>';
                _this19.appendHtml(html);

                _this19.datePicker = new Pikaday({
                    disableDayFn: function disableDayFn(day) {
                        var dateFmt = RecrasDateHelper.datePartOnly(day);
                        return _this19.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: document.getElementById('recras-onlinebooking-date'),
                    firstDay: 1, // Monday
                    format: 'yyyy-MM-dd', //Only used when Moment is loaded?
                    /*i18n: {}*/ //TODO: i18n
                    minDate: new Date(),
                    numberOfMonths: 2,
                    onDraw: function onDraw() {
                        //TODO: callback function for when the picker draws a new month
                    },
                    onSelect: function onSelect(date) {
                        _this19.selectedDate = date;
                        _this19.getAvailableTimes(pack.id, date).then(function (times) {
                            times = times.map(function (time) {
                                return RecrasDateHelper.timePartOnly(new Date(time));
                            });
                            _this19.showTimes(times);
                        });
                        _this19.showDiscountFields();
                    },
                    toString: function toString(date) {
                        return RecrasDateHelper.datePartOnly(date);
                    }
                });

                document.getElementById('recras-onlinebooking-time').addEventListener('change', function () {
                    _this19.selectedTime = document.getElementById('recras-onlinebooking-time').value;
                    _this19.previewTimes();
                });
            });
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this20 = this;

            packages = packages.filter(function (p) {
                return p.mag_online;
            });
            var packagesSorted = this.sortPackages(packages);
            var options = packagesSorted.map(function (pack) {
                return '<option value="' + pack.id + '">' + (pack.weergavenaam || pack.arrangement);
            });

            var html = '<select id="recras-package-selection"><option>' + options.join('') + '</select>';
            this.setHtml('<div class="recras-package-select"><p>TODO: tekst pre</p>' + html + '<p>TODO: tekst post</p></div>');

            var packageSelectEl = document.getElementById('recras-package-selection');
            packageSelectEl.addEventListener('change', function () {
                var selectedPackageId = parseInt(packageSelectEl.value, 10);
                _this20.changePackage(selectedPackageId);
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this21 = this;

            var html = '<div class="recras-amountsform">';

            if (this.shouldShowBookingSize(pack)) {
                html += '<div><div><label for="bookingsize">' + (pack.weergavenaam || pack.arrangement) + '</label></div><input type="number" id="bookingsize" min="0"></div>';
            }

            var linesNoBookingSize = this.getLinesNoBookingSize(pack);
            linesNoBookingSize.forEach(function (line, idx) {
                html += '<div><div>';
                html += '<label for="packageline' + idx + '">' + line.beschrijving_templated + '</label>';
                var maxAttr = line.max ? 'max="' + line.max + '"' : '';
                html += '</div><input id="packageline' + idx + '" type="number" min="0" ' + maxAttr + ' data-package-id="' + line.id + '">';
                html += '<div class="recras-price">' + _this21.formatPrice(line.product.verkoop) + '</div>';
                html += '</div>';
            });
            html += '<div class="priceLine"><div>' + this.translate('PRICE_TOTAL') + '</div><div id="priceSubtotal"></div>';
            html += '</div>';
            this.appendHtml(html);

            [].concat(_toConsumableArray(document.querySelectorAll('[id^="packageline"], #bookingsize'))).forEach(function (el) {
                el.addEventListener('input', _this21.updateProductAmounts.bind(_this21));
            });
        }
    }, {
        key: 'showTimes',
        value: function showTimes(times) {
            var html = '<option>';
            times.forEach(function (time) {
                html += '<option value="' + time + '">' + time;
            });
            document.getElementById('recras-onlinebooking-time').innerHTML = html;
            document.getElementById('recras-onlinebooking-time').removeAttribute('disabled');
        }
    }, {
        key: 'clearTimes',
        value: function clearTimes() {
            document.getElementById('recras-onlinebooking-time').innerHTML = '';
            document.getElementById('recras-onlinebooking-time').setAttribute('disabled', 'disabled');
        }
    }, {
        key: 'submitBooking',
        value: function submitBooking() {
            var bookingStart = this.selectedDate;
            bookingStart = RecrasDateHelper.setTimeForDate(bookingStart, this.selectedTime);

            var productCounts = this.productCounts().map(function (line) {
                return line.aantal;
            });
            var productSum = productCounts.reduce(function (a, b) {
                return a + b;
            }, 0);
            if (this.bookingSize() === 0 && productSum === 0) {
                alert(this.translate('NO_PRODUCTS'));
                return false;
            }

            document.getElementById('bookPackage').setAttribute('disabled', 'disabled');
            console.log(this.selectedDate, this.selectedTime, document.getElementById('recras-onlinebooking-date').value);

            var vouchers = Object.keys(this.appliedVouchers).length > 0 ? Object.keys(this.appliedVouchers) : null;
            var bookingParams = {
                arrangement_id: this.selectedPackage.id,
                begin: bookingStart,
                betaalmethode: 'mollie',
                contactformulier: this.generateContactForm(),
                kortingscode: this.discount && this.discount.code || null,
                producten: this.productCounts(),
                status: null,
                stuur_bevestiging_email: true,
                vouchers: vouchers
            };
            if (this.shouldShowBookingSize(this.selectedPackage)) {
                bookingParams.boekingsgrootte = this.bookingSize();
            }

            return this.postJson(this.apiBase + 'onlineboeking/reserveer', bookingParams).then(function (json) {
                console.log('reserveer', json);
                document.getElementById('bookPackage').removeAttribute('disabled');

                if (typeof json.boeking_id !== 'undefined') {
                    //TODO
                } else {
                    if (json.payment_url) {
                        window.location.href = json.payment_url;
                    }
                }
            });
        }
    }, {
        key: 'translate',
        value: function translate(string) {
            var vars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var translated = this.i18n[this.locale] && this.i18n[this.locale][string] ? this.i18n[this.locale][string] : this.i18n['en_GB'][string];
            if (Object.keys(vars).length > 0) {
                Object.keys(vars).forEach(function (key) {
                    translated = translated.replace('{' + key + '}', vars[key]);
                });
            }
            return translated;
        }
    }, {
        key: 'updateProductAmounts',
        value: function updateProductAmounts() {
            var _this22 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            this.getAvailableDays(this.selectedPackage.id, startDate, endDate).then(function (availableDays) {
                var datePickerEl = document.getElementById('recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    _this22.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

            this.checkDependencies();
            this.checkMinimumAmounts();
            this.showTotalPrice();
        }
    }, {
        key: 'validateOptions',
        value: function validateOptions(options) {
            var hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');

            if (!options.element) {
                throw new Error(this.translate('ERR_NO_ELEMENT'));
            }
            if (options.element instanceof Element === false) {
                throw new Error(this.translate('ERR_INVALID_ELEMENT'));
            }

            if (!options.recras_hostname) {
                throw new Error(this.translate('ERR_NO_HOSTNAME'));
            }
            if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== '172.16.0.2') {
                throw new Error(this.translate('ERR_INVALID_HOSTNAME'));
            }
        }
    }]);

    return RecrasBooking;
}();"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RecrasDateHelper = function () {
    function RecrasDateHelper() {
        _classCallCheck(this, RecrasDateHelper);
    }

    _createClass(RecrasDateHelper, null, [{
        key: "datePartOnly",
        value: function datePartOnly(date) {
            var x = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000); // Fix off-by-1 errors
            return x.toISOString().substr(0, 10); // Format as 2018-03-13
        }
    }, {
        key: "setTimeForDate",
        value: function setTimeForDate(date, timeStr) {
            date.setHours(timeStr.substr(0, 2), timeStr.substr(3, 2));
            return date;
        }
    }, {
        key: "timePartOnly",
        value: function timePartOnly(date) {
            return date.toTimeString().substr(0, 5); // Format at 09:00
        }
    }]);

    return RecrasDateHelper;
}();'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RecrasLocaleHelper = function () {
    function RecrasLocaleHelper() {
        _classCallCheck(this, RecrasLocaleHelper);
    }

    _createClass(RecrasLocaleHelper, [{
        key: 'isValid',
        value: function isValid(locale) {
            return this.validLocales.indexOf(locale) > -1;
        }
    }]);

    return RecrasLocaleHelper;
}();

RecrasLocaleHelper.defaultLocale = 'nl_NL';
RecrasLocaleHelper.validLocales = ['de_DE', 'en_GB', 'nl_NL'];"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/****************************
 *  Recras voucher library  *
 *  v 0.0.1                 *
 ***************************/

var RecrasVoucher = function RecrasVoucher() {
  _classCallCheck(this, RecrasVoucher);
};