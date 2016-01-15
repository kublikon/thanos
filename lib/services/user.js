/*
-- Service for user:
-- get users, get, create, !update
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		// helper = require('../utils/helper'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'user service started');

		// get users
		app.get('/api/users', function(req, res){

			log('d', 'get users');

			security.auth(req, res, db, function(){

				if(!check.input(req, res, db, 'users', ['skip', 'limit'])){
		    		return false;
		    	}

		    	var res_data = {};
					
				// helper.sort(req.query.filter, undefined, undefined, function(sort, query){
				db.user.find()
				// .sort(sort)
				.skip(Number(req.query.skip))
				.limit(Number(req.query.limit))
				.populate('auth', 'is_active')
				.exec(function(err, data){
					if(err){
						res.end(check.error('Unable to get users', 'users', 107));
					} else {
						res_data.users = data;

						res.end(check.validate(res_data, 'users'));
					}
				});
			});
	    });

		// get
		app.get('/api/user/:id', function(req, res){

			log('d', 'get user');

			security.auth(req, res, db, function(){

				var res_data = {};

				if(!req.params.id){
					res.end(check.error('Missing id', 'user', 230));
				} else {
					db.user.findOne({ _id: req.params.id }, function(err, data){
						if(err){
							res.end(check.error('Unable to get user', 'user', 231));
						} else {
							res_data.user = data;

							getCompany();
						}
					});
				}

				function getCompany(){
					db.setting.findOne(function(err, data){
						if(err){
							res.end(check.error('Unable to get user', 'user', 231));
						} else {
							res_data.company = data;

							res.end(check.validate(res_data, 'user'));
						}
					});
				};
			});
	    });

		// create
	    app.post('/api/user', function(req, res){

	    	log('d', 'create user');

	    	if(!check.input(req, res, db, 'user', ['first_name', 'last_name', 'email', 'password'])){
	    		return false;
	    	}

	    	var auth = new db.auth({
	    		username: req.body.email,
	    		password: req.body.password,
	    		created_at: new Date()
	    	});

	    	auth.save(function(err, data){
	    		if(err){
	    			res.end(check.error('Unable to save user', 'user', 232));
	    		} else {
	    			saveUser(data._id);
	    		}
	    	});

	    	function saveUser(auth_id){
		    	var profile_s = '',
		    		profile_m = '',
		    		profile_l = '';

		    	if (req.body.gender == 'male'){
		    		profile_s = config.default_profile_m_s;
					profile_m = config.default_profile_m_m;
					profile_l = config.default_profile_m_l;
		    	} else if (req.body.gender == 'female'){
		    		profile_s = config.default_profile_f_s;
					profile_m = config.default_profile_f_m;
					profile_l = config.default_profile_f_l;
		    	}
		    		
	    		var user = new db.user({
	    			auth: auth_id,
		    		first_name: req.body.first_name.toLowerCase(), 
		    		last_name: req.body.last_name.toLowerCase(),
		    		full_name: req.body.first_name.toLowerCase() + ' ' + req.body.last_name.toLowerCase(),
		    		username_public: req.body.first_name.toLowerCase() + '.' + req.body.last_name.toLowerCase(),
		    		email: req.body.email.toLowerCase(),
		    		gender: req.body.gender,
		    		profile_s: profile_s,
		    		profile_m: profile_m,
		    		profile_l: profile_l,
		    		created_at: new Date()
		    	});

				user.save(function(err, userData){
					if(err){
						res.end(check.error('Unable to save user', 'user', 232));
					} else {
						res.end(check.log('account requested', 'auth'));
					}
				});
			};
	    });

	    // update
	    app.post('/api/user/update', function(req, res){

	    	log('d', 'update user');

	    	security.auth(req, res, db, function(){
	    		
		    	var file_id = uuid.v1();

			    // save images to s3
			    function uploadProfile(profile, size, cb){
			    	var path = 'users/' + req.body.user._id + '/' + file_id + '_' + size + '.' + profile.extension;

				    try {
			            app.s3.putObject({
			                Bucket: config.aws_bucket,
			                Key: path,
			                Body: new Buffer(profile.data.slice(22), "base64"),
			                ContentType: 'image/' + profile.extension,
			                ACL: 'public-read'
			            }, function(err, data){
			                if(err){
			                    res.end(check.error(err, 'user', 235));
			                } else {
			                	return cb(path);
			                }
			            });
			        } catch (err) {
			            res.end(check.error(err, 'user', 236));
			        }
			    };

	            function updateUser(profile_s, profile_m, profile_l){
		    		var update = {
		    			first_name: req.body.user.first_name.toLowerCase(),
		    			last_name: req.body.user.last_name.toLowerCase(),
		    			full_name: req.body.user.first_name.toLowerCase() + ' ' + req.body.user.last_name.toLowerCase(),	
		    		}

		    		if(req.body.user.gender){
		    			update.gender = req.body.user.gender;
		    		}

		    		if(req.body.profile_s){
		    			update.profile_s = config.aws_s3_domain + '/' + profile_s;
		    			update.profile_m = config.aws_s3_domain + '/' + profile_m;
		    			update.profile_l = config.aws_s3_domain + '/' + profile_l;
		    		}

		    		db.user.update({ _id: req.body.user._id }, { $set: update }, { multi: false }, function(err){
			    		if(err){
			    			log('e', err);
			    			res.end(check.error('Unable to update user', 'user', 237));
			    		} else {
			    			if(req.body.profile_m){
			    				res.end(check.validate({ profile: config.aws_s3_domain + '/' + profile_m }, 'user'));
			    			} else {
			    				res.end(check.log('User updated', 'user'));	
			    			}
			    			
			    		}
		    		});
		    	};

		    	if(req.body.profile_s){
			    	uploadProfile(req.body.profile_s, 's', function(profile_s){
						uploadProfile(req.body.profile_m, 'm', function(profile_m){
							uploadProfile(req.body.profile_l, 'l', function(profile_l){
								updateUser(profile_s, profile_m, profile_l);
							});
						});
					});
			    } else {
			    	updateUser();
			    }
		    });
	    });

	};

})();