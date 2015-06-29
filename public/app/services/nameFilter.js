/**
 * Created by Serg on 05.04.2015.
 */

angular.module('app.services').filter('name', function() {
    return function(input, nameValue) {
        if (!nameValue){
            return input;
        }
        if (angular.isUndefined(input) || input.length === 0){
            return [];
        }

        nameValue = nameValue.toLowerCase();
        return input.filter(function(item){
            var filterString = item.name.toLowerCase();
            if (angular.isDefined(item.code)){
                filterString += item.code.toLowerCase();
            }
            return filterString.indexOf(nameValue) > -1;
        });
    };
});