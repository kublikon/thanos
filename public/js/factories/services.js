app.factory('service', function($rootScope, $http, $location, logout){
	return {
		get: function(path, data, cb){
			var id = (data.id)? '/' + data.id : '';

			$http.get(window.main.domain + '/' + path + id, { params: data })
			.success(function(ret){
				if(ret.error && ret.error.code == 403){
					logout.go();
				} else {
					cb(ret);
				}
			})
			.error(function(ret){
				console.log('error', ret);
			});
		},
		post: function(path, data, cb){
			$http.post(window.main.domain + '/' + path, data)
			.success(function(ret){
				if(ret.error && ret.error.code == 403){
					logout.go();
				} else {
					cb(ret);
				}
			})
			.error(function(ret){
				console.log('error', ret);
			});
		},
		delete: function(path, data, cb){
			$http.delete(window.main.domain + '/' + path, data)
			.success(function(ret){
				if(ret.error && ret.error.code == 403){
					logout.go();
				} else {
					cb(ret);
				}
			})
			.error(function(ret){
				console.log('error', ret);
			});
		},
		validate: function(model, id, type){
			if(!model || model == ' ' || model.length == 0){				
				if($('#missing-' + id).length == 0){
					var item = $('#' + id),
						position = $('#' + id).position();
					
					item.addClass('t-required');

					if(type == 'img'){
						position.left = position.left + 50;
						position.top = position.top + 20;
					} else if(type == 'text'){
						position.left = position.left + 345;
						position.top = position.top + 10;
					} else if(type == 'select'){
						position.left = position.left + 320;
						position.top = position.top + 10;
					} else if(type == 'textarea'){
						position.left = position.left + 345;
						position.top = position.top + 25;
					}
					
					$('#' + id).after('<span style="left:' + position.left + 'px; top:' + position.top + 'px;" class="t-missing" id="missing-' + id + '">missing</span>');
				}

				return 1;
			} else {
				$('#' + id).removeClass('t-required');
				$('#missing-' + id).remove();

				return 0;
			}
		},
		clearValidation: function(){
			$('.t-required').removeClass('t-required');
			$('.t-missing').remove();
		}
	};
});