function deploymentsCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	var content = { skip: 0, limit: 8 };

	$scope.filter_sort = 'All';

	check.user(false, function(){
		storage.find('user', function(token){
			
			content.access_token = token.access_token,
			content.user_id = token.id

			service.get('api/deployments', content, function(data){

				data.deployments.safeForEach(function(deployment, index){
					var date = new Date(deployment.created_at);
					
					data.deployments[index].created_at = date.toLocaleDateString("en-US");
				});

				helper.bind('deployment', $scope, data);

				content.skip += 8;
			});
		});	
	});

	function clear(){
		service.clearValidation();

		$('#new-deployment').slideUp();
		$('#edit-deployment').slideUp();

		$scope.deployment_group = '';
		$scope.tag_version = '';
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

	$scope.getMoreUsers = function(){
		service.get('api/users', content, function(data){
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

		pass += service.validate($scope.deployment_group, 'deployment_group', 'text', pass);
		pass += service.validate($scope.tag_version, 'tag-version', 'text', pass);
		pass += service.validate($scope.description, 'description', 'textarea', pass);

		if(pass == 0){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					deployment_group: $scope.deployment_group,
					tag_version: $scope.tag_version,
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
					
						res.created_at = date.toLocaleDateString("en-US");

						$scope.deployments.push(res);
						clear();
					}
				});
			});
		} else { 
			$('#save').prop('disabled', false);
		}
	};
}