/*
-- Deployment logic:
-- 
*/

(function(){

	var log = require('../console'),
		db = require('../database'),
		helper = require('../utils/helper');
		// aws = require('aws-sdk'),
		// iam = new aws.IAM({apiVersion: '2010-05-08'}),
		// ec2 = new aws.EC2({apiVersion: '2015-10-01', region: 'us-east-1'}),
		// codeDeploy = new aws.CodeDeploy({apiVersion: '2014-10-06', region: 'us-east-1'}),
		// autoScaling = new aws.AutoScaling({apiVersion: '2011-01-01', region: 'us-east-1'}),
		// elb = new aws.ELB({apiVersion: '2012-06-01', region: 'us-east-1'});

	// check if stopped
	function _checkStop(options, callback){
		db.deployment.findOne({ deployment_internal_id: options.application_name + '-' + options.deployment_group, is_current_deployment: true })
		.exec(function(err, data){
			if(err){
    			return callback(false);
    		} else if(data == null){
    			return callback(false);
    		} else {
    			return callback(data.is_stopped);
    		}
		});
	};

	// save progress
	function _save(options, error, message, status, id){
		db.deployment.findOne({ deployment_internal_id: options.application_name + '-' + options.deployment_group, is_current_deployment: true })
		.exec(function(err, data){
    		if(err){
    			log('e', err);
    		} else {
    			if(error){
    				data.is_started = false;
    				data.is_stopped = true;
    				data.status_description = error;
    			} else if(status == 'Succeeded'){
    				data.is_started = false;
    				data.is_deployed = true;
    				data.status_description = message;
    			} else if(status == 'Failed'){
    				data.is_started = false;
    				data.is_stopped = true;
    				data.status_description = message;
    			} else if(status == 'Stopped'){
    				data.is_started = false;
    				data.is_stopped = true;
    				data.status_description = message;
    			} else {
    				data.status_description = message;	
    			}

    			if(id){
    				data.deployment_id = id;
    			}

    			data.save(function(err){
    				if(err){
    					log('e', err);
    				}
    			});
    		}
		});
	};

	module.exports = {
		listApplications: function(app, options, cb){

			app.codeDeploy.listApplications({}, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.applications);
				}
			});
		},
		removeApplication: function(app, options, cb){

			var params = {
				applicationName: options.application_name /* required */
			};

			app.codeDeploy.deleteApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data);
				}
			});
		},
		updateApplication: function(app, options, cb){
			
			var params = {
				applicationName: options.application_name,
				newApplicationName: options.application_name_new
			};

			app.codeDeploy.updateApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, options);
				}
			});
		},
		createApplication: function(app, options, cb){
			
			var params = {
				applicationName: options.application_name /* required */
			};

			app.codeDeploy.createApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, options.application_name);
				}
			});
		},
		getIAMRoles: function(app, options, cb){
			
			app.iam.listRoles({}, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.Roles);
				}
			});
		},
		getGroups: function(app, options, cb){

			var params = {
				DryRun: false
			};

			app.ec2.describeSecurityGroups(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.SecurityGroups);
				}
			});
		},
		getAMIs: function(app, options, cb){

			var params = {
				DryRun: false,
				Filters: [
					{
						Name: 'tag-key',
						Values: ['type']
					},
					{
						Name: 'tag-value',
						Values: ['master']
					}
				]
			};

			app.ec2.describeImages(params, function(err, data) {
				if (err) {
					cb(err);
				} else{
					cb(undefined, data.Images);
				}    
			});
		},
		getAll: function(app, id, cb){

			log('i', id);

			var res_data = {};

			function getDeployment(){

				var params = {
					deploymentId: id /* required */
				};

				app.codeDeploy.getDeployment(params, function(err, data) {
				  if (err){
						return cb('get deployment: ' + err);
				 	} else {
				 		res_data.deployment = data;

						getDeploymentConfig();
					} 
				});
			};

			function getDeploymentConfig(){
				
				var params = {
					deploymentConfigName: res_data.deployment.deploymentInfo.deploymentConfigName /* required */
				};

				app.codeDeploy.getDeploymentConfig(params, function(err, data) {
					if (err){
				 		return cb('get deployment config: ' + err);
				 	} else {
				 		res_data.config = data;

						getDeploymentGroup(data);
					} 
				});
			};

			function getDeploymentGroup(){
				
				var params = {
				  applicationName: res_data.deployment.deploymentInfo.applicationName, /* required */
				  deploymentGroupName: res_data.deployment.deploymentInfo.deploymentGroupName /* required */
				};

				app.codeDeploy.getDeploymentGroup(params, function(err, data) {
					if (err){
				 		return cb('get deployment group: ' + err);
				 	} else {
				 		res_data.group = data;

						describeAutoScalingGroups();
					}
				});
			};

			function describeAutoScalingGroups(){
				
				var params = {
				  AutoScalingGroupNames: [
				    res_data.group.deploymentGroupInfo.autoScalingGroups[0].name,
				    /* more items */
				  ],
				  // MaxRecords: 0,
				  // NextToken: 'STRING_VALUE'
				};

				app.autoScaling.describeAutoScalingGroups(params, function(err, data) {
					if (err){
				 		return cb('get deployment group: ' + err);
				 	} else {
				 		res_data.scaling_group = data;

						describeLaunchConfigurations();
					}
				});
			};

			function describeLaunchConfigurations(){

				var params = {
				  LaunchConfigurationNames: [
				    res_data.scaling_group.AutoScalingGroups[0].LaunchConfigurationName,
				    /* more items */
				  ],
				  // MaxRecords: 0,
				  // NextToken: 'STRING_VALUE'
				};
				
				app.autoScaling.describeLaunchConfigurations(params, function(err, data) {
					if (err){
				 		return cb('get deployment group: ' + err);
				 	} else {
				 		res_data.launch_configurations = data;

						describeLoadBalancers();
					}
				});
			};

			function describeLoadBalancers(){

				var params = {
				  LoadBalancerNames: [
				    res_data.scaling_group.AutoScalingGroups[0].LoadBalancerNames[0],
				    /* more items */
				  ],
				  // Marker: 'STRING_VALUE',
				  // PageSize: 0
				};

				app.elb.describeLoadBalancers(params, function(err, data) {
					if (err){
				 		return cb('get deployment group: ' + err);
				 	} else {
				 		res_data.load_balancers = data;

						cb(undefined, res_data);
					}
				});
			};

			getDeployment();

		},
		start: function(app, options, cb){

			log('i', options);

			// create launch configuration
			function createLaunchConfiguration(){

				log('i', 'creating launch configuration');
				
				var params = {
					LaunchConfigurationName: options.deployment_group + '-lc', /* required */
					// AssociatePublicIpAddress: true,
					BlockDeviceMappings: [
						{
							DeviceName: '/dev/sda1', /* required */
							Ebs: {
								DeleteOnTermination: true,
								// Encrypted: false,
								// Iops: 0,
								SnapshotId: 'snap-82c0a181',
								VolumeSize: 8,
								VolumeType: 'standard'
							},
							// NoDevice: false,
							// VirtualName: 'STRING_VALUE'
						}
					],
					// ClassicLinkVPCId: 'STRING_VALUE',
					// ClassicLinkVPCSecurityGroups: [
						// 'STRING_VALUE',
						/* more items */	
					// ],
					EbsOptimized: false,
					IamInstanceProfile: options.role,
					ImageId: options.AMI,
					// InstanceId: 'STRING_VALUE',
					InstanceMonitoring: {
						Enabled: false
					},
					InstanceType: options.instance_type,
					// KernelId: 'STRING_VALUE',
					// KeyName: options.deployment_group,
					// PlacementTenancy: 'STRING_VALUE',
					// RamdiskId: 'STRING_VALUE',
					SecurityGroups: [
						options.group
					],
					// SpotPrice: 'STRING_VALUE',
					// UserData: 'STRING_VALUE'
				};

				app.autoScaling.createLaunchConfiguration(params, function(err, data) {
				 	if (err){
				 		return cb('create launch configuration: ' + err);
				 	} else {
						createLoadBalancer(data);
					}     
				});
			};

			// create load balancer
			function createLoadBalancer(data){

				log('i', 'creating load balancer');
				
				var params = {
					Listeners: [ /* required */
						{
							InstancePort: 3000, /* required */
							LoadBalancerPort: 80, /* required */
							Protocol: 'TCP', /* required */
							InstanceProtocol: 'TCP',
							// SSLCertificateId: 'STRING_VALUE'
						},
						/* more items */
					],
					LoadBalancerName: options.deployment_group + '-lb', /* required */
					AvailabilityZones: [
						'us-east-1a'
					],
					Scheme: 'internet-facing',
					// SecurityGroups: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// Subnets: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
				  	Tags: [
						{
							Key: 'type', /* required */
							Value: options.deployment_group + '-ac'
						}
					]
				};

				app.elb.createLoadBalancer(params, function(err, data) {
					if (err){
						return cb('create load balancer: ' + err);
					} else {
						createAutoScalingGroup(data);
					}
				});
			};

			// create auto scailing group
			function createAutoScalingGroup(data){

				log('i', 'creating auto scaling group');
				
				var params = {
				 	AutoScalingGroupName: options.deployment_group + '-ac', /* required */
					MaxSize: 10, /* required */
					MinSize: 1, /* required */
					AvailabilityZones: [
						'us-east-1a'
					],
					// DefaultCooldown: 0,
					DesiredCapacity: 1,
					HealthCheckGracePeriod: 300,
					// HealthCheckType: 'STRING_VALUE',
					// InstanceId: 'STRING_VALUE',
					LaunchConfigurationName: options.deployment_group + '-lc',
					LoadBalancerNames: [
						options.deployment_group + '-lb',
						/* more items */
					],
					// NewInstancesProtectedFromScaleIn: false,
					// PlacementGroup: 'STRING_VALUE',
					Tags: [
						{
							Key: 'Name', /* required */
							PropagateAtLaunch: true,
							// ResourceId: 'STRING_VALUE',
							// ResourceType: 'STRING_VALUE',
							Value: options.deployment_group + '-ec2'
						}
					],
					// TerminationPolicies: [
						// 'STRING_VALUE',
						/* more items */
					// ],
					// VPCZoneIdentifier: 'STRING_VALUE'
				};

				app.autoScaling.createAutoScalingGroup(params, function(err, data) {
					if (err){
						return cb('create auto scaling group: ' + err);
					} else {
						// returning to client - remaining process becomes internal
						cb(undefined, 'create auto scaling group: Waiting on instance creation/health checks.');

						describeInstances();
					}
				});
			};

			// check if instance is created
			function describeInstances(){

				log('i', 'checking instance creation');

				var params = {
					DryRun: false,
					Filters: [
						{
							Name: 'tag-key',
							Values: [
								'Name'
							]
						},
						{
							Name: 'tag-value',
							Values: [
								options.deployment_group + '-ec2'
							]
						}
					],	
					// InstanceIds: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// MaxResults: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.ec2.describeInstances(params, function(err, data) {

					// make sure deployment was not stopped
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'describe instances: ' + err);
						} else if(data.Reservations.length > 0 && !is_stopped){
							describeInstanceStatus(data.Reservations[0].Instances[0].InstanceId);
						} else if(!is_stopped) {
							setTimeout(function(){
								describeInstances();
							}, 500);
						}
					});
				});
			};

			// check if instance is healthy
			function describeInstanceStatus(id){

				log('i', 'checking instance status');

				var params = {
					DryRun: false,
					Filters: [
						{
							Name: 'system-status.status',
							Values: [
								'ok'
							]
						},
						{
							Name: 'instance-status.status',
							Values: [
								'ok'
							]
						}
					],
					IncludeAllInstances: true,
					InstanceIds: [
						id
					],
					// MaxResults: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.ec2.describeInstanceStatus(params, function(err, data) {

					// make sure deployment was not stopped
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'describe instance status: ' + err);
						} else if(data.InstanceStatuses.length > 0 && !is_stopped){
							createDeploymentGroup();
						} else if(!is_stopped) {
							setTimeout(function(){
								describeInstanceStatus(id);
							}, 500);
						}
					});
				});
			};

			// create deployment group
			function createDeploymentGroup(){

				log('i', 'creating deployment group');

				var params = {
					applicationName: options.application_name, /* required */
					deploymentGroupName: options.deployment_group, /* required */
					serviceRoleArn: options.arn, /* required */
					autoScalingGroups: [
						options.deployment_group + '-ac'
					],
					deploymentConfigName: 'CodeDeployDefault.OneAtATime',
					// ec2TagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	}
					// ],
					// onPremisesInstanceTagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	},
					// 	/* more items */
					// ]
				};

				app.codeDeploy.createDeploymentGroup(params, function(err, data) {
					if (err){
						_save(options, 'create deployment group: ' + err);
					} else {
						_save(options, undefined, 'create deployment group: Creating deployment group.');
						createCodeDeploy(data);
					}
				});
			};

			// create code deploy
			function createCodeDeploy(){

				log('i', 'creating code deploy');
				
				var params = {
					applicationName: options.application_name, /* required */
					deploymentConfigName: 'CodeDeployDefault.OneAtATime',
					deploymentGroupName: options.deployment_group,
					description: options.description,
					ignoreApplicationStopFailures: true,
				};

				if(options.revision_type == 'GitHub'){
					params.revision = {
						revisionType: 'GitHub',
						gitHubLocation: {
							commitId: options.github_project_commit_id,
							repository: options.github_project_path
						}
					};
				} else if(options.revision_type == 'S3'){
					params.revision = {
						revisionType: 'S3',
						s3Location: {
							bucket: options.s3_project_bucket,
							bundleType: options.s3_project_bundle_type,
							// eTag: 'STRING_VALUE',
							key: options.s3_project_key,
							// version: 'STRING_VALUE'
						}
					};
				}

				app.codeDeploy.createDeployment(params, function(err, data) {
					if (err){
						_save(options, 'create code deploy: ' + err);
					} else {
						_save(options, undefined, 'create code deploy: Deployment in progress.', undefined, data.deploymentId);
						getDeployment(data.deploymentId);
					}
				});
			};

			// check deployment
			function getDeployment(id){

				log('i', 'checking deployment');
				
				var params = {
					deploymentId: id /* required */
				};
				
				app.codeDeploy.getDeployment(params, function(err, data) {

					// make sure deployment was not stopped
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'get deployment: ' + err);
						} else if(data.deploymentInfo.status == 'Succeeded'){
							_save(options, undefined, 'deployment: ' + data.deploymentInfo.status, data.deploymentInfo.status);
						} else if(data.deploymentInfo.status == 'Failed' || data.deploymentInfo.status == 'Stopped'){
							_save(options, undefined, 'deployment: ' + data.deploymentInfo.status + ' - ' + data.deploymentInfo.errorInformation.code + ' - ' + data.deploymentInfo.errorInformation.message, data.deploymentInfo.status);
						} else if(!is_stopped) {
							setTimeout(function(){
								getDeployment(id);
							}, 500);
						}
					});
				});
			};

			createLaunchConfiguration();
		},
		redeploy: function(app, options, cb){

			log('i', options);

			// not sure if we need this yet
			// function stopDeployment(){

			// 	log('i', 'stopping pending deployments');

			// 	var params = {
			// 		deploymentId: 'STRING_VALUE' /* required */
			// 	};

			// 	codeDeploy.stopDeployment(params, function(err, data) {
			// 		if (err){
			// 			_save(options, 'stop deployment: ' + err);
			// 		} else {
			// 			createLaunchConfiguration();
			// 		}
			// 	});
			// };

			function describeLaunchConfigurations(){

				log('i', 'comparing launch configuration');

				var params = {
					LaunchConfigurationNames: [
						options.deployment_group + '-lc'
					],
					// MaxRecords: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.autoScaling.describeLaunchConfigurations(params, function(err, data) {
					if (err){
						return cb('describe launch configurations: ' + err);
					} else if(data.LaunchConfigurations.length == 0) {
						createLaunchConfiguration();
					} else {
						var compare = data.LaunchConfigurations[0];

						if(compare.IamInstanceProfile == options.role && compare.ImageId == options.AMI && compare.InstanceType == options.instance_type && compare.SecurityGroups[0] == options.group){
							describeAutoScalingGroups();
						} else {
							deleteLaunchConfiguration();
						}
					}
				});
			};

			// delete existing launch configuration
			function deleteLaunchConfiguration(){

				log('i', 'deleting launch configuration');

				var params = {
					LaunchConfigurationName: options.deployment_group + '-lc' /* required */
				};

				app.autoScaling.deleteLaunchConfiguration(params, function(err, data) {
					if (err){
						return cb('delete launch configuration: ' + err);
					} else {
						createLaunchConfiguration();
					}
				});
			};

			// recreate launch configuration
			function createLaunchConfiguration(){

				log('i', 'creating launch configuration');

				var params = {
					LaunchConfigurationName: options.deployment_group + '-lc', /* required */
					// AssociatePublicIpAddress: true,
					BlockDeviceMappings: [
						{
							DeviceName: '/dev/sda1', /* required */
							Ebs: {
								DeleteOnTermination: true,
								// Encrypted: false,
								// Iops: 0,
								SnapshotId: 'snap-82c0a181',
								VolumeSize: 8,
								VolumeType: 'standard'
							},
							// NoDevice: false,
							// VirtualName: 'STRING_VALUE'
						}
					],
					// ClassicLinkVPCId: 'STRING_VALUE',
					// ClassicLinkVPCSecurityGroups: [
						// 'STRING_VALUE',
						/* more items */	
					// ],
					EbsOptimized: false,
					IamInstanceProfile: options.role,
					ImageId: options.AMI,
					// InstanceId: 'STRING_VALUE',
					InstanceMonitoring: {
						Enabled: false
					},
					InstanceType: options.instance_type,
					// KernelId: 'STRING_VALUE',
					// KeyName: options.deployment_group,
					// PlacementTenancy: 'STRING_VALUE',
					// RamdiskId: 'STRING_VALUE',
					SecurityGroups: [
						options.group
					],
					// SpotPrice: 'STRING_VALUE',
					// UserData: 'STRING_VALUE'
				};

				app.autoScaling.createLaunchConfiguration(params, function(err, data) {
				 	if (err){
				 		return cb('create launch configuration: ' + err);
				 	} else {
						describeAutoScalingGroups();
					}
				});
			};

			// check auto scaling group
			function describeAutoScalingGroups(){

				log('i', 'describing auto scaling groups');

				var params = {
					AutoScalingGroupNames: [
						options.deployment_group + '-ac'
					],
					// MaxRecords: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.autoScaling.describeAutoScalingGroups(params, function(err, data) {

					log('w', data.AutoScalingGroups);

					if (err){
						return cb('describe auto scaling groups: ' + err);
					} else if(data.AutoScalingGroups.length == 0) {
						createAutoScalingGroup();
					} else {
						var compare = data.AutoScalingGroups[0];

						if(compare.MinSize == 0 && compare.MaxSize == 10 && compare.DesiredCapacity == 1){
							cb(undefined, 'describe auto scaling groups: Checking deployment group.');

							getDeploymentGroup();
						} else {
							updateAutoScalingGroup();
						}
					}
				});
			};

			// create auto scaling group 
			function createAutoScalingGroup(){

				log('i', 'creating auto scaling group');
				
				var params = {
				 	AutoScalingGroupName: options.deployment_group + '-ac', /* required */
					MaxSize: 10, /* required */
					MinSize: 1, /* required */
					AvailabilityZones: [
						'us-east-1a'
					],
					// DefaultCooldown: 0,
					DesiredCapacity: 1,
					HealthCheckGracePeriod: 300,
					// HealthCheckType: 'STRING_VALUE',
					// InstanceId: 'STRING_VALUE',
					LaunchConfigurationName: options.deployment_group + '-lc',
					LoadBalancerNames: [
						options.deployment_group + '-lb',
						/* more items */
					],
					// NewInstancesProtectedFromScaleIn: false,
					// PlacementGroup: 'STRING_VALUE',
					Tags: [
						{
							Key: 'Name', /* required */
							PropagateAtLaunch: true,
							// ResourceId: 'STRING_VALUE',
							// ResourceType: 'STRING_VALUE',
							Value: options.deployment_group + '-ec2'
						}
					],
					// TerminationPolicies: [
						// 'STRING_VALUE',
						/* more items */
					// ],
					// VPCZoneIdentifier: 'STRING_VALUE'
				};

				app.autoScaling.createAutoScalingGroup(params, function(err, data) {
					if (err){
						return cb('create auto scaling group: ' + err);
					} else {
						// returning to client - remaining process becomes internal
						cb(undefined, 'create auto scaling group: Waiting on instance creation/health checks.');

						describeInstances();
					}
				});
			};

			// update auto scaling group
			function updateAutoScalingGroup(){

				log('i', 'updating auto scaling group');

				var params = {
					AutoScalingGroupName: options.deployment_group + '-ac', /* required */
					AvailabilityZones: [
						'us-east-1a'
					],
					DefaultCooldown: 0,
					DesiredCapacity: 1,
					HealthCheckGracePeriod: 300,
					// HealthCheckType: 'STRING_VALUE',
					LaunchConfigurationName: options.deployment_group + '-lc',
					MaxSize: 10,
					MinSize: 1,
					// NewInstancesProtectedFromScaleIn: true || false,
					// PlacementGroup: 'STRING_VALUE',
					// TerminationPolicies: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// VPCZoneIdentifier: 'STRING_VALUE'
				};

				app.autoScaling.updateAutoScalingGroup(params, function(err, data) {
					if (err){
						return cb('update auto scaling group: ' + err);
					} else {
						// returning to client - remaining process becomes internal
						cb(undefined, 'update auto scaling group: Waiting on instance creation/health checks.');

						describeInstances();
					}
				});
			};

			// check if instance is created
			function describeInstances(){

				log('i', 'checking instance creation');

				var params = {
					DryRun: false,
					Filters: [
						{
							Name: 'tag-key',
							Values: [
								'Name'
							]
						},
						{
							Name: 'tag-value',
							Values: [
								options.deployment_group + '-ec2'
							]
						}
					],	
					// InstanceIds: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// MaxResults: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.ec2.describeInstances(params, function(err, data) {

					// make sure deployment was not stopped
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'describe instances: ' + err);
						} else if(data.Reservations.length > 0 && !is_stopped){
							describeInstanceStatus(data.Reservations[0].Instances[0].InstanceId);
						} else if(!is_stopped) {
							setTimeout(function(){
								describeInstances();
							}, 500);
						}
					});
				});
			};

			// check if instance is healthy
			function describeInstanceStatus(id){

				log('i', 'checking instance status');

				var params = {
					DryRun: false,
					Filters: [
						{
							Name: 'system-status.status',
							Values: [
								'ok'
							]
						},
						{
							Name: 'instance-status.status',
							Values: [
								'ok'
							]
						}
					],
					IncludeAllInstances: true,
					InstanceIds: [
						id
					],
					// MaxResults: 0,
					// NextToken: 'STRING_VALUE'
				};

				app.ec2.describeInstanceStatus(params, function(err, data) {

					// make sure deployment was not stopped
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'describe instance status: ' + err);
						} else if(data.InstanceStatuses.length > 0 && !is_stopped){
							getDeploymentGroup();
						} else if(!is_stopped) {
							setTimeout(function(){
								describeInstanceStatus(id);
							}, 500);
						}
					});
				});
			};

			// check deployment group
			function getDeploymentGroup(){

				log('i', 'checking deployment group');

				var params = {
					applicationName: options.application_name, /* required */
					deploymentGroupName: options.deployment_group /* required */
				};

				app.codeDeploy.getDeploymentGroup(params, function(err, data) {

					log('w', err + data);

					if (err && !String(err).match('No Deployment Group found')){
						_save(options, 'get deployment group: ' + err);
				 	} else if(String(err).match('No Deployment Group found')) {
				 		createDeploymentGroup();
					} else {
						updateDeploymentGroup();
					}
				});
			};

			//create deployment group
			function createDeploymentGroup(){

				log('i', 'creating deployment group');

				var params = {
					applicationName: options.application_name, /* required */
					deploymentGroupName: options.deployment_group, /* required */
					serviceRoleArn: options.arn, /* required */
					autoScalingGroups: [
						options.deployment_group + '-ac'
					],
					deploymentConfigName: 'CodeDeployDefault.OneAtATime',
					// ec2TagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	}
					// ],
					// onPremisesInstanceTagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	},
					// 	/* more items */
					// ]
				};

				app.codeDeploy.createDeploymentGroup(params, function(err, data) {
					if (err){
						_save(options, 'create deployment group: ' + err);
					} else {
						_save(options, undefined, 'create deployment group: Creating deployment group.');
						createCodeDeploy(data);
					}
				});
			};

			// update deployment group
			function updateDeploymentGroup(){

				log('i', 'updating deployment group');

				var params = {
					applicationName: options.application_name, /* required */
					currentDeploymentGroupName: options.deployment_group, /* required */
					// autoScalingGroups: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// deploymentConfigName: 'STRING_VALUE',
					// ec2TagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	},
					// 	/* more items */
					// ],
					// newDeploymentGroupName: 'STRING_VALUE',
					// onPremisesInstanceTagFilters: [
					// 	{
					// 		Key: 'STRING_VALUE',
					// 		Type: 'KEY_ONLY | VALUE_ONLY | KEY_AND_VALUE',
					// 		Value: 'STRING_VALUE'
					// 	},
					// 	/* more items */
					// ],
					serviceRoleArn: options.arn
				};

				app.codeDeploy.updateDeploymentGroup(params, function(err, data) {
					if (err){
						_save(options, 'update deployment group: ' + err);
				 	} else {
				 		_save(options, undefined, 'update deployment group: Creating deployment group.');
						createCodeDeploy();
					}
				});
			};

			// create code deploy
			function createCodeDeploy(){

				log('i', 'creating code deploy');
				
				var params = {
					applicationName: options.application_name, /* required */
					deploymentConfigName: 'CodeDeployDefault.OneAtATime',
					deploymentGroupName: options.deployment_group,
					description: options.description,
					ignoreApplicationStopFailures: true,
				};

				if(options.revision_type == 'GitHub'){
					params.revision = {
						revisionType: 'GitHub',
						gitHubLocation: {
							commitId: options.github_project_commit_id,
							repository: options.github_project_path
						}
					};
				} else if(options.revision_type == 'S3'){
					params.revision = {
						revisionType: 'S3',
						s3Location: {
							bucket: options.s3_project_bucket,
							bundleType: options.s3_project_bundle_type,
							// eTag: 'STRING_VALUE',
							key: options.s3_project_key,
							// version: 'STRING_VALUE'
						}
					};
				}

				app.codeDeploy.createDeployment(params, function(err, data) {
					if (err){
						_save(options, 'create code deploy: ' + err);
					} else {
						_save(options, undefined, 'create code deploy: Deployment in progress.', undefined, data.deploymentId);
						getDeployment(data.deploymentId);
					}
				});
			};

			// check deployment
			function getDeployment(id){

				log('i', 'checking deployment');
				
				var params = {
					deploymentId: id /* required */
				};
				
				app.codeDeploy.getDeployment(params, function(err, data) {
					_checkStop(options, function(is_stopped){
						if (err){
							_save(options, 'get deployment: ' + err);
						} else if(data.deploymentInfo.status == 'Succeeded'){
							_save(options, undefined, 'deployment: ' + data.deploymentInfo.status, data.deploymentInfo.status);
						} else if(data.deploymentInfo.status == 'Failed' || data.deploymentInfo.status == 'Stopped'){
							_save(options, undefined, 'deployment: ' + data.deploymentInfo.status + ' - ' + data.deploymentInfo.errorInformation.code + ' - ' + data.deploymentInfo.errorInformation.message, data.deploymentInfo.status);
						} else if(!is_stopped) {
							setTimeout(function(){
								getDeployment(id);
							}, 500);
						}
					});
				});
			};

			describeLaunchConfigurations();
		},
		stop: function(app, options, cb){

			log('i', options);

			// kill deployment
			function stopDeployment(id, name){
				
				var params = {
					deploymentId: id /* required */
				};

				app.codeDeploy.stopDeployment(params, function(err, data) {
					if(err){
						return cb(err);
					} else {
						// return cb(undefined, 'stopped');

						updateAutoScalingGroup(name);
					}
				});
			};

			// check for instance 
			function updateAutoScalingGroup(name){

				var params = {
					AutoScalingGroupName: name + '-ac', /* required */
					// AvailabilityZones: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// DefaultCooldown: 0,
					DesiredCapacity: 0,
					// HealthCheckGracePeriod: 0,
					// HealthCheckType: 'STRING_VALUE',
					// LaunchConfigurationName: 'STRING_VALUE',
					MaxSize: 0,
					MinSize: 0,
					// NewInstancesProtectedFromScaleIn: true || false,
					// PlacementGroup: 'STRING_VALUE',
					// TerminationPolicies: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// VPCZoneIdentifier: 'STRING_VALUE'
				};

				app.autoScaling.updateAutoScalingGroup(params, function(err, data) {
					if(err){
						return cb(err);
					} else {
						return cb(undefined, 'stopped');
					}
				});
			};

			db.deployment.findOne({ _id: options.id })
			.exec(function(err, data){
				if(err){
					return cb(err);
				} else {
					if(data.deployment_id == 'not assigned'){
						updateAutoScalingGroup(data.deployment_group);
					} else {
						stopDeployment(data.deployment_id, data.deployment_group);
					}
				}
			});
		},
		remove: function(app, options, cb){

			log('i', options);

			function deleteDeploymentGroup(){

				var params = {
					applicationName: options.application_name, /* required */
					deploymentGroupName: options.deployment_group /* required */
				};

				app.codeDeploy.deleteDeploymentGroup(params, function(err, data) {
					if(err){
						return cb(err);
					} else {
						updateAutoScalingGroup();
					}
				});
			};

			function updateAutoScalingGroup(name){

				var params = {
					AutoScalingGroupName: options.deployment_group + '-ac', /* required */
					// AvailabilityZones: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// DefaultCooldown: 0,
					DesiredCapacity: 0,
					// HealthCheckGracePeriod: 0,
					// HealthCheckType: 'STRING_VALUE',
					// LaunchConfigurationName: 'STRING_VALUE',
					MaxSize: 0,
					MinSize: 0,
					// NewInstancesProtectedFromScaleIn: true || false,
					// PlacementGroup: 'STRING_VALUE',
					// TerminationPolicies: [
					// 	'STRING_VALUE',
					// 	/* more items */
					// ],
					// VPCZoneIdentifier: 'STRING_VALUE'
				};

				app.autoScaling.updateAutoScalingGroup(params, function(err, data) {
					if(err && !String(err).match('AutoScalingGroup name not found')){
						return cb(err);
					} else {
						deleteAutoScalingGroup();
					}
				});
			};

			function deleteAutoScalingGroup(){

				var params = {
					AutoScalingGroupName: options.deployment_group + '-ac', /* required */
					ForceDelete: true
				};

				app.autoScaling.deleteAutoScalingGroup(params, function(err, data) {
					if(err && !String(err).match('AutoScalingGroup name not found')){
						return cb(err);
					} else {
						deleteLoadBalancer();
					}
				});
			};

			function deleteLoadBalancer(){

				var params = {
					LoadBalancerName: options.deployment_group + '-lb' /* required */
				};

				app.elb.deleteLoadBalancer(params, function(err, data) {
					if(err){
						return cb(err);
					} else {
						deleteLaunchConfiguration();
					}
				});
			};

			function deleteLaunchConfiguration(){

				var params = {
					LaunchConfigurationName: options.deployment_group + '-lc' /* required */
				};

				app.autoScaling.deleteLaunchConfiguration(params, function(err, data) {
					if(err && !String(err).match('Launch configuration name not found')){
						return cb(err);
					} else {
						return cb(undefined, 'removed');
					}
				});
			};

			deleteDeploymentGroup();
		}
	};

})();