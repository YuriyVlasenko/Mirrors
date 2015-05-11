/**
 * Created by Serg on 21.03.2015.
 */

(function(angular) {
    angular.module('app').controller('photoController', PhotoController);

    PhotoController.$inject = ['$scope','$mdDialog','$http','toastsPresenter','modelNames','dialogData','FileUploader','utils'];
    function PhotoController($scope, $mdDialog,$http, toastsPresenter, modelNames, dialogData,FileUploader,utils){
        console.log('photo controller load');

        $scope.uploader = new FileUploader();

        initUploaderSettings($scope.uploader);

        var removeUrl = 'api/upload/delete/'+dialogData.modelName+'/'+dialogData.itemId;

        $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);

        $scope.uploader.onSuccessItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();
            toastsPresenter.operationSucceeded();
            $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);
        };
        $scope.uploader.onErrorItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();
            toastsPresenter.error('Ошибка при загрузке файла');
        };

        $scope.removeItem = function(){
            $scope.isFileSelected = false;
            $scope.uploader.clearQueue();

            console.log('remove start');
            $http.post(removeUrl).then(function(){
                toastsPresenter.success('Изображение удалено.');
                $scope.pictureSrc =  utils.buildPictureSrc(dialogData.modelName, dialogData.itemId);
            }, function(){
                toastsPresenter.error('Ошибка удалении изображения.');
            });
        };
        $scope.uploadItem = function(){
            $scope.uploader.uploadAll();
        };

        $scope.uploader.onAfterAddingFile = function(){
            $scope.isFileSelected = true;
        };

        $scope.titleText =  dialogData.titleText;

        $scope.save = function(){
            $mdDialog.hide($scope.modelData);
        };

        $scope.cancel = function(){
            $mdDialog.cancel();
        };

        function initUploaderSettings(uploader){
            uploader.queueLimit = 1;
            uploader.url = 'api/upload/'+dialogData.modelName+'/'+dialogData.itemId;
            uploader.filters.push({
                name: 'only png files',
                fn: function(item) {
                  if (item.type === 'image/png'){
                      return true;
                  }
                    toastsPresenter.error('Используйте изображение в формате png.');
                    return false;
                }
            });
        };


    }
})(angular);


