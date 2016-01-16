/*
-- Service for deployments:
-- get deployments, get deployment history, compare deployments, create, redeploy, stop deployment, remove deployment
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		helper = require('../utils/helper'),
		utils = require('../utils/utils'),
		deploy = require('../deployments/deploy'),
		uuid = require('node-uuid'),
		async = require('async');

	module.exports = function(app){

		log('i', 'bundles service started');

		// get deployments
		app.get('/api/deployments', function(req, res){

			log('d', 'get deployments');

			if(!check.input(req, res, db, 'deployment', ['skip', 'limit'])){
	    		return false;
	    	}

	    	var res_data = {};
				
			function getDeployment(cb){
				db.deployment.find({ is_current_deployment: true })
				.sort({ created_at: -1 })
				// .skip(req.query.skip)
				// .limit(req.query.limit)
				.exec(function(err, data){
					if(err){
						cb('Unable to get deployments');
					} else {
						var deployment_count = data.length;

						res_data.deployments = data;

						data.safeForEach(function(deployment, index){
							db.deployment.count({ deployment_internal_id: deployment.deployment_internal_id }, function(err, count){
								--deployment_count;

								res_data.deployments[index].deployment_count = count;

								if(deployment_count == 0){
									cb(undefined, data);
								}
							});
						});

						if(data.length == 0){
							cb(undefined, data);
						}
					}
				});
			};

			function getIAMRoles(cb){
				deploy.getIAMRoles({}, function(err, data){
					if(err){
						cb('Unable to get deployments');
					} else {
						res_data.roles = data;

						cb(undefined, data);
					}
				});
			};

			function getAMIs(cb){
				deploy.getAMIs({}, function(err, data){
					if(err){
						cb('Unable to get deployments');
					} else {
						res_data.AMIs = data;

						cb(undefined, data);
					}
				});
			};

			function getGroups(cb){
				deploy.getGroups({}, function(err, data){
					if(err){
						cb('Unable to get deployments');
					} else {
						res_data.groups = data;

						cb(undefined, data);
					}
				});
			};

			function listApplications(cb){
				deploy.listApplications({}, function(err, data){
					if(err){
						cb('Unable to get deployments');
					} else {
						res_data.applications = data;

						cb(undefined, data);
					}
				});
			};

			async.parallel([
				getDeployment,
				getIAMRoles,
				getAMIs,
				getGroups,
				listApplications
			], function(err, data){
				if(err){
					res.end(check.error(err, 'deployments', 107));
				} else {
					res.end(check.validate(res_data, 'deployments'));
				}
			});
	    });

	    // get deployment history
		app.get('/api/deployment/:id', function(req, res){

			log('d', 'get deployment history');

			if(!check.input(req, res, db, 'deployment', [])){
	    		return false;
	    	}

	    	var res_data = {};
				
			db.deployment.find({ deployment_internal_id: req.params.id })
			.sort({ created_at: -1 })
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get deployment history', 'deployment', 107));
				} else {
					res_data.deployments = data;
					res_data.deployment_count = data.length;

					res.end(check.validate(res_data, 'deployment'));
				}
			});
	    });

	    // get compare
		app.get('/api/deployments/compare', function(req, res){

			log('d', 'get deployment compare');

			if(!check.input(req, res, db, 'deployment', ['compare_1', 'compare_2'])){
	    		return false;
	    	}

	    	var res_data = {};

	    	function getCompareOne(cb){
	    		if(req.query.compare_1 != ''){
					deploy.getAll(req.query.compare_1, function(err, data){
						if(err){
							cb(err);
						} else {
							res_data.compare_1 = data;

							cb(undefined, data);
						}
					});
				} else {
					res.end(check.error('Compare 1 is empty', 'deployments', 107));
				} 
			};

			function getCompareTwo(cb){
				if(req.query.compare_2 != ''){
					deploy.getAll(req.query.compare_2, function(err, data){
						if(err){
							cb(err);
						} else {
							res_data.compare_2 = data;

							cb(undefined, data);
						}
					});
				} else {
					res.end(check.error('Compare 2 is empty', 'deployments', 107));
				} 
			};

			async.parallel([
				getCompareOne,
				getCompareTwo
			], function(err, data){
				if(err){
					if(err.match('DeploymentDoesNotExistException')){
						res.end(check.error(err, 'deployments', 100));
			  		} else {
			  			res.end(check.error(err, 'deployments', 107));
			  		}
				} else {
					res.end(check.validate(res_data, 'deployments'));
				}
			});
	    });

		// create
	    app.post('/api/deployment', function(req, res){

	    	log('d', 'create deployment');

	    	security.auth(req, res, db, function(){

		    	if(!check.input(req, res, db, 'deployment', ['deployment_group'])){
		    		return false;
		    	}

		    	deploy.start(req.body, function(err, data){
					if(err){
						saveDeployment(err);
					} else {
						saveDeployment(undefined, data);
					}
				});

				function saveDeployment(error, data){

			    	db.deployment.update({ deployment_internal_id: req.body.application_name + '-' + req.body.deployment_group, is_current_deployment: true }, { $set: { is_current_deployment: false }}, { multi: false }, function(err){
			    		if(err){
			    			res.end(check.error('Unable to save deployment record', 'deployment', 101));
			    		} else {
			    			save();
			    		}
		    		});

		    		function save(){

			    		var deployment = new db.deployment({
			    			deployment_internal_id: req.body.application_name + '-' + req.body.deployment_group,
			    			application_name: req.body.application_name,
				    		deployment_group: req.body.deployment_group,
				    		group: req.body.group,
				    		role: req.body.role,
				    		arn: req.body.arn,
				    		AMI: req.body.AMI,
				    		instance_type: req.body.instance_type,
				    		node_modules: req.body.node_modules,
				    		revision_type: req.body.revision_type,
				    		github_project_commit_id: req.body.github_project_commit_id,
							github_project_path: req.body.github_project_path,
							s3_project_bucket: req.body.s3_project_bucket,
							s3_project_key: req.body.s3_project_key,
							s3_project_bundle_type: req.body.s3_project_bundle_type,
				    		description: req.body.description,
				    		is_started: ((error) ? false : true),
				    		is_stopped: ((error) ? true : false),
				    		is_current_deployment: true,
				    		status_description: ((error) ? error : data),
				    		created_at: new Date()
				    	});

						deployment.save(function(err, res_data){
							if(err){
								res.end(check.error('Unable to save deployment record', 'deployment', 101));
							} else {
								res.end(check.validate(res_data, 'deployment'));
							}
						});
					};
				};
			});
	    });

		// redeploy
		app.post('/api/deployment/redeploy', function(req, res){

	    	log('d', 'redeploy deployment');

	    	security.auth(req, res, db, function(){

		    	if(!check.input(req, res, db, 'deployment', ['deployment_group'])){
		    		return false;
		    	}

		    	deploy.redeploy(req.body, function(err, data){
					if(err){
						saveDeployment(err);
					} else {
						saveDeployment(undefined, data);
					}
				});

				function saveDeployment(error, data){

			    	db.deployment.update({ deployment_internal_id: req.body.application_name + '-' + req.body.deployment_group, is_current_deployment: true }, { $set: { is_current_deployment: false }}, { multi: false }, function(err){
			    		if(err){
			    			res.end(check.error('Unable to redeploy deployment', 'deployment', 101));
			    		} else {
			    			save();
			    		}
		    		});

		    		function save(){

			    		var deployment = new db.deployment({
			    			deployment_internal_id: req.body.application_name + '-' + req.body.deployment_group,
			    			application_name: req.body.application_name,
				    		deployment_group: req.body.deployment_group,
				    		group: req.body.group,
				    		role: req.body.role,
				    		arn: req.body.arn,
				    		AMI: req.body.AMI,
				    		instance_type: req.body.instance_type,
				    		node_modules: req.body.node_modules,
				    		revision_type: req.body.revision_type,
				    		github_project_commit_id: req.body.github_project_commit_id,
							github_project_path: req.body.github_project_path,
							s3_project_bucket: req.body.s3_project_bucket,
							s3_project_key: req.body.s3_project_key,
							s3_project_bundle_type: req.body.s3_project_bundle_type,
				    		description: req.body.description,
				    		is_started: ((error) ? false : true),
				    		is_stopped: ((error) ? true : false),
				    		is_current_deployment: true,
				    		status_description: ((error) ? error : data),
				    		created_at: new Date()
				    	});

						deployment.save(function(err, res_data){
							if(err){
								res.end(check.error('Unable to redeploy deployment', 'deployment', 101));
							} else {
								res.end(check.validate(res_data, 'deployment'));
							}
						});
					};
				};
			});
	    });

		// stop deployment
	    app.post('/api/deployment/stop', function(req, res){

	    	log('d', 'stop deployment');

	    	security.auth(req, res, db, function(){
	    		deploy.stop(req.body, function(err, data){
	    			if(err){
	    				res.end(check.error(err, 'deployment', 107));
	    			} else {
		    			var update = {
		    				is_started: false,
		    				is_stopped: true,
		    				status_description: data
		    			};

		    			db.deployment.update({ _id: req.body.id }, { $set: update }, { multi: false }, function(err, data){
		    				if(err){
								res.end(check.error('Unable to stop deployment', 'deployment', 107));
							} else {
								res.end(check.validate(data, 'deployment'));
							}
		    			});
		    		}
	    		});
	    	});
	    });

	    // stop deployment
	    app.post('/api/deployment/remove', function(req, res){

	    	log('d', 'remove deployment');

	    	security.auth(req, res, db, function(){
	    		deploy.remove(req.body, function(err, data){
	    			if(err){
	    				res.end(check.error(err, 'deployment', 107));
	    			} else {
		    			db.deployment.remove({ deployment_internal_id: req.body.deployment_internal_id })
		    			.exec(function(){
		    				if(err){
								res.end(check.error('Unable to remove deployment', 'deployment', 107));
							} else {
								res.end(check.log('removed', 'deployment'));
							}
		    			});
		    		}
	    		});
	    	});
	    });
	};

})();