/*
-- Service for deployments:
-- get deployments, get deployment history, create, stop deployment
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
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'bundles service started');

		// get deployments
		app.get('/api/deployments', function(req, res){

			log('d', 'get deployments');

			if(!check.input(req, res, db, 'deployment', ['skip', 'limit'])){
	    		return false;
	    	}

	    	var res_data = {};
				
			db.deployment.find({ is_current_deployment: true })
			.sort({ created_at: -1 })
			// .skip(req.query.skip)
			// .limit(req.query.limit)
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get deployments', 'deployments', 107));
				} else {
					res_data.deployments = data;

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
				
			db.deployment.find({ deployment_group_id: req.params.id })
			.sort({ created_at: -1 })
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get deployment history', 'deployment', 107));
				} else {
					res_data.deployments = data;

					res.end(check.validate(res_data, 'deployment'));
				}
			});
	    });

		// create
	    app.post('/api/deployment', function(req, res){

	    	log('d', 'create deployment');

	    	security.auth(req, res, db, function(){

		    	if(!check.input(req, res, db, 'deployment', ['deployment_group', 'tag_version'])){
		    		return false;
		    	}

		    	db.deployment.update({ deployment_group_id: req.body.deployment_group + '-id', is_current_deployment: true }, { $set: { is_current_deployment: false }}, { multi: false }, function(err){
		    		if(err){
		    			res.end(check.error('Unable to save deployment', 'deployment', 101));
		    		} else {
		    			save();
		    		}
	    		});

	    		function save(){

		    		var deployment = new db.deployment({ 
		    			application_name: req.body.application_name,
			    		deployment_group: req.body.deployment_group,
			    		deployment_group_id: req.body.deployment_group + '-id',
			    		node_modules: req.body.node_modules,
			    		revision_type: req.body.revision_type,
			    		github_project_commit_id: req.body.github_project_commit_id,
						github_project_path: req.body.github_project_path,
						s3_project_path: req.body.s3_project_path,
			    		tag_version: req.body.tag_version,
			    		description: req.body.description,
			    		is_started: true,
			    		is_current_deployment: true,
			    		created_at: new Date()
			    	});

					deployment.save(function(err, res_data){
						if(err){
							res.end(check.error('Unable to save deployment', 'deployment', 101));
						} else {
							deploy.start({}, function(){
								res.end(check.validate(res_data, 'deployment'));
							});
						}
					});
				};
			});
	    });

		// stop deployment
	    app.post('/api/deployment/stop', function(req, res){

	    	log('d', 'stop deployment');

	    	security.auth(req, res, db, function(){
	    		deploy.stop({}, function(){

	    			var update = {
	    				is_started: false,
	    				is_stopped: true
	    			};

	    			db.deployment.update({ _id: req.body.id }, { $set: update }, { multi: false }, function(err, data){
	    				if(err){
							res.end(check.error('Unable to stop deployment', 'deployment', 107));
						} else {
							res.end(check.validate(data, 'deployment'));
						}
	    			});
	    		});
	    	});
	    });

	};

})();