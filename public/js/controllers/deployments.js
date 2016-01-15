function deploymentsCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	var content = { skip: 0, limit: 8 };

	$scope.filter_sort = 'All';

	check.user(false, function(){
		storage.find('user', function(token){
			
			content.access_token = token.access_token;
			content.user_id = token.id;

			service.get('api/deployments', content, function(data){

				console.log(data);

				data.deployments.safeForEach(function(deployment, index){
					var date = new Date(deployment.created_at);
					
					data.deployments[index].created_at = date.toLocaleDateString('en-US') + ' - ' + date.toLocaleTimeString("en-US");
				});

				helper.bind('deployment', $scope, data, data);

				content.skip += 8;
			});
		});	
	});

	function clear(){
		service.clearValidation();

		$('#new-deployment').slideUp();
		$('#edit-deployment').slideUp();

		$scope.application_name = '';
		$scope.deployment_group = '';
		$scope.selected_group = '';
		$scope.selected_role = '';
		$scope.selected_AMI = '';
		$scope.node_modules = '';
		$scope.revision_type = '';
		$scope.description = '';
	};

	// search highlight
	$('#search-input').focusin(function(){
		$('.b-search').addClass('on');
	});

	$('#search-input').focusout(function(){
		$('.b-search').removeClass('on');
	});

	$scope.openNewDeployment = function(){
		$('#edit-deployment').slideUp();
		$('#new-deployment').slideDown();
		$('html, body, .t-main').animate({ scrollTop: 0 }, 'fast');
	};

	$scope.openEditDeployment = function(deployment){

		$scope.edit = deployment;

		$('#new-deployment').slideUp();
		$('#edit-deployment').slideDown();
		$('html, body, .t-main').animate({ scrollTop: 0 }, 'fast');
	};

	$scope.getMoreDeployments = function(){
		service.get('api/deployments', content, function(data){
			if(!data.error){
				$scope.posts = $scope.posts.concat(data.posts);

				content.skip += 8;

				$('html, body, .b-main').animate({ scrollTop: $('.b-footer').position().top }, 500);
			}
		});
	};

	$scope.filter = function(filter, type){
		helper.filter('post', $scope, content, filter, type, function(data){
			content = data;
		});
	};

	$scope.cancel = function(){
		clear();
	};
	
	$scope.save = function(){

		$('#save').prop('disabled', true);

		var pass = 0;

		pass += service.validate($scope.deployment_group, 'deployment-group', 'text', pass);
		pass += service.validate($scope.node_modules, 'node-modules', 'select', pass);
		pass += service.validate($scope.revision_type, 'revision-type', 'select', pass);
		pass += service.validate($scope.description, 'description', 'textarea', pass);

		if(pass == 0){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					group: $scope.group,
					role: $scope.role,
					arn: $scope.arn,
					AMI: $scope.AMI,
					application_name: $scope.application_name,
					deployment_group: $scope.deployment_group,
					instance_type: $scope.instance_type,
					node_modules: $scope.node_modules,
					revision_type: $scope.revision_type,
					github_project_commit_id: $scope.github_project_commit_id,
					github_project_path: $scope.github_project_path,
					s3_project_bucket: $scope.s3_project_bucket,
					s3_project_key: $scope.s3_project_key,
					s3_project_bundle_type: $scope.s3_project_bundle_type,
					description: $scope.description
				}

				service.post('api/deployment', data, function(res){
					if(res.error){
						console.log(res);
						$('#save').prop('disabled', false);
					} else {
						$('#save').prop('disabled', false);
						$('#new-deployment').slideUp();
						$('#no-records').hide();

						var date = new Date(res.created_at);
					
						res.created_at = date.toLocaleDateString('en-US') + ' - ' + date.toLocaleTimeString("en-US");

						helper.findAndReplace('deployment', 'deployment_internal_id', $scope, res);

						clear();

						console.log(res);
					}
				});
			});
		} else { 
			$('#save').prop('disabled', false);
		}
	};

	$scope.update = function(){

		$('#save').prop('disabled', true);

		var pass = 0;

		// pass += service.validate($scope.edit.deployment_group, 'edit-deployment-group', 'text', pass);
		// pass += service.validate($scope.edit.node_modules, 'edit-node-modules', 'select', pass);
		// pass += service.validate($scope.edit.revision_type, 'edit-revision-type', 'select', pass);
		// pass += service.validate($scope.edit.tag_version, 'edit-tag-version', 'text', pass);
		// pass += service.validate($scope.edit.description, 'edit-description', 'textarea', pass);

		if(pass == 0){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					role: $scope.selected_role,
					AMI: $scope.selected_AMI,
					application_name: $scope.edit.application_name,
					deployment_group: $scope.edit.deployment_group,
					node_modules: $scope.edit.node_modules,
					revision_type: $scope.edit.revision_type,
					github_project_commit_id: $scope.edit.github_project_commit_id,
					github_project_path: $scope.edit.github_project_path,
					s3_project_path: $scope.edit.s3_project_path,
					description: $scope.edit.description
				}

				service.post('api/deployment', data, function(res){
					if(res.error){
						console.log(res);
						$('#save').prop('disabled', false);
					} else {
						$('#save').prop('disabled', false);
						$('#edit-deployment').slideUp();
						$('#no-records').hide();

						var date = new Date(res.created_at);
					
						res.created_at = date.toLocaleDateString('en-US') + ' - ' + date.toLocaleTimeString("en-US");

						helper.findAndReplace('deployment', 'deployment_group_id', $scope, res);

						clear();
					}
				});
			});
		} else { 
			$('#save').prop('disabled', false);
		}
	};

	$scope.stop = function(deployment){
		storage.find('user', function(token){

			var data = {
				access_token: token.access_token,
				user: window.main.user._id,
				id: deployment._id
			}

			service.post('api/deployment/stop', data, function(res){
				if(res.error){
					console.log(res);
				} else {
					deployment.is_started = false;
					deployment.is_stopped = true;
				}

			});
		});
	};
}