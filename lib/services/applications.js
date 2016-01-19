/*
-- Service for aplication:
-- get applications, get, create, !update
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		deploy = require('../deployments/deploy'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'application service started');

		// get users
		app.get('/api/applications', function(req, res){

			log('d', 'get applications');

			security.auth(req, res, db, 'all', function(){

				if(!check.input(req, res, db, 'applications', ['skip', 'limit'])){
		    		return false;
		    	}

		    	var res_data = {};

		    	deploy.listApplications({}, function(err, data){
		    		if(err){
						res.end(check.error('Unable to get applications', 'applications', 107));
					} else {
						res_data.applications = data;

						res.end(check.validate(res_data, 'applications'));
					}
		    	});
			});
	    });

		// update application
		app.post('/api/application/update', function(req, res){

			log('d', 'update application');

			security.auth(req, res, db, 'developer', function(){

				if(!check.input(req, res, db, 'applications', [])){
		    		return false;
		    	}

		    	var res_data = {};

		    	deploy.updateApplication(req.body, function(err, data){
		    		if(err){
						res.end(check.error('Unable to update application', 'application', 107));
					} else {
						res_data.application = data;

						res.end(check.validate(res_data, 'application'));
					}
		    	});
			});

	    });

		// remove application
		app.post('/api/application/remove', function(req, res){

			log('d', 'remove application');

			security.auth(req, res, db, 'developer', function(){

				if(!check.input(req, res, db, 'applications', [])){
		    		return false;
		    	}

		    	var res_data = {};

		    	deploy.removeApplication(req.body, function(err, data){
		    		if(err){
						res.end(check.error('Unable to remove application', 'application', 107));
					} else {
						res_data.application = data;

						res.end(check.validate(res_data, 'application'));
					}
		    	});
			});

	    });	

	    // create application
		app.post('/api/application', function(req, res){

			log('d', 'create application');

			security.auth(req, res, db, function(){

				if(!check.input(req, res, db, 'developer', 'applications', [])){
		    		return false;
		    	}

		    	var res_data = {};

		    	deploy.createApplication(req.body, function(err, data){
		    		if(err){
						res.end(check.error('Unable to create application', 'application', 107));
					} else {
						res_data.application = data;

						res.end(check.validate(res_data, 'application'));
					}
		    	});
			});

	    });	
	};

})();