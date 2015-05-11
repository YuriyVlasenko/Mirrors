var gulp = require('gulp');
var pkg = require('./config/config.json');
var refresh = require('gulp-livereload');
var server = require('tiny-lr')();
var concat = require('gulp-concat');

gulp.task('default', function(){
    gulp.src(['public/app/**/*.js'])
        .pipe(concat(pkg.name+'.js'))
        .pipe(gulp.dest('public/dist'))
        .pipe(refresh(server));
});