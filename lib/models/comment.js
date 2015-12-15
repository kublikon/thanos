/*
-- Model for comment
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('comment', {
		user: { type: schema.Types.ObjectId, ref: 'user' },
		object_id: { type: schema.Types.ObjectId },
		likes: [{ type: schema.Types.ObjectId, ref: 'like' }],
		text: String,
		created_at: Date
	});

	module.exports = model;

})();