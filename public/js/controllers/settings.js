function settingsCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check, image){

	var content = {};

	check.user(false, function(){
		storage.find('user', function(token){

			content.access_token = token.access_token;
			content.user_id = token.id;

			service.get('api/settings', content, function(data){
				bind(data);
			});
		});
	});

	function bind(data){
		$scope.settings = data.settings;
		$scope.splash = {};
		$scope.splash.data = data.settings.profile_s;
	};

	$scope.selectImage = function(file){
		$('#' + file).trigger('click');
	};

	$scope.save = function(settings, splash){

		$('#save').prop('disabled', true);

		var pass = 0;

		pass += service.validate(settings.company_name, 'company-name', 'text', pass);
		pass += service.validate(settings.support_email, 'support-email', 'text', pass);

		if(pass == 0){
			storage.find('user', function(token){
				var data = {
					access_token: token.access_token,
					company_name: settings.company_name,
					support_email: settings.support_email,
					aws_account_id: settings.aws_account_id,
					aws_access_key_id: settings.aws_access_key_id,
					aws_secret_access_key: settings.aws_secret_access_key,
					aws_bucket: settings.aws_bucket,
					aws_region: settings.aws_region,
					aws_logging: settings.aws_logging,
					github_username: settings.github_username,
					github_password: settings.github_password,

					device_name: settings.device_name,
					snapshot_id: settings.snapshot_id,
					volume_type: settings.volume_type,
					min_size: settings.min_size,
					max_size: settings.max_size,
					desired_capacity: settings.desired_capacity
				};

				if($scope.splash.name){
					data.profile_s = image.convertImage('splash', $scope.splash, 120);
					data.profile_m = image.convertImage('splash', $scope.splash, 300);
					data.profile_l = image.convertImage('splash', $scope.splash, 600);
				}

				service.post('api/settings', data, function(res){
					if(res.error){
						console.log(res.error);
					} else if (res.profile) {
						$rootScope.user.profile_m = res.splash;
					} else {
						$rootScope.company = window.main.company = res;
					}
					$('#save').prop('disabled', false);
				});
			});
		} else {
			$('#save').prop('disabled', false);
		}
	};
	
}