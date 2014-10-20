require.config({
    paths: {
        "lodash": "http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min",
        "mousetrap": "http://cdnjs.cloudflare.com/ajax/libs/mousetrap/1.4.6/mousetrap.min"
    },
    shim: {
        lodash: {
            exports: '_'
        },
        model: {
            deps: ["lodash"]
        }
    }
});

require(['lodash', 'mousetrap', 'model'], function () {
    window.requestAnimFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    var controller = new Controller();
});

