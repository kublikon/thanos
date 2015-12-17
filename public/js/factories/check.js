app.factory('check', function($rootScope, storage, service, logout){

	var lawnchair = new Lawnchair({name: 'thanos', adapter: "dom"}, function(){});

	return {
		user: function(passive, cb){

			// check login
			storage.check('user', function(login){ 
				if(login){
					if(!window.main.user){
						storage.find('user', function(user){
							service.get('api/user', user, function(res){

								$rootScope.user = window.main.user = res.user;
								$rootScope.company = window.main.company = res.company;
								if(cb){
									return cb();
								}
							});
						});
					} else {
						if(cb){
							return cb();
						}
					}
				} else {
					if(passive){
						if(cb){
							return cb();
						}
					} else {
						logout.go();
					}
				}
			});
		}
	};
});