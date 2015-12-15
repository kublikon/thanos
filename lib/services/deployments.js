/*
-- Service for deployments:
-- get deployments, create
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
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'bundles service started');

		// get bundles
		app.get('/api/deployments', function(req, res){

			log('d', 'get deployments');

			if(!check.input(req, res, db, 'deployment', ['skip', 'limit'])){
	    		return false;
	    	}

	    	var res_data = {};
				
			db.deployment.find()
			.skip(req.query.skip)
			.limit(req.query.limit)
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get deployments', 'deployments', 107));
				} else {
					res_data.deployments = data;

					res.end(check.validate(res_data, 'deployments'));
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
		    		
	    		var deployment = new db.deployment({ 
		    		deployment_group: req.body.deployment_group,
		    		deployment_group_id: req.body.deployment_group + '-id',
		    		tag_version: req.body.tag_version,
		    		description: req.body.description,
		    		is_started: true,
		    		created_at: new Date()
		    	});

				deployment.save(function(err, res_data){
					if(err){
						res.end(check.error('Unable to save deployment', 'deployment', 101));
					} else {
						res.end(check.validate(res_data, 'deployment'));
					}
				});
			});
	    });

	};

})();