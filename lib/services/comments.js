/*
-- Service for comments:
-- item comment
*/

(function(){

	var log = require('../console'),
		config = require('../config'),
		db = require('../database'),
		check = require('../utils/check'),
		security = require('../utils/security'),
		session = require('../utils/session'),
		uuid = require('node-uuid');

	module.exports = function(app){

		log('i', 'comments service started');

	    // item comment
	    app.post('/api/comment/:type', function(req, res){

	    	log('d', 'post comment');

	    	security.auth(req, res, db, 'all', function(){

	    		if(!check.input(req, res, db, 'comment', ['user_id', 'item_id', 'text'])){
		    		return false;
		    	}

		    	var comment = new db.comment({
		    		user: req.body.user_id,
					object_id: req.body.object_id,
					text: req.body.text,
					created_at: new Date()
		    	});

		    	comment.save(function(err, data){
		    		if(err){
		    			res.end(check.error('Comment failed', 'comment', 122));
		    		} else {
		    			comment.populate('user', function(err, data){
		    				if(err){
		    					res.end(check.error('Comment failed', 'comment', 123));
		    				} else { 
		    					db.item.findOne({ _id: req.body.item_id, type: req.params.type }, function(err, item){
				    				if(err){
				    					res.end(check.error('Comment failed', 'comment', 124));
				    				} else {
				    					item.comments.push(data._id);
				    					item.save(function(err){
				    						if(err){
				    							res.end(check.error('Comment failed', 'comment', 125));
				    						} else {
				    							res.end(check.validate(data, 'comment'));
				    						}
				    					});
				    				}
				    			});
		    				}
		    			});
		    		}
		    	});
	    	});
	    });
	};

})();