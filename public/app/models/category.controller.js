/**
 * Created by PIPON on 09.03.2015.
 */

(function(angular) {
    angular.module('app.models').controller('categoryController', CategoryController);

    CategoryController.$inject = ['$scope','$mdDialog','dialogData','utils','modelNames'];
    function CategoryController($scope,$mdDialog, dialogData,utils,modelNames) {
        if (!dialogData)
        {
            console.error('dialog data in empty');
            return;
        }

        $scope.titleText = dialogData.titleText;
        $scope.modelData = dialogData.model || {};
        $scope.categories = dialogData.categories;

        $scope.pictureSrc = utils.buildPictureSrc(modelNames.CATEGORY, $scope.modelData.id);

        $scope.editPhoto = function(){
            var dialogPromise = $mdDialog.show({
                templateUrl:'app/models/photo.html',
                controller:'photoController',
                locals: { dialogData: { modelName:modelNames.CATEGORY, itemId: $scope.modelData.id, titleText:'Работа с фото' }}
            });
        };

        // TODO: add validation

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };
    }
})(angular);

