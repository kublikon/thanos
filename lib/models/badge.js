/*
-- Model for badge
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('badge', {
		name: String, 
		thumbnail: String,
		created_at: Date
	});

	module.exports = model;

})();