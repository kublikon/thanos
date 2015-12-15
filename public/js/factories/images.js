app.factory('image', function($rootScope, $location, $http, service, storage){
	return {
		convertImage: function(image, file, size){
			var baseImg = $('#' + image)[0],
				res = {},
			    canvas, context;
			 
			canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			context = canvas.getContext('2d');
			context.drawImage(baseImg, 0, 0, size, size);

			res.data = canvas.toDataURL();
			res.name = file.name;
			res.extension = file.extension;
			 
			return res;
		}
	};
});