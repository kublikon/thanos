/*
-- Model for session
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('session', {
		user: { type: schema.Types.ObjectId, ref: 'user', required: true },
		access_token: { type: String },
		code: { type: String },
		client_id: { type: String, ref: 'app' },
		is_internal: { type: Boolean, default: false },
		created_at: Date,
		expires_at: Date
	});

	module.exports = model;

})();