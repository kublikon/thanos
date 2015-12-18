/*
-- Deployment logic:
-- 
*/

(function(){

	var log = require('../console'),
		helper = require('../utils/helper');

	module.exports = {
		start: function(options, cb){
			return cb();
		},
		stop: function(options, cb){
			return cb();
		},
		status: function(options, cb){
			return cb();
		}
	};

})();