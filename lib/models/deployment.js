/*
-- Model for deployment
*/

(function (){

	var log = require('../console'),
		mongoose = require('mongoose'),
		schema = mongoose.Schema,
		config = require('../config'),
		security = require('../utils/security'),
		db = mongoose.connection,
		model = {};

	model = mongoose.model('deployment', {
		deployment_internal_id: String, // application_name-deployment_group
		deployment_id: { type: String, default: 'not assigned' },
		application_name: String,
		deployment_group: String,
		deployment_count: Number, // placeholder for dynamic count
		group: String,
		role: String,
		arn: String,
		AMI: String,
		instance_type: String,
		revision_type: { type: String, enum: ['S3', 'GitHub'] },
		s3_project_bucket: String,
		s3_project_key: String,
		s3_project_bundle_type: String,
		github_project_commit_id: String,
		github_project_path: String,
		node_modules: { type: String, enum: ['install', 'link'] },
		branch: { type: String, default: '' },
		user_data: { type: String, default: '' },
		description: String,
		comments: [{ type: schema.Types.ObjectId, ref: 'comment' }],
		is_started: { type: Boolean, default: false },
		is_deployed: { type: Boolean, default: false },
		is_stopped: { type: Boolean, default: false },
		is_current_deployment: { type: Boolean, default: false },
		status_description: String,
		created_at: Date
	});

	module.exports = model;

})();