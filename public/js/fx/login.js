(function($, fx){

	fx.hideLogin = function(){
		$('.t-login-con').removeClass('on');
		$('#t-view').fadeIn('fast');
		$('.t-login .t-box').fadeOut('fast');
	};

	fx.hideUserCreate = function(){
		
	};

	fx.showLogin = function(){
		$('.t-login-con').addClass('on');
		$('#t-view').fadeOut('fast');

		$('.t-sign-up').fadeOut('fast');
		$('.t-forgot').fadeOut('fast');
		$('.t-login').fadeIn();
		$('.t-login .t-box').fadeIn();
	};

	fx.forgotNevermind = function(){
		$('.t-forgot').fadeOut('fast');
  		$('.t-login').fadeIn('fast');
	};

	fx.forgot = function(){
		$('.t-login').fadeOut('fast');
  		$('.t-forgot').fadeIn('fast');
	};

	fx.signUpNevermind = function(){
		$('.t-sign-up').fadeOut('fast');
  		$('.t-login').fadeIn('fast');
	};

	fx.noAccount = function(){
		$('.t-login').fadeOut('fast');
  		$('.t-sign-up').fadeIn('fast');
	};

	fx.logout = function(){
		$('#sign-in-btn').show();
		$('#user-profile').hide();
		$('#device-sign-in-btn').text('Sign In');

		$('#device-lists-btn').hide();
		$('#device-my-posts-btn').hide();
		$('#device-my-products-btn').hide();
		$('#device-my-bundles-btn').hide();
		$('#device-settings-btn').hide();
		$('#device-log-out-btn').hide();

		$('.t-device-menu').slideUp('fast');
	};

})($, window.main.fx);