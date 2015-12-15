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
		company_name: String,
		support_email: String,
		aws_account_id: String,
		aws_access_key_id: String,
		aws_region: String,
		profile_s: String,
		profile_m: String,
		profile_l: String,
		created_at: Date
	});

	module.exports = model;

})();