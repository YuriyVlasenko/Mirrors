/**
 * Created by Serg on 16.05.2015.
 */

(function(angular) {
    angular.module('app.services').service('signIn', createService);

    createService.$inject = ['$q', 'localStorageService', 'storageKeys'];
    function createService($q, localStorageService, storageKeys) {

        var userData = null;

        this.loadUserData = loadUserData;
        this.getUserData = getUserData;
        this.login = login;
        this.logout = logout;

        function logout(){
            userData = null;
            localStorageService.remove(storageKeys.USER_DATA);
        }

        function loadUserData(){
            userData = localStorageService.get(storageKeys.USER_DATA);
        }

        function getUserData(){
            return userData;
        }

        function login(username, password){
            // TODO
            var fakeData = {
                data:{
                    name: username
                }
            };

            var deferred = $q.defer();
            var promise = deferred.promise;

            deferred.resolve(fakeData);
            //deferred.reject('Wrong credentials.');

            promise.then(function(response){
                userData = response.data;
                localStorageService.set(storageKeys.USER_DATA, userData);
            }, function(){
                userData = null;
            });


            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            };

            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            };

            return promise;
        }
    }
})(angular);

