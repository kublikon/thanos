/*
-- Input order:
-- Na, Na, path, salt, account, key, secret, bucket, region, domain, path_to_project
*/

(function(){

	var fs = require('fs'),
		log = require('../lib/console'),
		config = require('../lib/config'),
		db = require('../lib/database'),
		data = fs.readFileSync('../config.json', 'utf-8');


	// updating config.json

	if(process.argv[3] != '-u'){
		data = JSON.parse(data);

		data.mongo_path = process.argv[2];
		data.salt = process.argv[3];
		data.aws_account_id = process.argv[4];
		data.aws_access_key_id = process.argv[5],
		data.aws_secret_access_key = process.argv[6],
		data.aws_bucket = process.argv[7],
		data.aws_region = process.argv[8],
		data.path_to_project = process.argv[9],

		fs.writeFileSync('../config.json', JSON.stringify(data), 'utf-8');

		log('i', 'config.json updated');
	}

	// setting up password for default user
	
	db.auth.findOne({ username: 'admin@user.com' })
	.exec(function(err, auth){
		if(err){
			log('e', 'password update failed');

			process.exit();
		} else {
			auth.password = 'thanos';

			auth.save(function(err_save){
				if(err_save){
					log('e', 'password update failed');

					process.exit();
				} else {
					log('i', 'default user set: un: admin@user.com, pw: thanos');

					log('w', 'we recommend that you create a new user and delete the default user once in production');

					process.exit();
				}
			});
		}
	});

})();