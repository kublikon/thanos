/*
-- Service for likes:
-- like/unlike
*/

(function(){

	var log = require('../console'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security');

	module.exports = function(app){

		log('i', 'likes service started');

		app.post('/like', function(req, res){

			log('d', 'like');

			security.auth(req, res, db, 'all', function(){

				if(!check.input(req, res, db, 'like', ['user_id', 'object_id', 'type'])){
		    		return false;
		    	}

				db.like.findOne({ user: req.body.user_id, object_id: req.body.object_id })
				.exec(function(err, like){
					if(err){
						res.end(check.error('Like failed', 'like', 161));
					} else { 
						if (like) {
							removeLike();
						} else { 
							addLike();
						}
					}
				});

				function addLike(){
					var like = new db.like({
						user: req.body.user_id,
						object_id: req.body.object_id,
						date: new Date()
					});

					log('w', req.body.object_id);

					like.save(function(err, like){
						if(err){
							res.end(check.error('Like failed', 'like', 162));
						} else {
							db.item.findOne({ _id: req.body.object_id, type: req.body.type })
							.exec(function(err, data){
								if(err){
									res.end(check.error('Like failed', 'like', 163));
								} else { 
									data.likes.push(like._id);

									data.save(function(err){
										if(err) {
											res.end(check.error('Like failed', 'like', 164));
										} else {
											res.end(check.validate({ is_liked: true, like: like._id }, 'like'));
										}
									});
								}
							});
						}
					});
				};

				function removeLike(){
					db.like.remove({ user: req.body.user_id, object_id: req.body.object_id }, function(err, like){
						if(err){
							res.end(check.error('Like failed', 'like', 171));
						} else {
							db.item.findOne({ _id: req.body.object_id, type: req.body.type })
							.exec(function(err, data){
								if(err){
									res.end(check.error('Like failed', 'like', 172));
								} else { 
									data.likes.splice(like._id, 1);

									data.save(function(err){
										if(err) {
											res.end(check.error('Like failed', 'like', 173));
										} else {
											res.end(check.validate({ is_liked: false, like: like._id }, 'like'));
										}
									});
								}
							});
						}
					});
				};
			});
	    });
	};

})();