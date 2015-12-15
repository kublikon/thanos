/*
-- Service for profile:
-- get profile
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

		log('i', 'profile service started');

	    // get profile
		app.get('/api/profile/:id', function(req, res){

			log('d', 'get profile');

			var res_data = {};

			if(!check.input(req, res, db, 'profile', [])){
	    		return false;
	    	}

			db.user.findOne({ username_public: req.params.id })
			.populate('auth', 'is_active')
			.exec(function(err, data){
				if(err){
					res.end(check.error('Unable to get profile', 'profile', 218));
				} else if (!data){
					res.end(check.error('Unable to get profile', 'profile', 219));
				} else {
					res_data.profile = data;

					res.end(check.validate(res_data, 'profile'));	
				}
			});

	    });
	};

})();