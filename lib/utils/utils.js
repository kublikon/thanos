/*
-- Utils
*/

(function(){

	var log = require('../console');

	module.exports = (function(){
		Array.prototype.safeForEach = function(cb){
			if(this instanceof Array){
				if(this.length > 0){
					this.forEach(function(item, index){
						return cb(item, index);
					});
				} else {
					log('w', 'empty array');
				}
			} else {
				log('w', 'not an array');
			}
		};
	})();

})();