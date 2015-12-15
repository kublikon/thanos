/*
-- Starting mongo service and combine models
*/

(function(){

	var log = require('./console'),
		mongoose = require('mongoose'),
		config = require('./config'),
		db = mongoose.connection,

		session = require('./models/session'),
		auth = require('./models/auth'),
		comment = require('./models/comment'),
		like = require('./models/like'),
		user = require('./models/user'),
		deployment = require('./models/deployment'),
		setting = require('./models/setting'),
		badge = require('./models/badge'),

		model = {};

	mongoose.connect(config.mongo_path);

	db.once('open', function(){
		log('i', 'mongo connection started');
	});

	db.on('error', function(){
		log('e', 'connection failed');
	});

	model = {
		session: session,
		auth: auth,
		comment: comment,
		like: like,
		user: user,
		deployment: deployment,
		setting: setting,
		badge: badge,
	}

	module.exports = model;

})();