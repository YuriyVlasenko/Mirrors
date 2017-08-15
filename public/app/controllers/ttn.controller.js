(function(angular) {
    angular.module('app').controller('ttnController', TtnController);

    TtnController.$inject = ['$scope', '$stateParams', '$state'];
    function TtnController($scope, $stateParams, $state){

        var months = ['Січня','Лютого','Березня','Квітня','Травня','Червня','Липня',
            'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];

        var order = $stateParams.order;
        var orderItems = $stateParams.items;

        if (order == null){
            $state.go('orders');
            return;
        }

        var date=  new Date(order.date);
        var orderHeader = order._saleOrderHeader;

        console.log(order);

        $scope.itemsOnPage = 30;
        // TODO: implement
        $scope.order = {
            items: orderItems,
            number: order.orderNumber,
            day: date.getDate(),
            month: months[date.getMonth()],
            year: date.getFullYear(),
            attornay: orderHeader.attornay,
            whom: orderHeader.whom
        };


    }

})(angular);