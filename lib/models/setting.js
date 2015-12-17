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
		profile_s: String,
		profile_m: String,
		profile_l: String,
		created_at: Date
	});

	module.exports = model;

})();