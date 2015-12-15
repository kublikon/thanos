app.factory('utils', function($rootScope, $http, $location, service){
	return (function(){
		Array.prototype.safeForEach = function(cb){
			if(this instanceof Array){
				if(this.length > 0){
					this.forEach(function(item, index){
						return cb(item, index);
					});
				} else {
					console.error('empty array');
				}
			} else {
				console.error('not an array');
			}
		};

		Array.prototype.toDateFormat = function(cb){
			var date = new Date(this);

			return date.toLocaleDateString("en-US");
		};

	})();
});