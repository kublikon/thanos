app.factory('helper', function($rootScope, $http, $location, service){
	return {
		filter: function(type, $scope, content, filter, filter_type, cb){
			if(filter_type == 'type'){
				content.skip = 0;
				content.limit = 8;
				content.item_type = filter._id;
				$('.t-filter-con ul li').removeClass('on');
				$scope.filter_types = filter.name;
				$('#filter-' + filter._id).addClass('on');
			} else {
				content.skip = 0;
				content.limit = 8;
				content.filter = filter;
				$('.t-filter > li > ul > li').removeClass('on');
				$scope.filter_sort = filter;
				$('#filter-' + filter).addClass('on');
			}
			
			$('#loading').show();
			$('#no-records').hide();

			$scope[type + 's'] = [];

			service.get('api/' + type + 's', content, function(data){
				if(data.error && data.error.code != 100){
					$location.path('404');
				} else if(data.error && data.error.code == 100){
					$('#no-records').show();
				} else {
					$('#no-records').hide();
					$scope[type +'s'] = data[type +'s'];
				}

				content.skip += 8;

				$('#loading').hide();

				return cb(content);
			});
		},
		bind: function(type, $scope, data, options, type_change){
			$scope[type + 's'] = [];

			if(data.error && data.error.code != 100){
				$location.path('404');
			} else if(data.error && data.error.code == 100 || data[type + 's'].length == 0){
				$('#no-records').show();
			} else {
				$('#no-records').hide();

				if(type_change){
					$scope[type_change + 's'] = data[type + 's'];
				} else {
					$scope[type + 's'] = data[type + 's'];
				}
			}

			if(options){
				Object.keys(options).forEach(function(key){
					$scope[key] = options[key];
				});
			}

			$('#loading').hide();
		},
		logout: function(){
			storage.nuke();
			$location.path('');
			window.main.fx.showLogin();
			window.main.fx.hideSideMenu();

			$('#sign-in-btn').show();
			$('#user-profile').hide();
			$('#device-sign-in-btn').text('Sign In / Up');

			$('#device-lists-btn').hide();
			$('#device-my-posts-btn').hide();
			$('#device-my-products-btn').hide();
			$('#device-my-bundles-btn').hide();
			$('#device-settings-btn').hide();
			$('#device-log-out-btn').hide();

			$('.b-device-menu').slideUp('fast');	
		}
	};
});