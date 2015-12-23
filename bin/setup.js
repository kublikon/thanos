/*
-- Input order:
-- Na, Na, path, salt, account, key, secret, bucket, region, domain
*/

(function(){

	var fs = require('fs'),
		data = fs.readFileSync('../config.json', 'utf-8');

	data = JSON.parse(data);

	data.mongo_path = process.argv[2];
	data.salt = process.argv[3];
	data.aws_account_id = process.argv[4];
	data.aws_access_key_id = process.argv[5],
	data.aws_secret_access_key = process.argv[6],
	data.aws_bucket = process.argv[7],
	data.aws_region = process.argv[8],
	data.aws_s3_domain = process.argv[9],

	fs.writeFileSync('../config.json', JSON.stringify(data), 'utf-8');

})();