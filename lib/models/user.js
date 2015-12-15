/*
-- Model for user
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('user', { 
		auth: { type: schema.Types.ObjectId, ref: 'auth' },
		first_name: String, 
		last_name: String,
		full_name: String,
		username_public: { type: String, unique: true },
		email: { type: String, unique: true },
		birthday: Date,
		gender: String,
		city: String,
		state: String,
		profile_s: String,
		profile_m: String,
		profile_l: String,
		badges: [{ type: schema.Types.ObjectId, ref: 'badge' }],
		created_at: Date
	});

	module.exports = model;

})();