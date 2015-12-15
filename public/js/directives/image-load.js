window.app.directive('imageload', function() {
    return {
        restrict: 'A',
        link: function(scope, image, attrs) {
            image.addClass('fx-fs');
            image.bind('load', function() {
                $(image).addClass('on');
            });
        }
    };
});