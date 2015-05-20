/**
 * Created by Yuriy on 14.03.2015.
 */
(function(angular){
    angular.module('app.services').service('toastsPresenter', createService);

    createService.$inject = ['$mdToast','$rootScope'];

    function createService($mdToast,$rootScope){

        var operationResultClasses = {
            SUCCESS: 'success',
            INFORMATION:'information',
            ERROR: 'error'
        };

        this.handlePromise = function(promise){
            promise.then(this.operationSucceeded, this.operationError);
        };

        this.operationSucceeded = function(){
            showCustom(operationResultClasses.SUCCESS, 'Операция выполнена успешно.');
        };

        this.operationCanceled = function(){
            showCustom(operationResultClasses.INFORMATION, 'Операция отменена');
        };

        this.operationError = function(){
            showCustom(operationResultClasses.ERROR, 'Ошибка выполнения операции');
        };

        this.success = function(text){
            showCustom(operationResultClasses.SUCCESS, text);
        };

        this.error = function(text){
            showCustom(operationResultClasses.ERROR, text);
        };

        this.info = function(text){
            showCustom(operationResultClasses.INFORMATION, text);

        };

        var showCustom = function(type, text){
            var localScope = $rootScope.$new();
            localScope.message = text;
            localScope.type =type;
            $mdToast.show({
                templateUrl:'app/templates/toast.html',
                scope: localScope
            });
        }
    }
})(angular);

