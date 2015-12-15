/*
-- This module compresses the files based on the config mode.
*/

(function(){ 

	var log = require('./console'),
		config = require('./config'),
		minify = require('node-minify'),
		fs = require('fs'),
		path = 'public/js/main.min.js';

	module.exports = function(assetCache, res){

		function clean(){
            fs.writeFile(path, '', function(err){
                if(err){
                    log('d', 'Unable to clean compressed file');
                } else {
                    compress();
                } 
            });
        };

        function compress(){
            var paths = [];

            assetCache.scripts.forEach(function(js_path){
                paths.push('public/' + js_path);
            });

            new minify.minify({
                type: 'uglifyjs',
                fileIn: paths,
                fileOut: path,
                callback: function(err, min){
                    if(err){
                        log('e', 'unable to compress files');
                    } else {
                        assetCache.scripts = ['js/main.min.js'];
                        res.render('index', assetCache);
                    }
                }
            });
        };

        if(config.mode === 'prod'){
            clean();          
        } else {
            res.render('index', assetCache);
        }
	};

})();