/*
-- Model for auth
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('auth', {
		username: String,
		password: String,
		is_active: { type: Boolean, default: false },
		account_type: { type: String, enum: ['admin', 'developer', 'support'] },
		created_at: Date
	});

	model.schema.pre('save', function(cb){
		var self = this; 

		security.encrypt(this.password, function(err, key){
			if(err){
				cb(err);
			} else {
				self.password = key;
				cb();
			}
		});
	});

	module.exports = model;

})();