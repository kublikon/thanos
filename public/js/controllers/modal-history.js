function historyCtrl ($scope, $stateParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	var content = { id: $stateParams.id };

	console.log(content);

	check.user(false, function(){
		storage.find('user', function(token){
			
			content.access_token = token.access_token;
			content.user_id = token.id;

			$scope.deployments = [];

			service.get('api/deployment', content, function(data){
				data.deployments.safeForEach(function(deployment, index){
					var date = new Date(deployment.created_at);
					
					data.deployments[index].created_at = date.toLocaleDateString('en-US') + ' - ' + date.toLocaleTimeString("en-US");
				});

				$scope.name = data.deployments[0].deployment_group;

				helper.bind('deployment', $scope, data, undefined, undefined, true);
			});
		});	
	});

	$scope.openEditDeployment = function(deployment){

		$scope.$parent.edit = deployment;
		
		$location.path('/deployments');

		$('#new-deployment').slideUp();
		$('#edit-deployment').slideDown();
		$('html, body, .t-main').animate({ scrollTop: 0 }, 'fast');
	};

	$scope.close = function(){
		$location.path('/deployments');
	};

}