/*
-- Deployment logic:
-- 
*/

(function(){

	var log = require('../console'),
		helper = require('../utils/helper'),
		AWS = require('aws-sdk'),
		exec = require('child_process').exec,
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

						checkInstance();
					}
				});
			};

			// check if instance is created and healthy
			function checkInstance(){

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
				  //   id
				  //   /* more items */
				  // ],
				  // MaxResults: 0,
				  // NextToken: 'STRING_VALUE'
				};
				ec2.describeInstances(params, function(err, data) {

					log('i', err);
					log('i', data);

					if (err){
						return cb('check instance: ' + err);
					} else if(data.Reservations.length > 0){
						createDeploymentGroup();
					} else {
						setTimeout(function(){
							checkInstance();
						}, 500);
					}
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
						return cb('create deployment group: ' + err);
					} else {
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
						return cb('create code deploy: ' + err);
					} else {
						return cb(undefined);
					}
				});
			};
		},
		stop: function(options, cb){
			return cb();
		},
		status: function(options, cb){
			return cb();
		}
	};

})();