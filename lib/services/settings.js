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

	    	var res_data = {};
				
			db.settings.findOne()
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get settings', 'settings', 107));
				} else {
					res_data.settings = data;

					res.end(check.validate(res_data, 'settings'));
				}
			});
	    });

		// create or update
	    app.post('/api/settings', function(req, res){

	    	log('d', 'create or update settings');

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