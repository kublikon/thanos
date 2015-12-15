/*
-- This module reads the configuration file for this project. When
-- config file is not found default properties are set.
*/

(function(){

	try {
		var log = require('./console'),
			config = require('../config.json');

		if(config.mode == 'dev' || config.mode == 'dev-detail'){
			config.port = config.port_dev;
			config.mongo_path = config.mongo_path_dev;
	    } else {
	        config.port = config.port_prod;
	        config.mongo_path = config.mongo_path_prod;
	    }

		module.exports = config;
	} 
	catch(e) {
		var log = require('./console'),
			config = {
				mode: 'dev',
				port: 3000,
				title: 'not configured'
			};

		log('w', '.config file is missing. Please insert a config in the root of the directory.');

		module.exports = config;
	}
})();