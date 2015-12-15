/*
-- Service for generating and maintaining session
-- code - generates temp oauth code
-- token - generates permanent oauth token
-- internal - 
*/

(function(){

	var log = require('../console'),
		db = require('../database'),
		check = require('./check'),
		uuid = require('node-uuid');

	module.exports = {
		code: function(res, user, client_id, cb){
			db.session.findOne({ user: user, client_id: client_id }, function(err, data){
				if(err){
					res.end(check.error('Session failed', 'session', 501));
				} else if(!data) {
					var session = new db.session({
			    		user: user,
						access_token: uuid.v4(),
						code: uuid.v4(),
						client_id: client_id,
						created_at: new Date(),
						expires_at: new Date()
			    	});

			    	session.save(function(err, data){
			    		if(err){
			    			res.end(check.error('Session failed', 'session', 502));
			    		} else {
			    			return cb(data.code);
			    		}
			    	});
				} else {
					data.access_token = uuid.v4();
					data.code = uuid.v4();
					data.created_at = new Date();
					data.expires_at = new Date();

					data.save(function(err, update_data){
						if(err){
							res.end(check.error('Session failed', 'session', 503));
						} else {
							return cb(data.code);
						}
					});
				}
			});
		},
		token: function(res, user, client_id, cb){
			db.session.findOne({ user: user, client_id: client_id }, function(err, data){
				if(err){
					res.end(check.error('Session failed', 'session', 504));
				} else if(!data){
					var session = new db.session({
			    		user: user,
						access_token: uuid.v4(),
						code: uuid.v4(),
						client_id: client_id,
						created_at: new Date(),
						expires_at: new Date()
			    	});

			    	session.save(function(err, data){
			    		if(err){
			    			res.end(check.error('Session failed', 'session', 505));
			    		} else {
			    			return cb(data.access_token);
			    		}
			    	});
				} else {
					data.access_token = uuid.v4();
					data.code = uuid.v4();
					data.created_at = new Date();
					data.expires_at = new Date();

					data.save(function(err, update_data){
						if(err){
							res.end(check.error('Session failed', 'session', 506));
						} else {
							return cb(data.access_token);
						}
					});
				}
			});
		},
		token_internal: function(res, user, cb){
			db.session.findOne({ user: user, is_internal: true }, function(err, data){
				if(err){
					res.end(check.error('Session failed', 'session', 507));
				} else if(!data) {
					var session = new db.session({
			    		user: user,
						access_token: uuid.v4(),
						code: uuid.v4(),
						is_internal: true,
						created_at: new Date(),
						expires_at: new Date()
			    	});

			    	session.save(function(err, data){
			    		if(err){
			    			res.end(check.error('Session failed', 'session', 508));
			    		} else {
			    			return cb(data.access_token);
			    		}
			    	});
				} else {
					data.access_token = uuid.v4();
					data.code = uuid.v4();
					data.created_at = new Date();
					data.expires_at = new Date();

					data.save(function(err, update_data){
						if(err){
							res.end(check.error('Session failed', 'session', 509));
						} else {
							return cb(data.access_token);
						}
					});
				}
			});
		},
		exchange: function(){

		},
		validate: function(){

		},
		revoke: function(res, access_token){
			db.session.remove({ access_token: access_token }, function(err){
				if(err){
					res.end(check.error('Session end failed', 'session', 509));
				} else {
					res.end(check.log('Session ended', 'session'));
				}
			});
		}
	};

})();