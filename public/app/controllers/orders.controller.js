/**
 * Created by PIPON on 09.03.2015.
 */

(function (angular) {
    angular.module('app').controller('ordersController', OrdersController);

    OrdersController.$inject = ['$scope', 'toastsPresenter', 'repository', 'modelNames', 'print', '$q', 'utils', 'basket',
        '$state', '$mdDialog'];
    function OrdersController($scope, toastsPresenter, repository, modelNames, print, $q, utils, basket, $state, $mdDialog) {

        var saleOrderDtl = [];
        $scope.saleOrders = [];

        $scope.print = printOrder;
        $scope.saveHeader = saveHeader;
        $scope.setCurrentOrder = setCurrentOrder;
        $scope.saveComments = saveComments;
        $scope.saveManagement = saveManagement;
        $scope.removeOrder = removeOrder;
        $scope.copyHeader = copyHeader;
        $scope.copyOrderItems = copyOrderItems;
        $scope.copyToBasket = copyToBasket;
        $scope.showPhoto = showPhoto;
        $scope.changeOrderDown = changeOrderDown;
        $scope.changeOrderUp = changeOrderUp;

        function changeOrderDown(){
            var order = $scope.selectedOrder;
            order.orderNumber++;

            changeOrderNumber(order.id, order.orderNumber);
        }

        function changeOrderUp(){
            var order = $scope.selectedOrder;
            if (order.orderNumber > 0) {
                order.orderNumber--;
                changeOrderNumber(order.id, order.orderNumber);
            }
        }

        function changeOrderNumber(orderId, newOrderNumber){
            repository.updateModelItem(modelNames.SALE_ORDER, orderId, {
                orderNumber: newOrderNumber
            }).then(function () {
                toastsPresenter.info('Позиция обновлена.');
            });
        }

        function printOrder() {
            if (!$scope.selectedOrder) {
                toastsPresenter.info('Выберите заказ');
            }
            print.printOrder($scope.selectedOrder);
        };

        function showPhoto(imageTitle, imageSrc) {
            var dialogPromise = $mdDialog.show({
                templateUrl: 'app/models/photoView.html',
                locals: {item: {title: imageTitle, photoSrc: imageSrc}},
                controller: function (scope, $mdDialog, item) {
                    scope.item = item;
                    scope.closeDialog = function () {
                        $mdDialog.hide();
                    }
                }
            });
        };

        function copyToBasket() {
            if (!$scope.selectedOrder) {
                toastsPresenter.info('Выберите заказ');
                return;
            }
            basket.fillBasket($scope.selectedOrder);
            toastsPresenter.info('Товары добавлены');
        }

        function removeOrder() {
            if (!$scope.selectedOrder) {
                toastsPresenter.info('Выберите заказ');
                return;
            }
            if ($scope.selectedOrder.isApproved || $scope.selectedOrder.isCompleted) {
                toastsPresenter.error('Невозможно удалить выполненый или подтвержденный заказ.');
                return;
            }

            var removePromises = [];

            for (var i = 0; i < $scope.selectedOrder._saleOrderDtl.length; i++) {
                var detail = $scope.selectedOrder._saleOrderDtl[i];
                removePromises.push(repository.removeModelItem(modelNames.SALE_ORDER_DTL, detail.id));
            }

            removePromises.push(repository.removeModelItem(modelNames.SALE_ORDER_HEADER, $scope.selectedOrder.id));
            removePromises.push(repository.removeModelItem(modelNames.SALE_ORDER, $scope.selectedOrder.id));

            $q.all(removePromises).then(function (data) {
                toastsPresenter.info('Заказ удален');

                // TODO:
                var index = utils.findIndexById($scope.saleOrders, $scope.selectedOrder.id, 'id');
                $scope.saleOrders.splice(index, 1);
                $scope.selectedOrder = {};

            }, function (error) {
                toastsPresenter.error('Ошибка удаления заказа');
                console.log(error);
            });

        }

        function copyOrderItems() {
            if (!$scope.selectedOrder) {
                toastsPresenter.info('Выберите заказ');
                return;
            }

            if ($scope.selectedOrder.isApproved) {
                toastsPresenter.info('Заказ подтвержден - только просмотр.');
            }

            basket.fillBasket($scope.selectedOrder, true);

            $state.go('main');
        };

        function saveManagement() {
            var updateData = {
                isApproved: $scope.selectedOrder.isApproved,
                isCompleted: $scope.selectedOrder.isCompleted,
                deliveryCost: $scope.selectedOrder.deliveryCost
            };
            var orderId = $scope.selectedOrder.id;
            repository.updateModelItem(modelNames.SALE_ORDER, orderId, updateData).then(function () {
                toastsPresenter.info('Информация сохранена.');
            }, function (error) {
                console.error('SALE_ORDER');
                console.error(error);
            });

        };

        function copyHeader() {
            if ($scope.selectedOrder._saleOrderHeader) {
                basket.setBasketDetails($scope.selectedOrder._saleOrderHeader);
                toastsPresenter.info('Информация скопирована.');
            }
            else {
                toastsPresenter.info('Ошибка копирования.');
            }
        }

        function saveHeader() {
            var headerId = $scope.selectedOrder._saleOrderHeader.id;
            var headerData = $scope.selectedOrder._saleOrderHeader;
            // update
            repository.updateModelItem(modelNames.SALE_ORDER_HEADER, headerId, headerData).then(function () {
                toastsPresenter.info('Информация сохранена.');
            }, function (error) {
                console.error('SALE_ORDER_HEADER');
                console.error(error);
            });
        }

        function saveComments() {
            var saleOrderId = $scope.selectedOrder.id;
            var commentData = {
                comment: $scope.selectedOrder.comment,
                response: $scope.selectedOrder.response
            }
            // update
            repository.updateModelItem(modelNames.SALE_ORDER, saleOrderId, commentData).then(function () {
                toastsPresenter.info('Информация сохранена.');
            }, function (error) {
                console.error('SALE_ORDER');
                console.error(error);
            });
        }

        function setCurrentOrder(order) {
            $scope.selectedOrder = order;
            $scope.selectedOrder._saleOrderHeader = $scope.selectedOrder._saleOrderHeader || {};
        };

        repository.reloadModelItems([modelNames.USER, modelNames.SET, modelNames.SALE_ITEM, modelNames.SALE_ITEM_DTL,
            modelNames.PRICE, modelNames.CATEGORY, modelNames.SALE_ORDER, modelNames.SALE_ORDER_DTL,
            modelNames.SALE_ORDER_HEADER]).then(function () {

            saleOrderDtl = repository.getModelItems(modelNames.SALE_ORDER_DTL);

            repository.buildModelItemData(modelNames.SALE_ORDER);

            $scope.saleOrders = repository.getModelItems(modelNames.SALE_ORDER);

        }, function (error) {
            console.log(error);
            toastsPresenter.error('Возникла при загрузке.');
        });
    }
})(angular);


