function usersCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check){

	var content = { skip: 0, limit: 8 };

	$scope.filter_sort = 'All';

	check.user(false, function(){
		storage.find('user', function(token){
			
			content.access_token = token.access_token,
			content.user_id = token.id

			service.get('api/users', content, function(data){
				helper.bind('user', $scope, data);

				content.skip += 8;
			});
		});	
	});

	// search highlight
	$('#search-input').focusin(function(){
		$('.b-search').addClass('on');
	});

	$('#search-input').focusout(function(){
		$('.b-search').removeClass('on');
	});

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

	$scope.deleteUser = function(user, i){
		storage.find('user', function(token){
			var data = {
				access_token: token.access_token,
				user_id: token.id,
				id: user._id
			}

			service.post('api/user/delete', data, function(res){
				if(res.error){
					$location.path('404');
				} else {
					$scope.users.splice(i, 1);
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
	
}