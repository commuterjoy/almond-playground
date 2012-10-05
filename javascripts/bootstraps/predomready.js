define([
        'common',
        'modules/detect',
    ],
    function (
        common,
        detect
        ) {

        var modules = {
        };

    var bootstrap = function (config, userPrefs) {
        console.log('i am preDomReady bootstrap')
    };

    return {
        go: bootstrap 
    };

});
