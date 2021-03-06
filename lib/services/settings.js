/*
-- Service for settings:
-- get settings, create or update settings
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		aws = require('aws-sdk'),
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

			security.auth(req, res, db, 'admin', function(){

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

	    	security.auth(req, res, db, 'admin', function(){

		    	if(!check.input(req, res, db, 'settings', [])){
		    		return false;
		    	}

		    	var file_id = uuid.v1();

		    	// save images to s3
			    function uploadProfile(profile, size, cb){
			    	var path = 'company/' + file_id + '_' + size + '.' + profile.extension;

				    try {
			            app.s3.putObject({
			                Bucket: config.settings.aws_bucket,
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
						aws_bucket: req.body.aws_bucket,
						aws_region: req.body.aws_region,
						aws_logging: req.body.aws_logging,
						aws_s3_domain: 'https://' + req.body.aws_bucket + '.s3.amazonaws.com',
						github_username: req.body.github_username,
						github_password: req.body.github_password,

						// default preferences
						device_name: req.body.device_name,
						snapshot_id: req.body.snapshot_id,
						volume_type: req.body.volume_type,
						min_size: req.body.min_size,
						max_size: req.body.max_size,
						desired_capacity: req.body.desired_capacity,

						created_at: new Date()
			    	}

			    	aws.config.update({ 
			            "accessKeyId": req.body.aws_access_key_id,
			            "secretAccessKey": req.body.aws_secret_access_key,
			            "region": req.body.aws_region,
			            "apiVersions": { "s3": '2006-03-01' }
			        });

			        config.settings = update;

			        app.s3 = new aws.S3();
		            app.iam = new aws.IAM({apiVersion: '2010-05-08'}),
		            app.ec2 = new aws.EC2({apiVersion: '2015-10-01', region: 'us-east-1'}),
		            app.codeDeploy = new aws.CodeDeploy({apiVersion: '2014-10-06', region: 'us-east-1'}),
		            app.autoScaling = new aws.AutoScaling({apiVersion: '2011-01-01', region: 'us-east-1'}),
		            app.elb = new aws.ELB({apiVersion: '2012-06-01', region: 'us-east-1'});

			    	if(req.body.profile_s){
		    			update.profile_s = config.settings.aws_s3_domain + '/' + profile_s;
		    			update.profile_m = config.settings.aws_s3_domain + '/' + profile_m;
		    			update.profile_l = config.settings.aws_s3_domain + '/' + profile_l;
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