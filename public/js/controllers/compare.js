function compareCtrl ($scope, $routeParams, $rootScope, $location, $http, service, storage, like, helper, check, utils){

	check.user(false);

	// search highlight
	$('#search-input').focusin(function(){
		$('.b-search').addClass('on');
	});

	$('#search-input').focusout(function(){
		$('.b-search').removeClass('on');
	});

	$scope.compare = function(){

		$('#loading').show();
		$('#compare').hide();

		storage.find('user', function(token){
			
			var data = {
				access_token: token.access_token,
				user_id: token.id,
				compare_1: $scope.deployment_id_1, 
				compare_2: $scope.deployment_id_2
			};

			service.get('api/deployments/compare', data, function(res){
				if(res.error && res.error.code == 100){
					$('#no-records').show();
				} else {
					$('#no-records').hide();
					$('#compare').show();

					$scope.compare_1 = JSON.stringify(res.compare_1, null, '    ');
					$scope.compare_2 = JSON.stringify(res.compare_2, null, '    ');
				}

				$('#loading').hide();
			});
		});	
	};

	$('.t-code').scroll(function(e){
		$('.t-code').scrollLeft($(this).scrollLeft());
	});
}