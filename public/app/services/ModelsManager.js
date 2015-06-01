/**
 * Created by PIPON on 28.02.2015.
 */

(function(angular){
    angular.module('app.services').factory('ModelsManager', createFactory);

    createFactory.$inject = ['$http','$q','commonConfig'];

    function createFactory($http,$q,commonConfig){

        function ModelsManager(modelName){
            var paths = {
                create: '',
                update: '',
                remove: '',
                getOne: '',
                getAll: ''
            };

            initialize(modelName);

            this.create = function(item){
                console.log('start create');
                var defer = $q.defer();

                $http.post(paths.create, item).success(function (data) {
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });
                return defer.promise;
            };

            this.getAll =  function (config) {
                var defer =  $q.defer();
                $http({
                    url: paths.getAll,
                    method: "GET",
                    params: config
                }).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });
                return defer.promise;
            };

            this.getAllWithMap = function(){
                var map = {};
                var defer =  $q.defer();
                $http.get(paths.getAll).success(function(data){
                    data.forEach(function(item){
                        map[item.id] = item;
                    });
                    defer.resolve({
                        itemsList: data,
                        itemsMap: map
                    });
                }).error(function(error){
                    defer.reject(error);
                });
                return defer.promise;
            };

            this.getOne = function(id) {
                var defer =  $q.defer();
                var path = paths.getOne + id;

                $http.get(path).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });

                return defer.promise;
            };

            this.update = function(id, data) {
                console.log('start update');
                var defer =  $q.defer();

                $http.post(paths.update, { id: id, data:data}).success(function(data){
                    defer.resolve(data);
                }).error(function(error){
                    defer.reject(error);
                });

                return defer.promise;
            };

            this.remove = function(id) {
                var defer =  $q.defer();

                $http.post(paths.remove, { id: id }).success(function (data) {
                    console.log('remove client:'+id);
                    defer.resolve(data);
                }).error(function(error){
                    console.log('remove client error:'+id);
                    defer.reject(error);
                });

                return defer.promise;
            };

            function initialize(modelName){
                paths.create = commonConfig.API_PREFIX +'/'+ modelName+'/new';
                paths.getAll = commonConfig.API_PREFIX +'/'+ modelName+'s';
                paths.getOne = commonConfig.API_PREFIX +'/'+ modelName+'/';
                paths.update = commonConfig.API_PREFIX +'/'+ modelName+'/update';
                paths.remove = commonConfig.API_PREFIX +'/'+ modelName+'/delete';
            };
        }
        return ModelsManager;
    }
})(angular);


