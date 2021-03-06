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

		data.port = process.argv[2];
		data.mongo_path = process.argv[3];
		data.salt = process.argv[4];

		fs.writeFileSync('../config.json', JSON.stringify(data), 'utf-8');

		log('i', 'config.json updated');

		updateSettings();
	} else {
		updateUser();
	}

	// setting up settings

	function updateSettings(){

	    var update = {
			setting_id: 1,
			aws_account_id: process.argv[5],
			aws_access_key_id: process.argv[6],
			aws_secret_access_key: process.argv[7],
			aws_bucket: process.argv[8],
			aws_region: process.argv[9],
			aws_s3_domain: 'https://' + process.argv[8] + '.s3.amazonaws.com',

			// default preferences
			device_name: '/dev/sda1',
			snapshot_id: 'snap-82c0a181',
			volume_type: 'standard',
			min_size: 1,
			max_size: 10,
			desired_capacity: 1,

			created_at: new Date()
		}
		db.setting.findOneAndUpdate({ setting_id: 1 }, update, { upsert: true, new: true }, function(err, data){
			if(err){
				log('e', 'unable to save settings');
			} else {
				log('i', 'settings updated');

				updateUser();
			}
		});
	};

	// setting up password for default user
	
	function updateUser(){

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
	};

})();