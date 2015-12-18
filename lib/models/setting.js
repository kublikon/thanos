/*
-- Model for settings
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('setting', {
		setting_id: { type: Number, default: 1 },
		company_name: String,
		support_email: String,
		aws_account_id: String,
		aws_access_key_id: String,
		aws_secret_access_key: String,
		aws_region: String,
		aws_logging: { type: Boolean, default: false },
		aws_s3_domain: String,
		github_username: String,
		github_password: String,
		profile_s: String,
		profile_m: String,
		profile_l: String,
		created_at: Date
	});

	model.schema.pre('update', function(cb){
		var self = this; 

		function accessKey(){
			security.encrypt(this.aws_access_key_id, function(err, key){
				if(err){
					cb(err);
				} else {
					self.aws_access_key_id = key;
					secretKey();
				}
			});
		};

		function secretKey(){
			security.encrypt(this.aws_secret_access_key, function(err, key){
				if(err){
					cb(err);
				} else {
					self.aws_secret_access_key = key;
					cb();
				}
			});
		};

		security.encrypt(this.aws_account_id, function(err, key){
			if(err){
				cb(err);
			} else {
				self.aws_account_id = key;
				accessKey();
			}
		});
	});



	module.exports = model;

})();