// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.directives', 'app.factories', 'app.services', 'firebase', 'ngMessages'])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
        url: '/app',
        cache: false,
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })
      .state('app.search', {
        url: '/search',
        views: {
          'menuContent': {
            templateUrl: 'templates/search.html'
          }
        }
      })

      .state('app.main', {
        url: '/main',
        views: {
          'menuContent': {
            templateUrl: 'templates/main-page.html',
            controller: 'MainCtrl'
          }
        }
      })
      .state('app.users', {
        url: '/users',
        views: {
          'menuContent': {
            templateUrl: 'templates/users.html',
            controller: 'UsersCtrl'
          }
        }
      })
      .state('app.useredit', {
        url: '/user/:uid?:option',
        views: {
          'menuContent': {
            templateUrl: 'templates/user.html',
            controller: 'UserCtrl'
          }
        }
      })
      .state('app.usercreate', {
        url: '/user',
        views: {
          'menuContent': {
            templateUrl: 'templates/user.html',
            controller: 'UserCtrl'
          }
        }
      })
      .state('app.biometricos', {
        url: '/biometricos',
        views: {
          'menuContent': {
            templateUrl: 'templates/biometricos-main.html',
            controller: 'BiometricosCtrl'
          }
        }
      })

      .state('app.single', {
        url: '/biometricos/:biometricoId',
        views: {
          'menuContent': {
            templateUrl: 'templates/biometricos.html',
            controller: 'PlaylistCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });
