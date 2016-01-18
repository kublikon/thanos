/*
-- Checking thanos S3 bucket
*/

(function(){

	var log = require('./console'),
		config = require('./config'),
		db = require('./database'),
		AWS = require('aws-sdk'),
		s3 = new AWS.S3({apiVersion: '2006-03-01'});

	module.exports = function(app){

		function headBucket(){

			log('i', 'checking thanos S3 bucket');

			var params = {
				Bucket: config.aws_bucket
			};

			s3.headBucket(params, function(err, data) {
				if(err && err.code != 'NotFound'){
					log('e', err);
				} else if(err && err.code == 'NotFound') {
					createBucket();
				} else {
					config.aws_s3_domain = 'https://' + config.aws_bucket + '.s3.amazonaws.com';

					log('i', 'thanos S3 bucket found');
				}
			});
		};

		function createBucket(){

			log('i', 'creating s3 bucket for thanos');

			var params = {
				Bucket: config.aws_bucket, /* required */
				ACL: 'public-read',
				// CreateBucketConfiguration: {
				// 	LocationConstraint: 'EU | eu-west-1 | us-west-1 | us-west-2 | ap-southeast-1 | ap-southeast-2 | ap-northeast-1 | sa-east-1 | cn-north-1 | eu-central-1'
				// },
				// GrantFullControl: 'STRING_VALUE',
				// GrantRead: 'STRING_VALUE',
				// GrantReadACP: 'STRING_VALUE',
				// GrantWrite: 'STRING_VALUE',
				// GrantWriteACP: 'STRING_VALUE'
			};

			s3.createBucket(params, function(err, data) {
				if(err){
					log('e', err);
				} else {
					config.aws_s3_domain = 'https://' + config.aws_bucket + '.s3.amazonaws.com';
					
					log('i', 'S3 bucket created for thanos');
				}
			});
		};

		headBucket();
	};

})();