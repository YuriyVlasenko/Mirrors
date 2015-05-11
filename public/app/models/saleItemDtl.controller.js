/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('saleItemDtlController', SaleItemDtlController);

    SaleItemDtlController.$inject = ['$scope','$mdDialog','dialogData'];
    function SaleItemDtlController($scope, $mdDialog, dialogData) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.saleItem = dialogData.saleItem;

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);

