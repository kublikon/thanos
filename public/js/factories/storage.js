app.factory('storage', function($rootScope){

	var lawnchair = new Lawnchair({name: 'thanos', adapter: "dom"}, function(){});

	return {
		save: function(data){
			data.key = 'user';

			lawnchair.save(data);
		},
		check: function(key, cb){
			lawnchair.exists(key, function(test){
				cb(test);
			});
		},
		find: function(key, cb){
			lawnchair.get(key, function(data){
				cb(data);
			});
		},
		clear: function(key){
			lawnchair.remove(key);
		},
		nuke: function(key){
			lawnchair.nuke();
		}
	};
});