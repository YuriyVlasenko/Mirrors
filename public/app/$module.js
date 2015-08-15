/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){

    angular.module('app', ['ui.router','ui.grid','ui.grid.autoResize','ngMaterial',
        'app.services','app.models','angularFileUpload','LocalStorageModule']
    ).config(configure).run(run);

    // Configure routes.
    configure.$inject = ['$stateProvider','$urlRouterProvider','$provide', '$httpProvider'];
    function configure($stateProvider,$urlRouterProvider, $provide, $httpProvider){

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/signIn");

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
        }).state('signIn', {
            url: "/signIn",
            templateUrl:'app/templates/signIn.html',
            controller:'signInController'
        }).state('contacts', {
            url: "/contacts",
            templateUrl:'app/templates/contacts.html'
        }).state('admin', {
            url: "/admin",
            templateUrl:'app/templates/admin.html'
        });

        $httpProvider.interceptors.push('responseObserver');
    }

    // run block

    run,$inject = ['$rootScope', 'signIn', '$state', 'storageKeys', 'localStorageService'];
    function run($rootScope, signIn, $state){
        signIn.loadUserData();
        if(!signIn.getUserData()){
            $state.go('signIn')
        }

        $rootScope.$on('$stateChangeStart', function (event, next) {
            signIn.loadUserData();
            // check authorize
            if (next.name === 'signIn'){
                if (signIn.getUserData()){
                    event.preventDefault();
                    $state.go('main')
                }
            }
            else{
                if(!signIn.getUserData()){
                    event.preventDefault();
                    $state.go('signIn')
                }
            }
        });

        $rootScope.$watch(function(){
        return signIn.getUserData();}, function(value){
            if (!value){
                $state.go('signIn')
            }
        });
    };
})(angular);
