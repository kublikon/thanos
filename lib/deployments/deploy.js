/*
-- Deployment logic:
-- 
*/

(function(){

	var log = require('../console'),
		db = require('../database'),
		helper = require('../utils/helper'),
		AWS = require('aws-sdk'),
		iam = new AWS.IAM({apiVersion: '2010-05-08'}),
		ec2 = new AWS.EC2({apiVersion: '2015-10-01', region: 'us-east-1'}),
		codeDeploy = new AWS.CodeDeploy({apiVersion: '2014-10-06', region: 'us-east-1'}),
		autoScaling = new AWS.AutoScaling({apiVersion: '2011-01-01', region: 'us-east-1'}),
		elb = new AWS.ELB({apiVersion: '2012-06-01', region: 'us-east-1'});

	module.exports = {
		listApplications: function(options, cb){

			codeDeploy.listApplications({}, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.applications);
				}
			});
		},
		removeApplication: function(options, cb){

			var params = {
				applicationName: options.application_name /* required */
			};

			codeDeploy.deleteApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data);
				}
			});
		},
		updateApplication: function(options, cb){
			
			var params = {
				applicationName: options.application_name,
				newApplicationName: options.application_name_new
			};

			codeDeploy.updateApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, options);
				}
			});
		},
		createApplication: function(options, cb){
			
			var params = {
				applicationName: options.application_name /* required */
			};

			codeDeploy.createApplication(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, options.application_name);
				}
			});
		},
		getIAMRoles: function(options, cb){
			
			iam.listRoles({}, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.Roles);
				}
			});
		},
		getGroups: function(options, cb){

			var params = {
				DryRun: false
			};

			ec2.describeSecurityGroups(params, function(err, data) {
				if (err){
					cb(err);
				} else {
					cb(undefined, data.SecurityGroups);
				}
			});
		},
		getAMIs: function(options, cb){

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

			ec2.describeImages(params, function(err, data) {
				if (err) {
					cb(err);
				} else{
					cb(undefined, data.Images);
				}    
			});
		},
		getAll: function(id, cb){

			log('i', id);

			var res_data = {};

			function getDeployment(){

				var params = {
					deploymentId: id /* required */
				};

				codeDeploy.getDeployment(params, function(err, data) {
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

				codeDeploy.getDeploymentConfig(params, function(err, data) {
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

				codeDeploy.getDeploymentGroup(params, function(err, data) {
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

				autoScaling.describeAutoScalingGroups(params, function(err, data) {
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
				autoScaling.describeLaunchConfigurations(params, function(err, data) {
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

				elb.describeLoadBalancers(params, function(err, data) {
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
		start: function(options, cb){

			log('i', options);

			// create launch configuration
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
				InstanceType: 't1.micro',
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

			autoScaling.createLaunchConfiguration(params, function(err, data) {
			 	if (err){
			 		return cb('create launch configuration: ' + err);
			 	} else {
					createLoadBalancer(data);
				}     
			});

			// create load balancer
			function createLoadBalancer(data){
				
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

				elb.createLoadBalancer(params, function(err, data) {
					if (err){
						return cb('create load balancer: ' + err);
					} else {
						createAutoScalingGroup(data);
					}
				});
			};

			// create auto scailing group
			function createAutoScalingGroup(data){
				
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

				autoScaling.createAutoScalingGroup(params, function(err, data) {
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

				ec2.describeInstances(params, function(err, data) {

					// make sure deployment was not stopped
					checkStop(function(is_stopped){
						if (err){
							save('describe instances: ' + err);
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

				ec2.describeInstanceStatus(params, function(err, data) {

					// make sure deployment was not stopped
					checkStop(function(is_stopped){
						if (err){
							save('describe instance status: ' + err);
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

				codeDeploy.createDeploymentGroup(params, function(err, data) {
					if (err){
						save('create deployment group: ' + err);
					} else {
						save(undefined, 'create deployment group: Creating deployment group.');
						createCodeDeploy(data);
					}
				});
			};

			// create code deploy
			function createCodeDeploy(){
				
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

				codeDeploy.createDeployment(params, function(err, data) {
					if (err){
						save('create code deploy: ' + err);
					} else {
						save(undefined, 'create code deploy: Deployment in progress.', undefined, data.deploymentId);
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
				
				codeDeploy.getDeployment(params, function(err, data) {
					checkStop(function(is_stopped){
						if (err){
							save('get deployment: ' + err);
						} else if(data.deploymentInfo.status == 'Succeeded'){
							save(undefined, 'deployment: ' + data.deploymentInfo.status + ' - ' + data.deploymentInfo.errorInformation.message, data.deploymentInfo.status);
						} else if(data.deploymentInfo.status == 'Failed' || data.deploymentInfo.status == 'Stopped'){
							save(undefined, 'deployment: ' + data.deploymentInfo.status + ' - ' + data.deploymentInfo.errorInformation.code + ' - ' + data.deploymentInfo.errorInformation.message, data.deploymentInfo.status);
						} else if(!is_stopped) {
							setTimeout(function(){
								getDeployment(id);
							}, 500);
						}
					});
				});
			};

			// check if stopped
			function checkStop(callback){
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
			function save(error, message, status, id){
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
		},
		restart: function(options, cb){

		},
		stop: function(options, cb){

			log('i', options);

			// kill deployment
			function stopDeployment(id, name){
				
				var params = {
					deploymentId: id /* required */
				};

				codeDeploy.stopDeployment(params, function(err, data) {
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

				autoScaling.updateAutoScalingGroup(params, function(err, data) {
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
		delete: function(options, cb){

		}
	};

})();