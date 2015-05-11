/**
 * Created by Serg on 05.04.2015.
 */

angular.module('app.services').filter('name', function() {
    return function(input, nameValue) {
        if (!nameValue){
            return input;
        }
        nameValue = nameValue.toLowerCase();
        return input.filter(function(item){
            return item.name.toLowerCase().indexOf(nameValue) > -1;
        });
    };
});