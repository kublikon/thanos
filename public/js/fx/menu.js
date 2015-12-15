(function($, fx){

	fx.showSideMenu = function(){
		$('body').addClass('b-side-menu-on');
	};

	fx.hideSideMenu = function(){
		$('body').removeClass('b-side-menu-on');
	};

})($, window.main.fx);