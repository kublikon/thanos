app.factory('like', function($rootScope, $location, $http, service, storage){
	return {
		like: function(object, type, cb){
			storage.find('user', function(login){

				if(login){
					// check user
					if(!window.main.user){
						storage.find('user', function(user){
							service.get('api/user', user, function(user){

								$rootScope.user = window.main.user = user;
								callService();
							});
						});
					} else {
						callService();
					}
				} else {
					window.main.fx.showLogin();
				}

				function callService(){

					service.post('like', { 
						access_token: login.access_token,
						user_id: window.main.user._id,
						object_id: object._id,
						type: type
					}, function(like){
						if(like.error){
							console.log(like);

							return cb(false);
						} else { 
							if(like.object_id){
								return cb(like);
							} else {
								return cb(like);
							}
						}
					});
				}
			});
		}
	};
});