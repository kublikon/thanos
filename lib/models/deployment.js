/*
-- Model for deployment
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('deployment', {
		deployment_id: { type: String, default: 'not assigned' },
		deployment_group: String,
		deployment_group_id: String,
		branch: { type: String, default: '' },
		tag_version: String,
		tag_message: { type: String, default: '' },
		description: String,
		comments: [{ type: schema.Types.ObjectId, ref: 'comment' }],
		is_started: { type: Boolean, default: false },
		is_deployed: { type: Boolean, default: false },
		is_stopped: { type: Boolean, default: false },
		created_at: Date
	});

	module.exports = model;

})();