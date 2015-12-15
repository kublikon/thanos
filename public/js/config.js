window.app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('stats', {
              url: "/",
              templateUrl: "views/stats.html",
              controller: "statsCtrl"
            })
            .state('users', {
              url: "/users",
              templateUrl: "views/users.html",
              controller: "usersCtrl"
            })
            .state('deployments', {
              url: "/deployments",
              templateUrl: "views/deployments.html",
              controller: "deploymentsCtrl"
            })
            .state('settings', {
              url: "/settings",
              templateUrl: "views/settings.html",
              controller: "settingsCtrl"
            })
            .state('privacy', {
              url: "/privacy",
              templateUrl: "views/privacy.html",
              controller: "privacyCtrl"
            })
            .state('terms', {
              url: "/terms",
              templateUrl: "views/terms.html",
              controller: "termsCtrl"
            })
            .state('404', {
              url: "/404",
              templateUrl: "views/404.html",
              controller: "noneCtrl"
            })
            .state('profile', {
              url: "/:username",
              templateUrl: "views/profile.html",
              controller: "profileCtrl"
            })
    }
]);