module.exports = function(config) {
    config.set({
        basePath: '../..',
        browsers: [
            'ChromeHeadless',
            //'FirefoxHeadless',
        ],
        files: [
            'src/onlinebooking.js',
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
