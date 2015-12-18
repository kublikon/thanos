window.app.directive('updateview', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, select, attrs) {
        	scope.$watch(attrs.ngModel, function(){

        		$('#' + attrs.id + ' option').each(function(option){

        			var ngModelGet = $parse(attrs.ngModel);

        			if($(this).attr('value') == ngModelGet(scope)){
        				var self = $(this).attr('view');

        				if(self){
	        				var views = self.split(',');

	        				$('#' + attrs.updateview + ' .hide').hide();

	        				views.forEach(function(view){
	        					$('#' + view.replace(' ', '')).show();
	        				});
	        			} else {
	        				$('#' + attrs.updateview + ' .hide').hide();
	        			}
        			}
					
				});
        	});
        }
    };
});