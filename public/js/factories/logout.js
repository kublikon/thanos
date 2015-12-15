app.factory('logout', function($rootScope, $http, $location, storage){
	return {
		go: function(){
			storage.nuke();
			$location.path('');
			window.main.fx.showLogin();
			window.main.fx.hideSideMenu();
			window.main.fx.logout();
		}
	};
});