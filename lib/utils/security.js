/*
-- encrypt -
-- validate - 
-- validateTrusted - 
-- auth - all request user auth validation
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		crypto = require('crypto'),
		check = require('./check');

	module.exports = {
		encrypt: function(input, cb){
			crypto.pbkdf2(input, config.salt, 1000, 512, 'sha512', function(err, key){
				if(err){
					cb({ message: 'Security failed', type: 'security', code: 401});
				} else { 
					cb(undefined, key);
				}
			});
		},
		validate: function(pw, input, cb){
			crypto.pbkdf2(input, config.salt, 1000, 512, 'sha512', function(err, key){
				if(err){
					cb({ message: 'Security failed', type: 'security', code: 402});
				} else {
					if(pw === key.toString()){
						cb();
					} else {
						cb({ message: 'Wrong', type: 'security', code: 403 });
					}
				}
			});
		},
		validateTrusted: function(req, res, db, cb){
			if(!req.query.client_id){
				res.end(check.error('Missing client_id', 'auth', 404));
			} else {
				db.app.findOne({ client_id: req.query.client_id, is_trusted: true }, function(err, data){
					if(err){ 
						res.end(check.error('Access denied', 'auth', 405));
						return false;
					} else if(!data){
						res.end(check.error('Access denied', 'auth', 406));
						return false;
					} else {
						return cb();
					}
				});
			}
		},
		auth: function(req, res, db, type, cb){
			var self = this,
				auth = '';

			if(req.body.access_token){
				auth = req.body.access_token;
			} else if(req.query.access_token){
				auth = req.query.access_token;
			} else { 
				res.end(check.error('Access denied', 'auth', 403));
				return false;
			}

			db.session.findOne({ access_token: auth })
			.populate({ path: 'user',  model: 'user', populate: { path: 'auth', model: 'auth' }})
			.exec(function(err, data){
				if(err){ 
					res.end(check.error('Access denied', 'auth', 402));
					return false;
				} else if(!data){
					res.end(check.error('Access denied', 'auth', 403));
					return false;
				} else {
					if(type == 'all'){
						//TODO: date/expiration validation

						return cb();
					} else if(data.user.auth.account_type == 'admin'){
						//TODO: date/expiration validation

						return cb();
					} else if(data.user.auth.account_type == 'developer' && (type == 'support' || type == 'developer')){
						//TODO: date/expiration validation

						return cb();
					} else if(data.user.auth.account_type == 'support' && type == 'support'){
						//TODO: date/expiration validation

						return cb();
					} else {
						res.end(check.error('Access denied - invalid account type', 'auth', 405));

						return false;
					}
				}
			});
		}
	};

})();