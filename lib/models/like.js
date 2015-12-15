/*
-- Model for like
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('like', {
		user: { type: schema.Types.ObjectId, ref: 'user' },
		object_id: { type: schema.Types.ObjectId }, 
		date: Date
	});

	module.exports = model;

})();