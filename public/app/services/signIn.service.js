/**
 * Created by Serg on 16.05.2015.
 */

(function(angular) {
    angular.module('app.services').service('signIn', createService);

    createService.$inject = ['localStorageService', 'storageKeys','$http', 'toastsPresenter'];
    function createService(localStorageService, storageKeys, $http, toastsPresenter) {

        var userData = null;

        this.loadUserData = loadUserData;
        this.getUserData = getUserData;
        this.login = login;
        this.logout = logout;

        function logout(){
            userData = null;
            localStorageService.remove(storageKeys.USER_DATA);
            $http.get('/signOut');
        }

        function loadUserData(){
            userData = localStorageService.get(storageKeys.USER_DATA);
        }

        function getUserData(){
            return userData;
        }

        function login(username, password){
            var parameters = {
                username: username || 'guest',
                password: password || 'guest'
            };
            var promise = $http.post('/signIn', parameters);

            promise.then(function(response){
                userData = {
                    login: username
                };
                localStorageService.set(storageKeys.USER_DATA, userData);
            }, function(error){
                if (error.status == 404){
                    toastsPresenter.error('Ошибка входа. Комбинация логин/пароль указана неверно.')
                }
                else{
                    toastsPresenter.error('Неизвестная ошибка.');
                }
                userData = null;
                localStorageService.set(storageKeys.USER_DATA, userData);
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

