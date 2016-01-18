window.app.directive("readfile", [function () {
    return {
        // restrict: 'E',
        scope: {
            readfile: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();

                // console.log('scope.readfile', scope.readfile);

                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.readfile = { data: loadEvent.target.result, name: changeEvent.target.files[0].name, size: changeEvent.target.files[0].size, extension: changeEvent.target.files[0].name.split('.').pop() };
                    
                        // console.log('scope.readfile', scope.readfile);
                        // var baseImg = $('#' + image)[0],
                        //     res = {},
                        //     canvas, context;
                         
                        // canvas = document.createElement('canvas');
                        // canvas.width = 100;
                        // canvas.height = 100;
                        // context = canvas.getContext('2d');
                        // context.drawImage(loadEvent.target.result, 0, 0, size, size);

                        // scope.readfile.data = canvas.toDataURL();
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    }
}]);