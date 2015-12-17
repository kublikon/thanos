function profileCtrl ($scope, $stateParams, $rootScope, $location, $http, service, storage, helper, check, image){

	var content = { id: $stateParams.username };

	check.user(false, function(){
		service.get('api/profile', content, function(data){
			bind(data);
		});
	});

	function bind(data){
		$scope.profile = data.profile;
		$scope.splash = {};
		$scope.splash.data = data.profile.profile_m;
	};

	$scope.selectImage = function(file){
		$('#' + file).trigger('click');
	};

	$scope.save = function(profile, splash){

		$('#save').prop('disabled', true);

		var pass = 0;

		pass += service.validate($scope.profile.first_name, 'first-name', 'img', pass);
		pass += service.validate($scope.profile.last_name, 'last-name', 'img', pass);

		if(pass == 0){
			storage.find('user', function(token){
				var data = {
					access_token: token.access_token,
					user: profile
				};

				// if($scope.splash){
				// 	data.profile_s = image.convertImage('splash', $scope.splash, 120);
				// 	data.profile_m = image.convertImage('splash', $scope.splash, 300);
				// 	data.profile_l = image.convertImage('splash', $scope.splash, 600);
				// }

				console.log(profile);

				service.post('api/user/update', data, function(res){
					if(res.error){
						console.log(res.error);
					} else if (res.profile) {
						$rootScope.user.profile_m = res.splash;
					} else {
						console.log(res);
					}
					$('#save').prop('disabled', false);
				});
			});
		} else {
			$('#save').prop('disabled', false);
		}
	};
	
}