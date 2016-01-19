/*
-- Service for settings:
-- get settings, create or update settings
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		helper = require('../utils/helper'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'bundles service started');

		// get setting
		app.get('/api/settings', function(req, res){

			log('d', 'get settings');

			security.auth(req, res, db, 'developer', function(){

		    	var res_data = {};
					
				db.setting.findOne({ setting_id: 1 })
				.exec(function(err, data){
					if(err){
						res.end(check.error('Unable to get settings', 'settings', 107));
					} else {
						res_data.settings = data;

						res.end(check.validate(res_data, 'settings'));
					}
				});
			});
	    });

		// create or update
	    app.post('/api/settings', function(req, res){

	    	log('d', 'create or update settings');

	    	security.auth(req, res, db, 'developer', function(){

		    	if(!check.input(req, res, db, 'settings', [])){
		    		return false;
		    	}

		    	var file_id = uuid.v1();

		    	// save images to s3
			    function uploadProfile(profile, size, cb){
			    	var path = 'company/' + file_id + '_' + size + '.' + profile.extension;

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

			    function updateSettings(profile_s, profile_m, profile_l){
			    	var update = {
			    		setting_id: 1,
			    		company_name: req.body.company_name,
						support_email: req.body.support_email,
						aws_account_id: req.body.aws_account_id,
						aws_access_key_id: req.body.aws_access_key_id,
						aws_secret_access_key: req.body.aws_secret_access_key,
						aws_region: req.body.aws_region,
						aws_logging: req.body.aws_logging,
						aws_s3_domain: req.body.aws_s3_domain,
						github_username: req.body.github_username,
						github_password: req.body.github_password,
						created_at: new Date()
			    	}

			    	if(req.body.profile_s){
		    			update.profile_s = config.aws_s3_domain + '/' + profile_s;
		    			update.profile_m = config.aws_s3_domain + '/' + profile_m;
		    			update.profile_l = config.aws_s3_domain + '/' + profile_l;
		    		} else {
		    			update.profile_s = config.default_profile_s;
						update.profile_m = config.default_profile_m;
						update.profile_l = config.default_profile_l;
		    		}

			    	db.setting.findOneAndUpdate({ setting_id: 1 }, update, { upsert: true, new: true }, function(err, data){
						if(err){
							res.end(check.error('Unable to save settings', 'settings', 101));
						} else {
							res.end(check.validate(data, 'settings'));
						}
			    	});
			    };

		    	if(req.body.profile_s){
			    	uploadProfile(req.body.profile_s, 's', function(profile_s){
						uploadProfile(req.body.profile_m, 'm', function(profile_m){
							uploadProfile(req.body.profile_l, 'l', function(profile_l){
								updateSettings(profile_s, profile_m, profile_l);
							});
						});
					});
			    } else {
			    	updateSettings();
			    }
			});
	    });

	};

})();