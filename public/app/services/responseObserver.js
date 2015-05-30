/**
 * Created by Serg on 30.05.2015.
 */

(function (angular) {
    angular.module('app.services').factory('responseObserver', responseObserver);
    responseObserver.$inject = ['$q','localStorageService','storageKeys'];
    function responseObserver($q,localStorageService, storageKeys) {
        return {
            'responseError': function(rejection){
                if (rejection.status == 403){
                    localStorageService.remove(storageKeys.USER_DATA);
                }
                return $q.reject(rejection);
            }
        };
    };
})(angular);
