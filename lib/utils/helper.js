/*
-- Helper service for mongo and REST.
-- sort -
-- addStats -
-- removeStats -
-- addViews -
-- uploadSplashes -
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('./check'),
		uuid = require('node-uuid');

	module.exports = {
		sort: function(filter, type, item_type, cb){
			var sort = { created_at: -1 },
	    		query = {};

	    	if(filter == 'recent'){
	    		sort = { created_at: -1 };
	    	} else if(filter == 'popular') {
	    		sort = { views: -1 };
	    	} else if (filter == 'liked') {
	    		sort = { likes: -1 };
	    	}

	    	if(type){
	    		query.type = type;
	    	}

	    	if(item_type){
	    		query.item_type = item_type;
	    	}

	    	return cb(sort, query);
		},
		addStats: function(res, type, res_data, cb){
			db.app_stats.findOne({ _id: config.app_stats_id }, function(err, data){
				if(err){
					res.end(check.error('Unable to read stats', type, 211));
				} else {
					if(type === 'post'){
						data.posts_count++;
					} else if(type === 'product'){
						data.products_count++;
					} else if(type === 'ingredient'){
						data.ingredients_count++;
					} else if(type === 'bundle'){
						data.bundles_count++;
					}
					
					data.save(function(err){
						if(err){
							res.end(check.error('Unable to update stats', type, 212));
						} else {
							if(cb){
								return cb(res_data);
							} else {
								res.end(check.validate(res_data, type));
							}
						}
					});
				}
			});
		},
		removeStats: function(res, type, res_data, cb){
			db.app_stats.findOne({ _id: config.app_stats_id }, function(err, data){
				if(err){
					res.end(check.error('Unable to read stats', type, 116));
				} else {
					if(type === 'post'){
						data.posts_count--;
					} else if(type === 'product'){
						data.products_count--;
					} else if(type === 'ingredient'){
						data.ingredients_count--;
					} else if(type === 'bundle'){
						data.bundles_count--;
					}

					data.save(function(err){
						if(err){
							res.end(check.error('Unable to update stats', type, 117));
						} else {
							if(cb){
								return cb(res_data);
							} else {
								res.end(check.log(type + ' removed', type));
							}
						}
					});
				}
			});
		},
		addViews: function(res, type, res_data, cb){
			db.app_stats.findOne({ _id: config.app_stats_id }, function(err, data){
				if(err){
					res.end(check.error('Unable to read stats', type, 216));
				} else {
					if(type === 'post'){ 
						data.total_post_views_count++;
					} else if(type === 'product'){
						data.total_product_views_count++;
					} else if(type === 'ingredient'){
						data.total_ingredient_views_count++;
					} else if(type === 'bundle'){
						data.total_bundle_views_count++;
					}
					
					data.total_views_count++;
					
					data.save(function(err){
						if(err){
							res.end(check.error('Unable to update stats', type, 217));
						} else {
							if(cb){
								return cb(res_data);
							} else {
								res.end(check.validate(res_data.views, type));
							}
						}
					});
				}
			});
		},
		uploadSplashes: function(app, res, type, splashes, cb){

			var load_count = splashes.length,
				id = uuid.v1(),
				splash_paths = [];

			splashes.forEach(function(splash){
				var file = uuid.v1();

				pushToS3(splash.s, file + '_s', function(path_s){
	        		pushToS3(splash.m, file + '_m', function(path_m){
	        			pushToS3(splash.l, file + '_l', function(path_l){
	        				splash_paths.push({ s: path_s, m: path_m, l: path_l });

	        				load_count--;
	        				
	        				if(load_count == 0){
			        			return cb(splash_paths);
			        		}
	        			});
	        		});
	        	});
			});

			function pushToS3(splash, file_id, callback){
				var path = type + '/' + id + '/' + file_id + '.' + splash.extension;

		    	try {
	                app.s3.putObject({
	                    Bucket: config.aws_bucket,
	                    Key: path,
	                    Body: new Buffer(splash.data.slice(22), "base64"),
	                    ContentType: 'image/' + splash.extension,
	                    ACL: 'public-read'
	                }, function(err, data){
	                    if(err){
	                        res.end(check.error(err, 'splash', 186));
	                    } else {
	                    	return callback(path);
	                    }
	                });
	            } catch (err) {
	                res.end(check.error(err, 'splash', 187));
	            }
	        };
		},
		updateListPaths: function(list){
			var ret = list;

			if(list.list_items.length > 0){
				list.list_items.forEach(function(list_item, index){
					if(list_item.type == 'product'){ 
						if(list_item.item.splashes.length > 0){
							var splashes = [];

							list_item.item.splashes.forEach(function(splash){
								var path = {};

								if(!splash.s.match(/http/g)){
									path.s = config.aws_s3_domain + '/' + splash.s;
									path.m = config.aws_s3_domain + '/' + splash.m;
									path.l = config.aws_s3_domain + '/' + splash.l;

								} else {
									path.s = splash.s;
									path.m = splash.m;
									path.l = splash.l;
								}

								splashes.push(path);
							});

							ret.list_items[index].item.splashes = splashes;
						}
					} else {
						if(list_item.sub_items.length > 0){
							list_item.sub_items.forEach(function(sub_item, index_2){
								if(sub_item.item.splashes.length > 0){
									var splashes = [];

									sub_item.item.splashes.forEach(function(splash){
										var path = {};

										if(!splash.s.match(/http/g)){
											path.s = config.aws_s3_domain + '/' + splash.s;
											path.m = config.aws_s3_domain + '/' + splash.m;
											path.l = config.aws_s3_domain + '/' + splash.l;

										} else {
											path.s = splash.s;
											path.m = splash.m;
											path.l = splash.l;
										}

										splashes.push(path);
									});
									ret.list_items[index].sub_items[index_2].item.splashes = splashes;
								}
							});
						}
					}
				});
			}

			return ret;
		},
		updatePaths: function(items){
			var ret = items;

			if(items.length > 0){
				items.forEach(function(item, index){
					if(item.splashes.length > 0){
						var splashes = [];

						item.splashes.forEach(function(splash){
							var path = {};

							if(!splash.s.match(/http/g)){
								path.s = config.aws_s3_domain + '/' + splash.s;
								path.m = config.aws_s3_domain + '/' + splash.m;
								path.l = config.aws_s3_domain + '/' + splash.l;

							} else {
								path.s = splash.s;
								path.m = splash.m;
								path.l = splash.l;
							}

							splashes.push(path);
						});

						ret[index].splashes = splashes;
					}
				});
			}

			return ret;
		},
		updatePath: function(item){
			var ret = item,
				splashes = [];

			if(item.splashes.length > 0){
				item.splashes.forEach(function(splash){
					var path = {};
							
					if(!splash.s.match(/http/g)){
						path.s = config.aws_s3_domain + '/' + splash.s;
						path.m = config.aws_s3_domain + '/' + splash.m;
						path.l = config.aws_s3_domain + '/' + splash.l;
					} else {
						path.s = splash.s;
						path.m = splash.m;
						path.l = splash.l;
					}

					splashes.push(path);
				});

				ret.splashes = splashes;
			}

			return ret;
		}
	};

})();