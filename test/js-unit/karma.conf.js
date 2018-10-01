module.exports = function(config) {
    config.set({
        basePath: '../..',
        browsers: [
            'ChromeHeadless',
            //'FirefoxHeadless',
        ],
        files: [
            // Helpers first
            'src/*Helper.js',
            // Then the other classes
            'src/booking.js',
            'src/contactForm.js',
            'src/options.js',
            'src/vouchers.js',
            'test/js-unit/*Spec.js'
        ],
        frameworks: ['jasmine'],
        plugins: [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-spec-reporter',
        ],
        reporters: ['spec'],
        singleRun: true
    });
};
