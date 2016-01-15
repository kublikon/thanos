function deleteDeploymentCtrl ($scope, $stateParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	var content = { name: $stateParams.name, application: $stateParams.application, id: $stateParams.id };

	check.user(false, function(){
		$scope.name = content.name;
		$scope.id = content.id;
	});

	$scope.close = function(){
		$location.path('/deployments');
	};

	$scope.verify = function(){
		if($scope.deployment_group == content.name){
			$('#delete').prop('disabled', false).removeClass('off');
		} else {
			$('#delete').prop('disabled', true).addClass('off');
		}
	};

	$scope.delete = function(){
		if($scope.deployment_group == content.name){

			$('#delete').prop('disabled', true);

			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					application_name: content.application,
					deployment_group: content.name,
					deployment_internal_id: content.id
				}

				service.post('api/deployment/remove', data, function(res){
					if(res.error){
						console.log(res);
					} else {
						var index = $scope.$parent.deployments.map(function(e) { return e.deployment_internal_id3; }).indexOf(content.id);

						$scope.$parent.deployments.splice(index, 1);

						$location.path('/deployments');
					}
				});
			});
		}
	};

}