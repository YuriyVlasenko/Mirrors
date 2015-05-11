/**
 * Created by Serg on 04.05.2015.
 */

(function(angular) {
    angular.module('app.services').service('print', createService);

    createService.$inject = ['$state', 'localStorageService'];
    function createService($state, localStorageService) {
        var ORDER_KEY = 'order';

        this.printOrder = printOrder;
        this.getOrder = getOrder;
        this.resetOrder = resetOrder;

        function printOrder(order){
            $state.go('print');
            localStorageService.set(ORDER_KEY, order);
        }

        function getOrder(){
            return localStorageService.get(ORDER_KEY);
        }

        function resetOrder(){
            localStorageService.remove(ORDER_KEY)
        };

    }
})(angular);
