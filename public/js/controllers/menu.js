function menuCtrl($scope, $routeParams, $rootScope, $location, $http, service, storage, logout){

	var deviceToggle = false;

	storage.check('user', function(login){ 
		if(login){
			$('#sign-in-btn').hide();
			$('#user-profile').show();
			$('#device-sign-in-btn').text('Profile');

			$('#device-stats-btn').show();
			$('#device-users-btn').show();
			$('#device-deployments-btn').show();
			$('#device-settings-btn').show();
			$('#device-log-out-btn').show();
		} else {
			$('#sign-in-btn').show();
			$('#user-profile').hide();
			$('#device-sign-in-btn').text('Sign In');

			$('#device-stats-btn').hide();
			$('#device-users-btn').hide();
			$('#device-deployments-btn').hide();
			$('#device-settings-btn').hide();
			$('#device-log-out-btn').hide();
		}
	});

	// main scroll
	$(window).scroll(function(){
		if($(this).scrollTop() > ($('.b-banner').height() - 63)){
			$('.b-menu').addClass('on');
		} else { 
			$('.b-menu').removeClass('on');
		}

		var top = $(this).scrollTop(),
			base = $('.b-banner').height()/2,
			pos = top + base,
			limited = (pos >= base)? pos : base,
			opacity = (100 - top + 100)/100;

		$('.b-splash').css({ top: limited, opacity: opacity })
	});

	// scroll with menu
	$('.b-main').scroll(function(){
		if($(this).scrollTop() > ($('.b-banner').height() - 63)){
			$('.b-menu').addClass('on');
		} else { 
			$('.b-menu').removeClass('on');
		}

		var top = $(this).scrollTop(),
			base = $('.b-banner').height()/2,
			pos = top + base,
			limited = (pos >= base)? pos : base,
			opacity = (100 - top + 20)/100;

		$('.b-splash').css({ top: limited, opacity: opacity })
	});

	$scope.search = function(text, event){
		if(text.indexOf(',') != -1){
			$('#main-search').removeClass('tag').addClass('list');
			$('#device-search').removeClass('tag').addClass('list');
		} else if(text.indexOf('#') != -1) {
			$('#main-search').removeClass('list').addClass('tag');
			$('#device-search').removeClass('list').addClass('tag');
		} else {
			$('#main-search').removeClass('list').removeClass('tag');
			$('#device-search').removeClass('list').removeClass('tag');
		}

		if(event.keyCode == 13){
			if(text != ''){
				$location.path('search/' + text);

				$('.b-device-menu').slideUp('fast');
				deviceToggle = false;
			}
		}
	};

	$scope.to = function(path, accent){
		$('html, body, .b-main').animate({ scrollTop: 0 }, 'fast');
		window.main.fx.hideLogin();

		$('.t-device-menu').slideUp('fast');
		deviceToggle = false;

		$location.path(path);
	};

	$scope.toggleSection = function(section){
		$('.b-page').hide();
		$('#' + section).fadeIn('fast');

		$('.b-sub-menu a').removeClass('on');
		$('#m-' + section).addClass('on');
	};

	$scope.showLogin = function(){
		storage.check('user', function(login){ 
			if(login){
				$location.path(window.main.user.username_public);
			} else {
				window.main.fx.showLogin();
			}

			$('.t-device-menu').slideUp('fast');
			deviceToggle = false;
		});
	};

	$scope.showDeviceMenu = function(){
		if(deviceToggle){
			$('.t-device-menu').slideUp('fast');
			deviceToggle = false;
		} else {
			$('.t-device-menu').slideDown('fast');
			deviceToggle = true;
		}
	};

	$scope.logout = function(){
		storage.find('user', function(token){
			service.post('api/logout', { access_token: token.access_token }, function(data){
				logout.go();
				
				deviceToggle = false;
			});
		});		
	};

}