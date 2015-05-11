/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){

    angular.module('app', ['ui.router','ui.grid','ui.grid.autoResize','ngMaterial',
        'app.services','app.models','angularFileUpload','LocalStorageModule']
    ).config(configure);

    // Configure routes.
    configure.$inject = ['$stateProvider','$urlRouterProvider'];
    function configure($stateProvider,$urlRouterProvider){

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/main");

        $stateProvider.state('main', {
            url: "/main",
            templateUrl:'app/templates/main.html',
            controller:'mainController'
        }).state('users', {
            url: "/users",
            templateUrl:'app/templates/users.html',
            controller:'usersController'
        }).state('roles', {
            url: "/roles",
            templateUrl:'app/templates/roles.html',
            controller:'rolesController'
        }).state('sets', {
            url: "/sets",
            templateUrl:'app/templates/sets.html',
            controller:'setsController'
        }).state('categories', {
            url: "/categories",
            templateUrl:'app/templates/categories.html',
            controller:'categoriesController'
        }).state('saleItems', {
            url: "/saleItems",
            templateUrl:'app/templates/saleItems.html',
            controller:'saleItemsController'
        }).state('orders', {
            url: "/orders",
            templateUrl:'app/templates/orders.html',
            controller:'ordersController'
        }).state('print', {
            url: "/print",
            templateUrl:'app/templates/print.html',
            controller:'printController'
        });


    }
})(angular);
