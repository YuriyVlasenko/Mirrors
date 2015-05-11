/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('roleController', RoleController);

    RoleController.$inject = ['$scope','$mdDialog','dialogData'];
    function RoleController($scope,$mdDialog, dialogData) {
        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);

