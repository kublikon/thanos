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
        db = require('./lib/database'),

        checkS3 = require('./lib/check-s3'),
        
        auth = require('./lib/services/auth'),
        user = require('./lib/services/user'),
        applications = require('./lib/services/applications'),
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
        
    db.setting.findOne({ setting_id: 1 })
    .exec(function(err, data){
        if(err){
            log('e', 'unable to configure AWS');
        } else {
            aws.config.update({ 
                "accessKeyId": data.aws_access_key_id,
                "secretAccessKey": data.aws_secret_access_key,
                "region": data.aws_region,
                "apiVersions": { "s3": '2006-03-01' }
            });

            config.settings = data;

            app.s3 = new aws.S3();
            app.iam = new aws.IAM({apiVersion: '2010-05-08'}),
            app.ec2 = new aws.EC2({apiVersion: '2015-10-01', region: 'us-east-1'}),
            app.codeDeploy = new aws.CodeDeploy({apiVersion: '2014-10-06', region: 'us-east-1'}),
            app.autoScaling = new aws.AutoScaling({apiVersion: '2011-01-01', region: 'us-east-1'}),
            app.elb = new aws.ELB({apiVersion: '2012-06-01', region: 'us-east-1'});

            // check thanos S3 bucket
            checkS3(app);
        }
    });

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
    applications(app);
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