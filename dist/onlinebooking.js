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
*  v 0.3.0                        *
**********************************/

var RecrasBooking = function () {
    function RecrasBooking() {
        var _this = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasBooking);

        this.datePicker = null;

        var CSS = '\n@import url(\'https://cdn.rawgit.com/dbushell/Pikaday/eddaaa3b/css/pikaday.css\');\n\n.recras-onlinebooking > *:not(.latestError) {\n    padding: 1em 0;\n}\n.recras-onlinebooking > *:not(:first-child) + * {\n    border-top: 2px solid #dedede; /* Any love for Kirby out there? */\n}\n.recras-contactform > div, .recras-amountsform > div {\n    align-items: start;\n    display: flex;\n    justify-content: space-between;\n    padding: 0.25em 0;\n}\n.time-preview, .minimum-amount {\n    padding-left: 0.5em;\n} \n.minimum-amount {\n    color: hsl(0, 50%, 50%);\n}\n';
        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;
        this.languageHelper.setCurrency(options);

        this.element = this.options.getElement();
        this.element.classList.add('recras-onlinebooking');

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this.options.getApiBase() + url, data, _this.error);
        };

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', ')
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        this.loadCSS(CSS);
        this.clearAll();

        this.getPackages().then(function (packages) {
            if (_this.options.getPackageId()) {
                //TODO: wait for setCurrency
                _this.changePackage(_this.options.getPackageId());
            } else {
                _this.showPackages(packages);
            }
        });
    }

    _createClass(RecrasBooking, [{
        key: 'amountsValid',
        value: function amountsValid(pack) {
            var _this2 = this;

            var hasAtLeastOneProduct = false;
            this.getLinesNoBookingSize(pack).forEach(function (line) {
                var aantal = _this2.findElement('[data-package-id="' + line.id + '"]').value;
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
            var _this3 = this;

            var statusEl = this.findElement('.voucher-status');
            if (statusEl) {
                statusEl.innerHTML = '';
            } else {
                this.element.querySelector('.recras-vouchers').insertAdjacentHTML('beforeend', '<span class="voucher-status"></span>');
                statusEl = this.findElement('.voucher-status');
            }

            if (!voucherCode) {
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_EMPTY');
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_EMPTY');
                return false;
            }
            if (this.appliedVouchers[voucherCode]) {
                statusEl.innerHTML = this.languageHelper.translate('VOUCHER_ALREADY_APPLIED');
                return false;
            }
            var date = this.findElement('.recras-onlinebooking-date').value;
            if (isNaN(Date.parse(date))) {
                statusEl.innerHTML = this.languageHelper.translate('DATE_INVALID');
                return false;
            }

            this.postJson('onlineboeking/controleervoucher', {
                arrangement_id: packageID,
                datum: RecrasDateHelper.datePartOnly(new Date(date)),
                producten: this.productCounts(),
                vouchers: [voucherCode]
            }).then(function (json) {
                var result = json[voucherCode];
                if (!result.valid) {
                    statusEl.innerHTML = _this3.languageHelper.translate('VOUCHER_INVALID');
                    return false;
                }

                _this3.appliedVouchers[voucherCode] = result.processed;
                _this3.showTotalPrice();

                statusEl.innerHTML = _this3.languageHelper.translate('VOUCHER_APPLIED');
            });
        }
    }, {
        key: 'bookingSize',
        value: function bookingSize() {
            var bookingSizeEl = this.findElement('.bookingsize');
            if (!bookingSizeEl) {
                return 0;
            }
            return bookingSizeEl.value;
        }
    }, {
        key: 'changePackage',
        value: function changePackage(packageID) {
            var _this4 = this;

            var selectedPackage = this.packages.filter(function (p) {
                return p.id === packageID;
            });

            this.appliedVouchers = {};
            this.discount = null;

            if (selectedPackage.length === 0) {
                // Reset form
                this.selectedPackage = null;
                this.clearAll();
                this.showPackages(this.packages);
                return false;
            } else {
                this.clearAllExceptPackageSelection();
            }
            this.selectedPackage = selectedPackage[0];
            this.showProducts(this.selectedPackage);
            this.checkDependencies();
            this.showDateTimeSelection(this.selectedPackage).then(function () {
                _this4.showContactForm(_this4.selectedPackage);
            });
        }
    }, {
        key: 'checkDependencies',
        value: function checkDependencies() {
            var _this5 = this;

            [].concat(_toConsumableArray(this.findElements('.recras-product-dependency'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.requiresProduct = false;

            this.productCounts().forEach(function (line) {
                if (line.aantal > 0) {
                    var packageLineID = line.arrangementsregel_id;
                    var product = _this5.findProduct(packageLineID).product;
                    product.vereist_product.forEach(function (vp) {
                        if (!_this5.dependencySatisfied(line.aantal, vp)) {
                            _this5.requiresProduct = true;
                            var requiredAmount = _this5.requiredAmount(line.aantal, vp);
                            var requiredProductName = _this5.getProductByID(vp.vereist_product_id).weergavenaam;
                            var message = _this5.languageHelper.translate('PRODUCT_REQUIRED', {
                                NUM: line.aantal,
                                PRODUCT: product.weergavenaam,
                                REQUIRED_AMOUNT: requiredAmount,
                                REQUIRED_PRODUCT: requiredProductName
                            });
                            _this5.findElement('.recras-amountsform').insertAdjacentHTML('beforeend', '<span class="recras-product-dependency">' + message + '</span>');
                        }
                    });
                }
            });

            this.maybeDisableBookButton();
        }
    }, {
        key: 'checkDiscountcode',
        value: function checkDiscountcode(packageID, date, code) {
            var _this6 = this;

            var statusEl = this.findElement('.discount-status');
            if (statusEl) {
                statusEl.parentNode.removeChild(statusEl);
            }
            return this.fetchJson(this.options.getApiBase() + 'onlineboeking/controleerkortingscode?datum=' + date + '&arrangement=' + packageID + '&kortingscode=' + code).then(function (discount) {
                if (discount === false) {
                    _this6.findElement('.recras-discountcode').insertAdjacentHTML('beforeend', '<span class="discount-status">' + _this6.languageHelper.translate('DISCOUNT_INVALID') + '</span>');
                    return;
                }
                discount.code = code;
                _this6.discount = discount;

                _this6.showTotalPrice();
            });
        }
    }, {
        key: 'checkMinimumAmounts',
        value: function checkMinimumAmounts() {
            var _this7 = this;

            [].concat(_toConsumableArray(this.findElements('.minimum-amount'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var selectedProducts = this.productCounts();
            selectedProducts.forEach(function (p) {
                if (p.aantal > 0) {
                    var packageLineID = p.arrangementsregel_id;

                    var packageLine = _this7.findProduct(packageLineID);
                    if (p.aantal < packageLine.aantal_personen) {
                        var input = _this7.findElement('[data-package-id="' + packageLineID + '"]');
                        var label = _this7.findElement('label[for="' + input.id + '"]');

                        var warnEl = document.createElement('span');
                        warnEl.classList.add('minimum-amount');
                        warnEl.innerHTML = _this7.languageHelper.translate('PRODUCT_MINIMUM', {
                            MINIMUM: packageLine.aantal_personen
                        });
                        label.parentNode.appendChild(warnEl);
                    }
                }
            });
        }
    }, {
        key: 'clearAll',
        value: function clearAll() {
            this.clearElements(this.element.children);
        }
    }, {
        key: 'clearAllExceptPackageSelection',
        value: function clearAllExceptPackageSelection() {
            var elements = document.querySelectorAll('#' + this.element.id + ' > *:not(.recras-package-select)');
            this.clearElements(elements);
        }
    }, {
        key: 'clearElements',
        value: function clearElements(elements) {
            if (this.datePicker) {
                this.datePicker.destroy();
            }
            [].concat(_toConsumableArray(elements)).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.appendHtml('<div class="latestError"></div>');
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
            this.findElement('.latestError').innerHTML = '<strong>{ this.languageHelper.translate(\'ERR_GENERAL\') }</strong><p>' + msg + '</p>';
        }
    }, {
        key: 'findElement',
        value: function findElement(querystring) {
            return this.element.querySelector(querystring);
        }
    }, {
        key: 'findElements',
        value: function findElements(querystring) {
            return this.element.querySelectorAll(querystring);
        }
    }, {
        key: 'findProduct',
        value: function findProduct(packageLineID) {
            return this.selectedPackage.regels.filter(function (line) {
                return line.id === packageLineID;
            })[0];
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return this.languageHelper.formatPrice(price);
        }
    }, {
        key: 'getAvailableDays',
        value: function getAvailableDays(packageID, begin, end) {
            var _this8 = this;

            return this.postJson('onlineboeking/beschikbaredagen', {
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

            return this.postJson('onlineboeking/beschikbaretijden', {
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

            var contactForm = new RecrasContactForm(this.options);
            return contactForm.fromPackage(pack).then(function (formFields) {
                _this10.contactForm = contactForm;
                return formFields;
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
        key: 'getLinesBookingSize',
        value: function getLinesBookingSize(pack) {
            return pack.regels.filter(function (line) {
                return line.onlineboeking_aantalbepalingsmethode === 'boekingsgrootte';
            });
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
            var _this11 = this;

            return this.fetchJson(this.options.getApiBase() + 'arrangementen').then(function (json) {
                _this11.packages = json;
                return _this11.packages;
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
            var _this12 = this;

            var total = 0;
            this.productCounts().forEach(function (line) {
                var product = _this12.findProduct(line.arrangementsregel_id).product;
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
            var button = this.findElement('.bookPackage');
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
            if (!this.findElement('.recras-onlinebooking-date').value) {
                shouldDisable = true;
            }
            if (!this.findElement('.recras-onlinebooking-time').value) {
                shouldDisable = true;
            }
            if (!this.findElement('.recras-contactform').checkValidity()) {
                shouldDisable = true;
            }

            if (shouldDisable) {
                button.setAttribute('disabled', 'disabled');
            } else {
                button.removeAttribute('disabled');
            }
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
            var _this13 = this;

            [].concat(_toConsumableArray(this.findElements('.time-preview'))).forEach(function (el) {
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
                    var normalisedStart = _this13.normaliseDate(new Date(line.begin), packageStart, bookingStart);
                    var normalisedEnd = _this13.normaliseDate(new Date(line.eind), packageStart, bookingStart);
                    _this13.findElement('label[for="packageline' + idx + '"]').insertAdjacentHTML('beforeend', '<span class="time-preview">(' + RecrasDateHelper.timePartOnly(normalisedStart) + ' \u2013 ' + RecrasDateHelper.timePartOnly(normalisedEnd) + ')</span>');
                });
            }
        }
    }, {
        key: 'productCounts',
        value: function productCounts() {
            var _this14 = this;

            var counts = [];
            [].concat(_toConsumableArray(this.findElements('[id^="packageline"]'))).forEach(function (line) {
                counts.push({
                    aantal: isNaN(parseInt(line.value)) ? 0 : parseInt(line.value),
                    arrangementsregel_id: parseInt(line.dataset.packageId, 10)
                });
            });
            this.getLinesBookingSize(this.selectedPackage).forEach(function (line) {
                counts.push({
                    aantal: _this14.bookingSize(),
                    arrangementsregel_id: line.id
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
        key: 'setHtml',
        value: function setHtml(msg) {
            this.element.innerHTML = msg;
        }
    }, {
        key: 'showTotalPrice',
        value: function showTotalPrice() {
            [].concat(_toConsumableArray(this.findElements('.discountLine, .voucherLine, .priceTotal'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '';

            if (this.discount) {
                html += '<div class="discountLine"><div>' + this.discount.naam + '</div><div>' + this.formatPrice(this.getDiscountPrice(this.discount)) + '</div></div>';
            }
            if (Object.keys(this.appliedVouchers).length) {
                html += '<div class="voucherLine"><div>' + this.languageHelper.translate('VOUCHERS_DISCOUNT') + '</div><div>' + this.formatPrice(this.getVouchersPrice()) + '</div></div>';
            }
            if (this.discount || Object.keys(this.appliedVouchers).length) {
                html += '<div class="priceTotal"><div>' + this.languageHelper.translate('PRICE_TOTAL_WITH_DISCOUNT') + '</div><div>' + this.formatPrice(this.getTotalPrice()) + '</div></div>';
            }

            this.findElement('.priceLine').parentElement.insertAdjacentHTML('beforeend', html);
            this.findElement('.priceSubtotal').innerHTML = this.formatPrice(this.getSubTotal());
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
            var html = '<div><button type="submit" class="bookPackage" disabled>' + this.languageHelper.translate('BUTTON_BOOK_NOW') + '</button></div>';
            this.appendHtml(html);
            this.findElement('.bookPackage').addEventListener('click', this.submitBooking.bind(this));
        }
    }, {
        key: 'showDiscountFields',
        value: function showDiscountFields() {
            var _this15 = this;

            [].concat(_toConsumableArray(this.findElements('.recras-discountcode, .recras-vouchers'))).forEach(function (el) {
                el.parentNode.removeChild(el);
            });

            var html = '\n            <div class="recras-discountcode">\n                <label for="discountcode">' + this.languageHelper.translate('DISCOUNT_CODE') + '</label>\n                <input type="text" id="discountcode" class="discountcode" maxlength="50">\n                <button>' + this.languageHelper.translate('DISCOUNT_CHECK') + '</button>\n            </div>\n            <div class="recras-vouchers">\n                <div>\n                    <label for="voucher">' + this.languageHelper.translate('VOUCHER') + '</label>\n                    <input type="text" class="voucher" maxlength="50">\n                    <button>' + this.languageHelper.translate('VOUCHER_APPLY') + '</button>\n                </div>\n            </div>\n        ';
            this.findElement('.recras-contactform').insertAdjacentHTML('beforebegin', html);

            this.findElement('.recras-discountcode > button').addEventListener('click', function () {
                _this15.checkDiscountcode(_this15.selectedPackage.id, _this15.findElement('.recras-onlinebooking-date').value, _this15.findElement('.discountcode').value);
            });
            this.findElement('.recras-vouchers button').addEventListener('click', function (e) {
                _this15.applyVoucher(_this15.selectedPackage.id, e.srcElement.parentElement.querySelector('input').value.trim());
            });
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(pack) {
            var _this16 = this;

            this.getContactFormFields(pack).then(function (fields) {
                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this16.contactForm.getCountryList());
                }
                Promise.all(waitFor).then(function () {
                    var html = '<form class="recras-contactform">';
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this16.contactForm.showField(field, idx) + '</div>';
                    });
                    html += '</form>';
                    _this16.appendHtml(html);
                    _this16.showBookButton();

                    [].concat(_toConsumableArray(_this16.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                        el.addEventListener('change', _this16.maybeDisableBookButton.bind(_this16));
                    });
                });
            });
        }
    }, {
        key: 'showDateTimeSelection',
        value: function showDateTimeSelection(pack) {
            var _this17 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            return this.getAvailableDays(pack.id, startDate, endDate).then(function () {
                var today = RecrasDateHelper.datePartOnly(new Date());
                var html = '<div class="recras-datetime">';
                html += '<label for="recras-onlinebooking-date">' + _this17.languageHelper.translate('DATE') + '</label><input type="text" id="recras-onlinebooking-date" class="recras-onlinebooking-date" min="' + today + '" disabled>';
                html += '<label for="recras-onlinebooking-time">' + _this17.languageHelper.translate('TIME') + '</label><select id="recras-onlinebooking-time" class="recras-onlinebooking-time" disabled></select>';
                html += '</div>';
                _this17.appendHtml(html);

                _this17.datePicker = new Pikaday({
                    disableDayFn: function disableDayFn(day) {
                        var dateFmt = RecrasDateHelper.datePartOnly(day);
                        return _this17.availableDays.indexOf(dateFmt) === -1;
                    },
                    field: _this17.findElement('.recras-onlinebooking-date'),
                    firstDay: 1, // Monday
                    format: 'yyyy-MM-dd', //Only used when Moment is loaded?
                    /*i18n: {}*/ //TODO: i18n
                    minDate: new Date(),
                    numberOfMonths: 2,
                    onDraw: function onDraw() {
                        //TODO: callback function for when the picker draws a new month
                    },
                    onSelect: function onSelect(date) {
                        _this17.selectedDate = date;
                        _this17.getAvailableTimes(pack.id, date).then(function (times) {
                            times = times.map(function (time) {
                                return RecrasDateHelper.timePartOnly(new Date(time));
                            });
                            _this17.showTimes(times);
                        });
                        _this17.showDiscountFields();
                    },
                    toString: function toString(date) {
                        return RecrasDateHelper.datePartOnly(date);
                    }
                });

                _this17.findElement('.recras-onlinebooking-time').addEventListener('change', function () {
                    _this17.selectedTime = _this17.findElement('.recras-onlinebooking-time').value;
                    _this17.previewTimes();
                });
            });
        }
    }, {
        key: 'showPackages',
        value: function showPackages(packages) {
            var _this18 = this;

            packages = packages.filter(function (p) {
                return p.mag_online;
            });
            var packagesSorted = this.sortPackages(packages);
            var packageOptions = packagesSorted.map(function (pack) {
                return '<option value="' + pack.id + '">' + (pack.weergavenaam || pack.arrangement);
            });

            var html = '<select class="recras-package-selection"><option>' + packageOptions.join('') + '</select>';
            this.appendHtml('<div class="recras-package-select"><p>TODO: tekst pre</p>' + html + '<p>TODO: tekst post</p></div>');

            var packageSelectEl = this.findElement('.recras-package-selection');
            packageSelectEl.addEventListener('change', function () {
                var selectedPackageId = parseInt(packageSelectEl.value, 10);
                _this18.changePackage(selectedPackageId);
            });
        }
    }, {
        key: 'showProducts',
        value: function showProducts(pack) {
            var _this19 = this;

            var html = '<div class="recras-amountsform">';

            if (this.shouldShowBookingSize(pack)) {
                html += '<div><div><label for="bookingsize">' + (pack.weergavenaam || pack.arrangement) + '</label></div><input type="number" id="bookingsize" class="bookingsize" min="0"></div>';
            }

            var linesNoBookingSize = this.getLinesNoBookingSize(pack);
            linesNoBookingSize.forEach(function (line, idx) {
                html += '<div><div>';
                html += '<label for="packageline' + idx + '">' + line.beschrijving_templated + '</label>';
                var maxAttr = line.max ? 'max="' + line.max + '"' : '';
                html += '</div><input id="packageline' + idx + '" type="number" min="0" ' + maxAttr + ' data-package-id="' + line.id + '">';
                html += '<div class="recras-price">' + _this19.formatPrice(line.product.verkoop) + '</div>';
                html += '</div>';
            });
            html += '<div class="priceLine"><div>' + this.languageHelper.translate('PRICE_TOTAL') + '</div><div class="priceSubtotal"></div>';
            html += '</div>';
            this.appendHtml(html);

            [].concat(_toConsumableArray(this.findElements('[id^="packageline"], .bookingsize'))).forEach(function (el) {
                el.addEventListener('input', _this19.updateProductAmounts.bind(_this19));
            });
        }
    }, {
        key: 'showTimes',
        value: function showTimes(times) {
            console.log('showTimes', times);
            var html = '<option>';
            times.forEach(function (time) {
                html += '<option value="' + time + '">' + time;
            });
            this.findElement('.recras-onlinebooking-time').innerHTML = html;
            this.findElement('.recras-onlinebooking-time').removeAttribute('disabled');
        }
    }, {
        key: 'clearTimes',
        value: function clearTimes() {
            this.findElement('.recras-onlinebooking-time').innerHTML = '';
            this.findElement('.recras-onlinebooking-time').setAttribute('disabled', 'disabled');
        }
    }, {
        key: 'submitBooking',
        value: function submitBooking() {
            var _this20 = this;

            var bookingStart = this.selectedDate;
            bookingStart = RecrasDateHelper.setTimeForDate(bookingStart, this.selectedTime);

            var productCounts = this.productCounts().map(function (line) {
                return line.aantal;
            });
            var productSum = productCounts.reduce(function (a, b) {
                return a + b;
            }, 0);
            if (this.bookingSize() === 0 && productSum === 0) {
                window.alert(this.languageHelper.translate('NO_PRODUCTS'));
                return false;
            }

            this.findElement('.bookPackage').setAttribute('disabled', 'disabled');
            //console.log(this.selectedDate, this.selectedTime, this.findElement('.recras-onlinebooking-date').value);

            var vouchers = Object.keys(this.appliedVouchers).length > 0 ? Object.keys(this.appliedVouchers) : null;
            var bookingParams = {
                arrangement_id: this.selectedPackage.id,
                begin: bookingStart,
                betaalmethode: 'mollie',
                contactformulier: this.contactForm.generateJson(),
                kortingscode: this.discount && this.discount.code || null,
                producten: this.productCounts(),
                status: null,
                stuur_bevestiging_email: true,
                vouchers: vouchers
            };
            if (this.shouldShowBookingSize(this.selectedPackage)) {
                bookingParams.boekingsgrootte = this.bookingSize();
            }
            if (this.options.getRedirectUrl()) {
                bookingParams.redirect_url = this.options.getRedirectUrl();
            }

            return this.postJson('onlineboeking/reserveer', bookingParams).then(function (json) {
                _this20.findElement('.bookPackage').removeAttribute('disabled');

                if (json.payment_url) {
                    window.location.href = json.payment_url;
                } else {
                    console.log(json);
                }
            });
        }

        /*translate(string, vars = {}) {
            return this.languageHelper.translate(string, vars);
        }*/

    }, {
        key: 'updateProductAmounts',
        value: function updateProductAmounts() {
            var _this21 = this;

            var startDate = new Date();
            var endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            this.getAvailableDays(this.selectedPackage.id, startDate, endDate).then(function (availableDays) {
                var datePickerEl = _this21.findElement('.recras-onlinebooking-date');
                if (datePickerEl.value && availableDays.indexOf(datePickerEl.value) === -1) {
                    datePickerEl.value = '';
                    _this21.clearTimes();
                } else {
                    datePickerEl.removeAttribute('disabled');
                }
            });

            this.checkDependencies();
            this.checkMinimumAmounts();
            this.showTotalPrice();
        }
    }]);

    return RecrasBooking;
}();'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RecrasContactForm = function () {
    function RecrasContactForm() {
        var _this = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasContactForm);

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;
        this.languageHelper.setCurrency(options);
        if (RecrasLanguageHelper.isValid(this.options.getLocale())) {
            this.languageHelper.setLocale(this.options.getLocale());
        }

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this.error);
        };

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
    }

    _createClass(RecrasContactForm, [{
        key: 'error',
        value: function error(msg) {
            console.log('Error', msg); //TODO
        }
    }, {
        key: 'fromPackage',
        value: function fromPackage(pack) {
            return this.getContactFormFields(pack.onlineboeking_contactformulier_id);
        }
    }, {
        key: 'fromVoucherTemplate',
        value: function fromVoucherTemplate(template) {
            return this.getContactFormFields(template.contactform_id);
        }
    }, {
        key: 'generateJson',
        value: function generateJson() {
            var elements = this.options.getElement().querySelectorAll('[id^="contactformulier-"]');
            var contactForm = {};
            [].concat(_toConsumableArray(elements)).forEach(function (field) {
                contactForm[field.dataset.identifier] = field.value;
            });
            return contactForm;
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(formId) {
            var _this2 = this;

            return this.fetchJson(this.options.getApiBase() + 'contactformulieren/' + formId + '/velden').then(function (fields) {
                fields = fields.sort(function (a, b) {
                    return a.sort_order - b.sort_order;
                });

                _this2.contactFormFields = fields;
                return _this2.contactFormFields;
            });
        }
    }, {
        key: 'getCountryList',
        value: function getCountryList() {
            var _this3 = this;

            return this.fetchJson('https://cdn.rawgit.com/umpirsky/country-list/ddabf3a8/data/' + this.languageHelper.locale + '/country.json').then(function (json) {
                _this3.countries = json;
                return _this3.countries;
            });
        }
    }, {
        key: 'showField',
        value: function showField(field, idx) {
            var _this4 = this;

            if (field.soort_invoer === 'header') {
                return '<h3>' + field.naam + '</h3>';
            }

            var label = this.showLabel(field, idx);
            var attrRequired = field.verplicht ? 'required' : '';
            var html = void 0;
            var fixedAttributes = 'id="contactformulier-' + idx + '" name="contactformulier' + idx + '" ' + attrRequired + ' data-identifier="' + field.field_identifier + '"';
            switch (field.soort_invoer) {
                case 'contactpersoon.geslacht':
                    html = '<select ' + fixedAttributes + ' autocomplete="sex">';
                    Object.keys(this.GENDERS).forEach(function (key) {
                        html += '<option value="' + key + '">' + _this4.languageHelper.translate(_this4.GENDERS[key]);
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
                        var selectedText = code.toUpperCase() === _this4.languageHelper.getCountry() ? ' selected' : '';
                        html += '<option value="' + code + '"' + selectedText + '>' + _this4.countries[code];
                    });
                    html += '</select>';
                    return label + html;
                default:
                    var autocomplete = this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] ? this.AUTOCOMPLETE_OPTIONS[field.soort_invoer] : '';
                    return label + ('<input type="text" ' + fixedAttributes + ' autocomplete="' + autocomplete + '">');
            }
        }
    }, {
        key: 'showLabel',
        value: function showLabel(field, idx) {
            var labelText = field.naam;
            if (field.verplicht) {
                labelText += '<span class="recras-contactform-required" title="' + this.languageHelper.translate('ATTR_REQUIRED') + '"></span>';
            }
            return '<label for="contactformulier-' + idx + '">' + labelText + '</label>';
        }
    }]);

    return RecrasContactForm;
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

var RecrasHttpHelper = function () {
    function RecrasHttpHelper() {
        _classCallCheck(this, RecrasHttpHelper);
    }

    _createClass(RecrasHttpHelper, null, [{
        key: 'call',
        value: function call(url, data, errorHandler) {
            if (!url) {
                throw new Error('ERR_FETCH_WITHOUT_URL'); //TODO: translate
            }
            return fetch(url, data).then(function (response) {
                if (response.status < 200 || response.status >= 400) {
                    errorHandler(response.status + ' ' + response.statusText);
                    return false;
                }
                return response.json();
            }).then(function (json) {
                return json;
            }).catch(function (err) {
                errorHandler(err);
            });
        }
    }, {
        key: 'fetchJson',
        value: function fetchJson(url, errorHandler) {
            return this.call(url, {
                method: 'get'
            }, errorHandler);
        }
    }, {
        key: 'postJson',
        value: function postJson(url, data, errorHandler) {
            return this.call(url, {
                body: JSON.stringify(data),
                method: 'post'
            }, errorHandler);
        }
    }]);

    return RecrasHttpHelper;
}();'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RecrasLanguageHelper = function () {
    function RecrasLanguageHelper() {
        _classCallCheck(this, RecrasLanguageHelper);

        this.locale = this.defaultLocale;

        //TODO: what is the best way to handle multiple locales?
        this.i18n = {
            en_GB: {
                ATTR_REQUIRED: 'Required',
                BUTTON_BOOK_NOW: 'Book now',
                BUTTON_BUY_NOW: 'Buy now',
                DATE: 'Date',
                DATE_INVALID: 'Invalid date',
                DISCOUNT_CHECK: 'Check',
                DISCOUNT_CODE: 'Discount code',
                DISCOUNT_INVALID: 'Invalid discount code',
                ERR_GENERAL: 'Something went wrong:',
                ERR_INVALID_ELEMENT: 'Option "element" is not a valid Element',
                ERR_INVALID_HOSTNAME: 'Option "recras_hostname" is invalid.',
                ERR_INVALID_LOCALE: 'Invalid locale. Valid options are: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Invalid redirect URL. Make sure you it starts with http:// or https://',
                ERR_NO_ELEMENT: 'Option "element" not set.',
                ERR_NO_HOSTNAME: 'Option "recras_hostname" not set.',
                GENDER_UNKNOWN: 'Unknown',
                GENDER_MALE: 'Male',
                GENDER_FEMALE: 'Female',
                NO_PRODUCTS: 'No product selected',
                PRICE_TOTAL: 'Total',
                PRICE_TOTAL_WITH_DISCOUNT: 'Total including discount',
                PRODUCT_MINIMUM: '(must be at least {MINIMUM})',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} requires {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} to also be booked.',
                TIME: 'Time',
                VOUCHER: 'Voucher',
                VOUCHER_ALREADY_APPLIED: 'Voucher already applied',
                VOUCHER_APPLIED: 'Voucher applied',
                VOUCHER_APPLY: 'Apply',
                VOUCHERS_DISCOUNT: 'Discount from voucher(s)',
                VOUCHER_EMPTY: 'Empty voucher code',
                VOUCHER_INVALID: 'Invalid voucher code'
            },
            nl_NL: {
                ATTR_REQUIRED: 'Vereist',
                BUTTON_BOOK_NOW: 'Nu boeken',
                BUTTON_BUY_NOW: 'Nu kopen',
                DATE: 'Datum',
                DATE_INVALID: 'Ongeldige datum',
                DISCOUNT_CHECK: 'Controleren',
                DISCOUNT_CODE: 'Kortingscode',
                DISCOUNT_INVALID: 'Ongeldige kortingscode',
                ERR_GENERAL: 'Er ging iets mis:',
                ERR_INVALID_ELEMENT: 'Optie "element" is geen geldig Element',
                ERR_INVALID_HOSTNAME: 'Optie "recras_hostname" is ongeldig.',
                ERR_INVALID_LOCALE: 'Ongeldige locale. Geldige opties zijn: {LOCALES}',
                ERR_INVALID_REDIRECT_URL: 'Ongeldige redirect-URL. Zorg ervoor dat deze begint met http:// of https://',
                ERR_NO_ELEMENT: 'Optie "element" niet ingesteld.',
                ERR_NO_HOSTNAME: 'Optie "recras_hostname" niet ingesteld.',
                GENDER_UNKNOWN: 'Onbekend',
                GENDER_MALE: 'Man',
                GENDER_FEMALE: 'Vrouw',
                NO_PRODUCTS: 'Geen product gekozen',
                PRICE_TOTAL: 'Totaal',
                PRICE_TOTAL_WITH_DISCOUNT: 'Totaal inclusief korting',
                PRODUCT_MINIMUM: '(moet minstens {MINIMUM} zijn)',
                PRODUCT_REQUIRED: '{NUM} {PRODUCT} vereist dat ook {REQUIRED_AMOUNT} {REQUIRED_PRODUCT} geboekt wordt.',
                TIME: 'Tijd',
                VOUCHER: 'Tegoedbon',
                VOUCHER_ALREADY_APPLIED: 'Tegoedbon al toegepast',
                VOUCHER_APPLIED: 'Tegoedbon toegepast',
                VOUCHER_APPLY: 'Toepassen',
                VOUCHERS_DISCOUNT: 'Korting uit tegoedbon(nen)',
                VOUCHER_EMPTY: 'Lege tegoedbon',
                VOUCHER_INVALID: 'Ongeldige tegoedbon'
            }
        };
    }

    _createClass(RecrasLanguageHelper, [{
        key: 'error',
        value: function error(msg) {
            console.log('Error', msg); //TODO
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
        key: 'getCountry',
        value: function getCountry() {
            return this.locale.substr(3, 2); // nl_NL -> NL
        }
    }, {
        key: 'setCurrency',
        value: function setCurrency(options) {
            var _this = this;

            var errorHandler = function errorHandler(err) {
                _this.currency = 'eur';
                _this.error(err);
            };

            return RecrasHttpHelper.fetchJson(options.getApiBase() + 'instellingen/currency', errorHandler).then(function (setting) {
                _this.currency = setting.waarde;
            });
        }
    }, {
        key: 'setLocale',
        value: function setLocale(locale) {
            this.locale = locale;
        }
    }, {
        key: 'translate',
        value: function translate(string) {
            var vars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var translated = void 0;
            if (this.i18n[this.locale] && this.i18n[this.locale][string]) {
                translated = this.i18n[this.locale][string];
            } else if (this.i18n.en_GB[string]) {
                translated = this.i18n.en_GB[string];
            } else {
                translated = string;
                console.warn('String not translated: ' + string);
            }
            if (Object.keys(vars).length > 0) {
                Object.keys(vars).forEach(function (key) {
                    translated = translated.replace('{' + key + '}', vars[key]);
                });
            }
            return translated;
        }
    }], [{
        key: 'isValid',
        value: function isValid(locale) {
            return this.validLocales.indexOf(locale) > -1;
        }
    }]);

    return RecrasLanguageHelper;
}();

RecrasLanguageHelper.defaultLocale = 'nl_NL';
RecrasLanguageHelper.validLocales = ['de_DE', 'en_GB', 'nl_NL'];'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RecrasOptions = function () {
    function RecrasOptions(options) {
        _classCallCheck(this, RecrasOptions);

        this.languageHelper = new RecrasLanguageHelper();
        this.validate(options);
        this.options = this.setOptions(options);
    }

    _createClass(RecrasOptions, [{
        key: 'getApiBase',
        value: function getApiBase() {
            return this.options.apiBase;
        }
    }, {
        key: 'getElement',
        value: function getElement() {
            return this.options.element;
        }
    }, {
        key: 'getLocale',
        value: function getLocale() {
            return this.options.locale;
        }
    }, {
        key: 'getPackageId',
        value: function getPackageId() {
            return this.options.package_id;
        }
    }, {
        key: 'getRedirectUrl',
        value: function getRedirectUrl() {
            return this.options.redirect_url;
        }
    }, {
        key: 'setOptions',
        value: function setOptions(options) {
            options.apiBase = 'https://' + options.recras_hostname + '/api2/';
            if (options.recras_hostname === '172.16.0.2') {
                options.apiBase = options.apiBase.replace('https://', 'http://');
            }
            return options;
        }
    }, {
        key: 'validate',
        value: function validate(options) {
            var hostnameRegex = new RegExp(/^[a-z0-9\-]+\.recras\.nl$/, 'i');

            if (!options.element) {
                throw new Error(this.languageHelper.translate('ERR_NO_ELEMENT'));
            }
            if (options.element instanceof Element === false) {
                throw new Error(this.languageHelper.translate('ERR_INVALID_ELEMENT'));
            }

            if (!options.recras_hostname) {
                throw new Error(this.languageHelper.translate('ERR_NO_HOSTNAME'));
            }
            if (!hostnameRegex.test(options.recras_hostname) && options.recras_hostname !== RecrasOptions.hostnameDebug) {
                throw new Error(this.languageHelper.translate('ERR_INVALID_HOSTNAME'));
            }
            if (options.redirect_url) {
                if (options.redirect_url.indexOf('http://') === -1 && options.redirect_url.indexOf('https://') === -1) {
                    throw new Error(this.languageHelper.translate('ERR_INVALID_REDIRECT_URL'));
                }
            }
        }
    }]);

    return RecrasOptions;
}();

RecrasOptions.hostnameDebug = '172.16.0.2';'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/****************************
 *  Recras voucher library  *
 *  v 0.0.1                 *
 ***************************/

var RecrasVoucher = function () {
    function RecrasVoucher() {
        var _this = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, RecrasVoucher);

        this.languageHelper = new RecrasLanguageHelper();

        if (options instanceof RecrasOptions === false) {
            throw new Error(this.languageHelper.translate('ERR_OPTIONS_INVALID'));
        }
        this.options = options;

        this.element = this.options.getElement();
        this.element.classList.add('recras-buy-voucher');

        this.fetchJson = function (url) {
            return RecrasHttpHelper.fetchJson(url, _this.error);
        };
        this.postJson = function (url, data) {
            return RecrasHttpHelper.postJson(_this.options.getApiBase() + url, data, _this.error);
        };

        if (this.options.getLocale()) {
            if (!RecrasLanguageHelper.isValid(this.options.getLocale())) {
                console.warn(this.languageHelper.translate('ERR_INVALID_LOCALE', {
                    LOCALES: RecrasLanguageHelper.validLocales.join(', ')
                }));
            } else {
                this.languageHelper.setLocale(this.options.getLocale());
            }
        }

        this.languageHelper.setCurrency(options).then(function () {
            return _this.getVoucherTemplates();
        }).then(function (templates) {
            return _this.showTemplates(templates);
        });
    }

    _createClass(RecrasVoucher, [{
        key: 'appendHtml',
        value: function appendHtml(msg) {
            this.element.insertAdjacentHTML('beforeend', msg);
        }
    }, {
        key: 'buyTemplate',
        value: function buyTemplate() {
            var _this2 = this;

            this.findElement('.buyTemplate').setAttribute('disabled', 'disabled');

            var payload = {
                voucher_template_id: this.selectedTemplate.id,
                number_of_vouchers: 1, //TODO: add field to change this
                contact_form: this.contactForm.generateJson()
            };
            if (this.options.getRedirectUrl()) {
                payload.redirect_url = this.options.getRedirectUrl();
            }
            this.postJson('vouchers/buy', payload).then(function (json) {
                _this2.findElement('.buyTemplate').removeAttribute('disabled');

                if (json.payment_url) {
                    window.location.href = json.payment_url;
                } else {
                    console.log(result);
                }
            });
        }
    }, {
        key: 'clearAll',
        value: function clearAll() {
            [].concat(_toConsumableArray(this.element.children)).forEach(function (el) {
                el.parentNode.removeChild(el);
            });
            this.appendHtml('<div class="latestError"></div>');
        }
    }, {
        key: 'error',
        value: function error(msg) {
            this.findElement('.latestError').innerHTML = '<strong>{ this.languageHelper.translate(\'ERR_GENERAL\') }</strong><p>' + msg + '</p>';
        }
    }, {
        key: 'findElement',
        value: function findElement(querystring) {
            return this.element.querySelector(querystring);
        }
    }, {
        key: 'findElements',
        value: function findElements(querystring) {
            return this.element.querySelectorAll(querystring);
        }
    }, {
        key: 'formatPrice',
        value: function formatPrice(price) {
            return this.languageHelper.formatPrice(price);
        }
    }, {
        key: 'getContactFormFields',
        value: function getContactFormFields(template) {
            var _this3 = this;

            var contactForm = new RecrasContactForm(this.options);
            return contactForm.fromVoucherTemplate(template).then(function (formFields) {
                _this3.contactForm = contactForm;
                return formFields;
            });
        }
    }, {
        key: 'getVoucherTemplates',
        value: function getVoucherTemplates() {
            var _this4 = this;

            return this.fetchJson(this.options.getApiBase() + 'voucher_templates').then(function (templates) {
                _this4.templates = templates;
                return templates;
            });
        }
    }, {
        key: 'maybeDisableBuyButton',
        value: function maybeDisableBuyButton() {
            var button = this.findElement('.buyTemplate');
            if (!button) {
                return false;
            }

            var shouldDisable = false;
            if (!this.findElement('.recras-contactform').checkValidity()) {
                shouldDisable = true;
            }

            if (shouldDisable) {
                button.setAttribute('disabled', 'disabled');
            } else {
                button.removeAttribute('disabled');
            }
        }
    }, {
        key: 'showBuyButton',
        value: function showBuyButton() {
            var html = '<div><button type="submit" class="buyTemplate" disabled>' + this.languageHelper.translate('BUTTON_BUY_NOW') + '</button></div>';
            this.appendHtml(html);
            this.findElement('.buyTemplate').addEventListener('click', this.buyTemplate.bind(this));
        }
    }, {
        key: 'showContactForm',
        value: function showContactForm(templateId) {
            var _this5 = this;

            this.selectedTemplate = this.templates.filter(function (t) {
                return t.id === templateId;
            })[0];

            this.getContactFormFields(this.selectedTemplate).then(function (fields) {
                var waitFor = [];

                var hasCountryField = fields.filter(function (field) {
                    return field.field_identifier === 'contact.landcode';
                }).length > 0;

                if (hasCountryField) {
                    waitFor.push(_this5.contactForm.getCountryList());
                }
                Promise.all(waitFor).then(function () {
                    var html = '<form class="recras-contactform">';
                    fields.forEach(function (field, idx) {
                        html += '<div>' + _this5.contactForm.showField(field, idx) + '</div>';
                    });
                    html += '</form>';
                    _this5.appendHtml(html);
                    _this5.showBuyButton();

                    [].concat(_toConsumableArray(_this5.findElements('[id^="contactformulier-"]'))).forEach(function (el) {
                        el.addEventListener('change', _this5.maybeDisableBuyButton.bind(_this5));
                    });
                });
            });
        }
    }, {
        key: 'showTemplates',
        value: function showTemplates(templates) {
            var _this6 = this;

            var templateOptions = templates.map(function (template) {
                return '<option value="' + template.id + '">' + template.name + ' (' + _this6.formatPrice(template.price) + ')';
            });
            var html = '<select class="recrasVoucherTemplates"><option>' + templateOptions.join('') + '</select>';
            this.appendHtml('<div id="recras-voucher-templates">' + html + '</div>');

            var voucherSelectEl = this.findElement('.recrasVoucherTemplates');
            voucherSelectEl.addEventListener('change', function () {
                var selectedTemplateId = parseInt(voucherSelectEl.value, 10);
                _this6.showContactForm(selectedTemplateId);
            });
        }
    }]);

    return RecrasVoucher;
}();