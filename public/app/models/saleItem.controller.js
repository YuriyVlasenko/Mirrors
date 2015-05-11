/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('saleItemController', SaleItemController);

    SaleItemController.$inject = ['$scope','$mdDialog','dialogData'];
    function SaleItemController($scope, $mdDialog, dialogData) {

        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.categories = dialogData.categories;
        $scope.sets = dialogData.sets;

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);

