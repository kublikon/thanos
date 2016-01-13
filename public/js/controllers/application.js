function applicationsCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check){

	var content = { skip: 0, limit: 8 };

	$scope.filter_sort = 'All';

	check.user(false, function(){
		storage.find('user', function(token){
			
			content.access_token = token.access_token,
			content.user_id = token.id

			service.get('api/applications', content, function(data){
				helper.bind('application', $scope, data);

				content.skip += 8;
			});
		});	
	});

	function clear(){
		service.clearValidation();

		$('#new-application').slideUp();
		$('#edit-application').slideUp();

		$scope.application_name = '';
	};

	// search highlight
	$('#search-input').focusin(function(){
		$('.b-search').addClass('on');
	});

	$('#search-input').focusout(function(){
		$('.b-search').removeClass('on');
	});

	$scope.openNewApplication = function(){
		$('#edit-application').slideUp();
		$('#new-application').slideDown();
		$('html, body, .t-main').animate({ scrollTop: 0 }, 'fast');
	};

	$scope.openEditApplication = function(application){

		$scope.edit = {};
		$scope.edit.application_name = application;
		$scope.edit.application_name_new = application;

		$('#new-application').slideUp();
		$('#edit-application').slideDown();
		$('html, body, .t-main').animate({ scrollTop: 0 }, 'fast');
	};

	$scope.activateUser = function(user){
		storage.find('user', function(token){
			var data = {
				access_token: token.access_token,
				user_id: token.id,
				id: user._id
			}

			service.post('api/activate', data, function(res){
				if(res.error){
					$location.path('404');
				} else {
					user.auth.is_active = true;
				}
			});
		});
	};

	$scope.deactivateUser = function(user){
		storage.find('user', function(token){
			var data = {
				access_token: token.access_token,
				user_id: token.id,
				id: user._id
			}

			service.post('api/deactivate', data, function(res){
				if(res.error){
					$location.path('404');
				} else {
					user.auth.is_active = false;
				}
			});
		});
	};

	$scope.openUser = function(username){
		$location.path('/' + username);
	};

	$scope.getMoreUsers = function(){
		service.get('api/users', content, function(data){
			if(!data.error){
				$scope.users = $scope.users.concat(data.users);

				content.skip += 8;

				$('html, body, .t-main').animate({ scrollTop: $('.t-footer').position().top }, 500);
			}
		});
	};

	$scope.filter = function(filter, type){
		helper.filter('post', $scope, content, filter, type, function(data){
			content = data;
		});
	};

	$scope.save = function(){

		$('#save').prop('disabled', true);

		var pass = 0;

		pass += service.validate($scope.application_name, 'application-name', 'text', pass);

		if(pass == 0){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					application_name: $scope.application_name
				}

				service.post('api/application', data, function(res){
					if(res.error){
						console.log(res);
						$('#save').prop('disabled', false);
					} else {
						$('#save').prop('disabled', false);
						$('#new-application').slideUp();
						$('#no-records').hide();

						$scope.applications.push(res.application);

						clear();
					}
				});
			});
		} else { 
			$('#save').prop('disabled', false);
		}
	};

	$scope.update = function(){

		$('#update').prop('disabled', true);

		var pass = 0;

		pass += service.validate($scope.edit.application_name_new, 'edit-application-name', 'text', pass);

		if(pass == 0){
			storage.find('user', function(token){

				var data = {
					access_token: token.access_token,
					user: window.main.user._id,
					application_name: $scope.edit.application_name,
					application_name_new: $scope.edit.application_name_new
				}

				service.post('api/application/update', data, function(res){
					if(res.error){
						console.log(res);
						$('#update').prop('disabled', false);
					} else {
						$('#update').prop('disabled', false);
						$('#edit-application').slideUp();
						$('#no-records').hide();
					
						$scope.applications.safeForEach(function(item, index){
							if(item == res.application.application_name){
								$scope.applications[index] = res.application.application_name_new;
							}
						});

						clear();
					}
				});
			});
		} else { 
			$('#update').prop('disabled', false);
		}
	};

	$scope.delete = function(application){
		storage.find('user', function(token){

			var data = {
				access_token: token.access_token,
				user: window.main.user._id,
				application_name: application
			}

			service.post('api/application/remove', data, function(res){
				if(res.error){
					console.log(res);
				} else {	
					$scope.applications.splice($scope.applications.indexOf(application), 1);
				}
			});
		});
	};

	$scope.cancel = function(){
		clear();
	};
}