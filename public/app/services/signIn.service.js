/**
 * Created by Serg on 16.05.2015.
 */

(function(angular) {
    angular.module('app.services').service('signIn', createService);

    createService.$inject = ['localStorageService', 'storageKeys','$http', 'toastsPresenter', 'repository','modelNames', '$q'];
    function createService(localStorageService, storageKeys, $http, toastsPresenter, repository,modelNames, $q) {

        var userData = null;
        var wellKnownRoles = {
            admin: '751800e0-06db-11e5-8917-e995f239513c',
            partner: '210ab950-c51a-11e4-aec7-6b9322d76429',
            guest: '14d1dad0-06db-11e5-b015-6dc9c9e875e7'
        };

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

            var defer = $q.defer();
            $http.post('/signIn', parameters).then(function(response){
                repository.loadFilteredModelItems(modelNames.USER, {
                    login: parameters.username
                }).then(function(data){
                    userData = data[0];

                    userData.isAdmin = userData.roleId === wellKnownRoles.admin;
                    userData.isPartner = userData.roleId === wellKnownRoles.partner;
                    userData.isGuest = userData.roleId === wellKnownRoles.guest;
                    localStorageService.set(storageKeys.USER_DATA, userData);

                    defer.resolve(data);
                }, function(error){
                    userData = null;
                    defer.reject(error);
                    toastsPresenter.error('Неизвестная ошибка.');
                });

            }, function(error){
                if (error.status == 404){
                    toastsPresenter.error('Ошибка входа. Комбинация логин/пароль указана неверно.')
                }
                else{
                    toastsPresenter.error('Неизвестная ошибка.');
                }
                userData = null;
                localStorageService.set(storageKeys.USER_DATA, userData);

                defer.reject(error);
            });


            defer.promise.success = function(fn) {
                defer.promise.then(fn);
                return defer.promise;
            };

            defer.promise.error = function(fn) {
                defer.promise.then(null, fn);
                return defer.promise;
            };

            return defer.promise;
        }
    }
})(angular);

