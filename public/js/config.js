window.app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('deployments', {
                url: '/deployments',
                templateUrl: 'views/deployments.html',
                controller: 'deploymentsCtrl'
            })
            .state('deployments.history', {
                url: '/:id',
                views: { 
                    'modal': { 
                        controller: 'historyCtrl',
                        templateUrl: 'views/modal-history.html'
                    }
                }
            })
            .state('deployments.delete', {
                url: '/:name/:application/:id',
                views: { 
                    'modal': { 
                        controller: 'deleteDeploymentCtrl',
                        templateUrl: 'views/modal-delete-deployment.html'
                    }
                }
            })
            .state('applications', {
                url: '/applications',
                templateUrl: 'views/applications.html',
                controller: 'applicationsCtrl'
            })
            .state('applications.delete', {
                url: '/:id',
                views: { 
                    'modal': { 
                        controller: 'deleteCtrl',
                        templateUrl: 'views/modal-delete.html'
                    }
                }
            })
            .state('users', {
                url: '/users',
                templateUrl: 'views/users.html',
                controller: 'usersCtrl'
            })
            .state('compare', {
                url: '/compare',
                templateUrl: 'views/compare.html',
                controller: 'compareCtrl'
            })
            .state('settings', {
                url: '/settings',
                templateUrl: 'views/settings.html',
                controller: 'settingsCtrl'
            })
            .state('privacy', {
                url: '/privacy',
                templateUrl: 'views/privacy.html',
                controller: 'privacyCtrl'
            })
            .state('terms', {
                url: '/terms',
                templateUrl: 'views/terms.html',
                controller: 'termsCtrl'
            })
            .state('404', {
                url: '/404',
                templateUrl: 'views/404.html',
                controller: 'noneCtrl'
            })
            .state('profile', {
                url: '/:username',
                templateUrl: 'views/profile.html',
                controller: 'profileCtrl'
            })
    }
]);