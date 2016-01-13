function deleteCtrl ($scope, $stateParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	var content = { id: $stateParams.id };

	check.user(false, function(){
		$scope.name = content.id;
	});

	$scope.close = function(){
		$location.path('/applications');
	};

	$scope.verify = function(){
		if($scope.application_name == content.id){
			$('#delete').prop('disabled', false).removeClass('off');
		} else {
			$('#delete').prop('disabled', true).addClass('off');
		}
	};

	$scope.delete = function(){
		if($scope.application_name == content.id){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					application_name: content.id
				}

				service.post('api/application/remove', data, function(res){
					if(res.error){
						console.log(res);
					} else {
						$scope.$parent.applications.splice($scope.$parent.applications.indexOf(content.id), 1);

						$location.path('/applications');
					}
				});
			});
		}
	};

}