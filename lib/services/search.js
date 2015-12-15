/*
-- Service for searching:
-- search
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		helper = require('../utils/helper'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'search service started');

		// search
		app.get('/api/search', function(req, res){

			log('d', 'search');

			if(!check.input(req, res, db, 'post', ['skip', 'limit', 'search', 'type'])){
	    		return false;
	    	}

	    	helper.sort(req.query.filter, req.query.type, req.query.item_type, function(sort, query){

	    		var res_data = {};
	    		
	    		if(req.query.search_type == 'tag'){
	    			find({ tags: req.query.search.replace('#', ''), type: req.query.type });
	    		} else if(req.query.search_type == 'search') {
	    			find({ $text: { $search: req.query.search }, type: req.query.type });
	    		} else if(req.query.search_type == 'list') { 

	    			var search = req.query.search.split(', ');

	    			db.item.find({ name: { $in: search }, type: req.query.type })
	    			.exec(function(err, data){
	    				if(err){
							res.end(check.error('Unable to search', 'search', 225));
						} else {
							var ids = [];

							data.forEach(function(item){
								ids.push(item._id);
							});

							find({ items: { $in: ids } });
						}
	    			});
	    		}

	    		function find(filter){
					db.item.find(filter)
					.sort(sort)
					.skip(req.query.skip)
					.limit(req.query.limit)
					.populate('user')
					.populate('item_type')
					.exec(function(err, data){
						if(err){
							res.end(check.error('Unable to search', 'search', 226));
						} else {
							if(req.query.type == 'post'){
								res_data.posts = helper.updatePaths(data);
							} else if(req.query.type == 'product'){
								res_data.products = helper.updatePaths(data);
							} else if(req.query.type == 'ingredient'){
								if(data.length > 0){
									data.forEach(function(item, index){
										data[index].items = helper.updatePaths(item.items);
									});
								}

								res_data.ingredients = data;
							}

							res.end(check.validate(res_data, 'search'));
						}
					});
				};
			});
	    });

	};

})();