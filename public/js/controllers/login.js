function loginCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage){

	$scope.enterLogin = function(event){
        if(event.keyCode == 13){
            $scope.loginUser();
        }
    };

    $scope.login = {};

	$scope.loginUser = function(){
		if($scope.login.username == ''){

		} else if($scope.login.password == ''){

		} else {
			var items = { 
				username: $scope.login.username, 
				password: $scope.login.password 
			}

			service.get('api/login', items, function(data){
				if(data.error){
					$scope.login.login = data;
				} else { 
					// store user
					storage.save({ access_token: data.access_token, id: data.user._id });
					$rootScope.user = window.main.user = data.user;

					// cleanup
					$('input').blur();

					$scope.login.username = '';
					$scope.login.password = '';

					$scope.login.login = undefined;
					$scope.login.create = undefined;

					$('#sign-in-btn').hide();
					$('#user-profile').show();
					$('#device-sign-in-btn').text('Profile');

					$('#device-stats-btn').show();
					$('#device-users-btn').show();
					$('#device-deployments-btn').show();
					$('#device-settings-btn').show();
					$('#device-log-out-btn').show();

					// transition
					window.main.fx.hideLogin();

					$location.path('stats');
				}
			});
		}
	};

	$scope.createUser = function(){
		if($scope.login.new_password === $scope.login.confirm_password){
			var items = {
				first_name: $scope.login.first_name,
				last_name: $scope.login.last_name,
				email: $scope.login.email,
				password: $scope.login.new_password
			}

			service.post('api/user', items, function(data){
				if(data.error){
					$scope.login.create = data;
				} else {
					$scope.login.create = data;
				}
			});
		} else {
			console.log('password missmatch');
		}
	};

	$scope.forgotNevermind = function(){
		window.main.fx.forgotNevermind();

		$scope.login.login = undefined;
		$scope.login.create = undefined;
	};

	$scope.forgot = function(){
		window.main.fx.forgot();

		$scope.login.login = undefined;
		$scope.login.create = undefined;
	};

	$scope.signUpNevermind = function(){
		window.main.fx.signUpNevermind();

		$scope.login.login = undefined;
		$scope.login.create = undefined;
	};

	$scope.noAccount = function(){
		window.main.fx.noAccount();

		$scope.login.login = undefined;
		$scope.login.create = undefined;
	};

}