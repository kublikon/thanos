/*
-- Service for auth:
-- login, !logout, !forgot-password, activate, deactivate
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session');

	module.exports = function(app){

		log('i', 'auth service started');

		// login
		app.get('/api/login', function(req, res){

			log('d', 'login');

			if(!check.input(req, res, db, 'auth', ['username', 'password'])){
	    		return false;
	    	}

	    	db.auth.findOne({ username: req.query.username })
	    	.exec(function(err, auth){
	    		if(err){
	    			res.end(check.error('Unable to get auth', 'auth', 101));
	    		} else if(!auth){
	    			res.end(check.error('Unable to get auth', 'auth', 101));
	    		} else if(auth.is_active == false){
	    			res.end(check.error('Unable to get auth', 'auth', 101));
	    		} else {
	    			security.validate(auth.password, req.query.password, function(err){
						if(err){
							res.end(check.error(err));
						} else {
							getUser(auth._id);
						}
					});	
	    		}
	    	});

	    	function getUser(auth_id){
				db.user.findOne({ auth: auth_id })
				.populate('friends')
				.exec(function(err, user){
					if(err){
						res.end(check.error('Unable to get auth', 'auth', 102));
					} else if(!user){
						res.end(check.error('Unable to get auth', 'auth', 103));
					} else {
						session.token(res, user._id, config.client_id, function(token){
							var data = { access_token: token, user: check.validate(user, 'auth', false) };
							
							res.end(check.validate(data, 'auth'));
						});
					}
				});
			};
	    });

		// logout
	    app.post('/api/logout', function(req, res){

	    	log('d', 'logout');

	    	security.auth(req, res, db, function(){
	    		session.revoke(res, req.body.access_token);
	    	});
	    });

	    // forgot password
	    app.post('/api/forgot-password', function(req, res){

	    	log('d', 'forgot password');

	    	if(!req.body.email){
	    		res.end('');
	    	}
	    });

	    // activate
	    app.post('/api/activate', function(req, res){

	    	log('d', 'activate');

	    	security.auth(req, res, db, function(){
	    		db.user.findOne({ _id: req.body.id })
	    		.exec(function(err, data){
	    			if(err){
	    				res.end(check.error('Unable to activate account', 'auth', 105));
	    			} else {
	    				db.auth.update({ _id: data.auth }, { $set: { is_active: true }}, { multi: false }, function(err){
				    		if(err){
				    			res.end(check.error('Unable to activate account', 'auth', 105));
				    		} else {
				    			res.end(check.log('updated', 'auth'));
				    		}
			    		});
	    			}
	    		});
		    });
	    });

	    // deactivate
	    app.post('/api/deactivate', function(req, res){

	    	log('d', 'deactivate');

	    	security.auth(req, res, db, function(){
	    		db.user.findOne({ _id: req.body.id })
	    		.exec(function(err, data){
	    			if(err){
	    				res.end(check.error('Unable to deactivate account', 'auth', 105));
	    			} else {
	    				db.auth.update({ _id: data.auth }, { $set: { is_active: false }}, { multi: false }, function(err){
				    		if(err){
				    			res.end(check.error('Unable to deactivate account', 'auth', 105));
				    		} else {
				    			res.end(check.log('updated', 'auth'));
				    		}
			    		});
	    			}
	    		});
		    });
	    });

	};

})();