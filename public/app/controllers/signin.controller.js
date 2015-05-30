/**
 * Created by Serg on 16.05.2015.
 */

(function(angular) {
    angular.module('app').controller('signInController', SetsController);

    SetsController.$inject = ['$scope', 'signIn', '$state'];
    function SetsController($scope, signIn, $state){

        $scope.login = login;
        $scope.vm = {
            username:'',
            password:''
        };

        $scope.loginAsGuest = loginAsGuest;

        function loginAsGuest(){
            var promise =  signIn.login();
            promise.success(function(){
                $state.go('main');
            });

            promise.error (function(error){
                $scope.errorData = error;
            });
        }

        function login(){
            var promise =  signIn.login($scope.vm.username, $scope.vm.password);
            promise.success(function(){
                $state.go('main');
            });

            promise.error (function(error){
                $scope.errorData = error;
            });
        };
    }
})(angular);