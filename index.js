(function(){

    var log = require('./lib/console'),
        config = require('./lib/config'),
        lessMiddleware = require('less-middleware'),
        connect = require('connect'),
        express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        bodyParser = require('body-parser'),
        path = require('path'),
        files = require('./lib/files'),
        compress = require('./lib/compress'),
        bootstrap = require('kuba-bootstrap'),
        bootstrapPath = path.join(__dirname, 'node_modules', 'kuba-bootstrap'),
        aws = require('aws-sdk'),
        
        auth = require('./lib/services/auth'),
        user = require('./lib/services/user'),
        deployments = require('./lib/services/deployments'),
        likes = require('./lib/services/likes'),
        comments = require('./lib/services/comments'),
        profile = require('./lib/services/profile'),
        settings = require('./lib/services/settings'),
        search = require('./lib/services/search'), 

        assetCache = {};

    log('i', config.title + ' started on port ' + config.port + ' in ' + config.mode + ' mode');

    server.listen(config.port);

    app.use(bodyParser.json({limit: '5mb'}));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(lessMiddleware(__dirname + '/public/less', {
        dest: __dirname + '/public',
        preprocess: {
            path: function(pathname, req) {
                return pathname.replace(path.sep + 'css' + path.sep, path.sep);
            }
        }
    }));
    app.use(express.static(__dirname + '/public'));
        
    aws.config.update({ 
        "accessKeyId": config.aws_access_key_id,
        "secretAccessKey": config.aws_secret_access_key,
        "region": config.aws_region || "us-west-1",
        "apiVersions": { "s3": '2006-03-01' }
    });

    app.s3 = new aws.S3();

    function loadAssetList(res){

        assetCache = {
            css: [
                // css - must be static
                'css/ka-icons.css',
                'css/kb-all-stripped.css',
                'css/base.css'
            ]
        };

        // title
        assetCache['title'] = config.title;
        loadLibs();

        // libs
        function loadLibs(){
            files('js/libs', '.js', function(files){
                assetCache['libs'] = files;
                loadMain();
            });
        };

        // main
        function loadMain(){
            files('js', '.js', function(files){
                assetCache['scripts'] = files;
                loadDirectives();
            });
        };

        // directives
        function loadDirectives(){
            files('js/directives', '.js', function(files){
                assetCache['scripts'] = assetCache['scripts'].concat(files);
                loadFactories();
            });
        };        

        // factories
        function loadFactories(){
            files('js/factories', '.js', function(files){
                assetCache['scripts'] = assetCache['scripts'].concat(files);
                loadFx();
            });
        };

        // fx
        function loadFx(){
            files('js/fx', '.js', function(files){
                assetCache['scripts'] = assetCache['scripts'].concat(files);
                loadControllers();
            });
        };  

        // controllers
        function loadControllers(){
            files('js/controllers', '.js', function(files){
                assetCache['scripts'] = assetCache['scripts'].concat(files);
                compress(assetCache, res);
            });
        };
    };

    // services
    auth(app);
    user(app);
    deployments(app);
    likes(app);
    comments(app);
    profile(app);
    settings(app);
    search(app);

    app.get('*', function(req, res){
        
        if(Object.keys(assetCache).length === 0){
            log('de', 'assets list - read');
            loadAssetList(res);
        } else {
            log('de', 'assets list - cache');
            res.render('index', assetCache);
        }
    });

})();