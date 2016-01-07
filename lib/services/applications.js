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
		// helper = require('../utils/helper'),
		deploy = require('../deployments/deploy'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'application service started');

		// get users
		app.get('/api/applications', function(req, res){

			log('d', 'get applications');

			security.auth(req, res, db, function(){

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

	};

})();