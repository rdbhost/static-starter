'use strict';

var fs = require('fs');
var config = require('./build/build.config.js');
var gulp = require('gulp');
var runSequence = require('run-sequence');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var pkg = require('./package');
var del = require('del');
var _ = require('lodash');

var plugins = require('gulp-load-plugins')({rename: {'gulp-inject-string': 'inject'}});

// optimize images and put them in the dist folder
gulp.task('images', function() {
  return gulp.src(config.src_images)
	.pipe(plugins.changed(config.dist+'/img'))
    .pipe(gulp.dest(config.dist +'/img'))
    .pipe(plugins.size({title: 'img'}));
});

//generate css files from scss sources
gulp.task('sass', function() {
  return gulp.src(config.src_mainScss)
    .pipe(plugins.sass())
    .on('error', plugins.sass.logError)
    .on("error", plugins.notify.onError({
        title: 'SASS ERROR',
		message: '<%= error.message %>',
		sound: true
    }))
    .pipe(plugins.changed(config.dev+'/css'))
    .pipe(gulp.dest(config.dev+'/css'))
    .pipe(plugins.size({title: 'sass'}));
});

gulp.task('sass:dist', function() {
  return gulp.src(config.src_mainScss)
    .pipe(plugins.sass({outputStyle: 'compressed'}))
    .pipe(plugins.changed(config.dev+'/css'))
    .pipe(gulp.dest(config.dev+'/css'))
    .pipe(plugins.size({title: 'sass'}));
});

//build files for creating a dist release
gulp.task('build:dist', function(cb) {
  runSequence(['build', 'copy:dist', 'images'], 'html', cb);
});

//build files for development
gulp.task('build', function(cb) {
  runSequence(['sass:dist', 'copy'], cb);
});

//generate a minified css files, 2 js file, change theirs name to be unique, and generate sourcemaps
gulp.task('html', function() {
  var assets = plugins.useref.assets({
    searchPath: '{build,client}'
  });

  var cacheBustVal = (parseInt(new Date().getTime()/1000, 10)).toString(16);

  return gulp.src(config.src_html)
    .pipe(assets)
    .pipe(assets.restore())
    .pipe(plugins.useref())
	.pipe(plugins.inject.replace('=cachebust', '='+cacheBustVal))

    .pipe(plugins.changed(config.dist))
	.pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'html'}));
});

//copy assets to dist folder  TODO - perhaps needs greedier glob to copy more
gulp.task('copy:dist', function() {
  return gulp.src([
      config.base + '/*',
      '!' + config.base + '/*.html',
      '!' + config.base + '/src'
    ])
    .pipe(plugins.changed(config.dist))
	.pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'copy:dist'}));
});

//copy assets to dev folder
gulp.task('copy', function() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src'
    ])
    .pipe(plugins.changed(config.dev))
	.pipe(gulp.dest(config.dev))
    .pipe(plugins.size({title: 'copy'}));
});

//clean dev directories
gulp.task('clean', del.bind(null, [config.dev]));

// Clean build transferred folders
gulp.task('clean:dist', del.bind(null, [
  'build/dist/scss',
  'build/dist/js',
  'build/dist/vendor',
  'build/dev',
  'build/dist/img/fav',
  'build/dist/site-config'
]));

//run the server after having built generated files, and watch for changes
gulp.task('serve', ['build'], function() {
		browserSync({
			notify: false,
			logPrefix: pkg.name,
			server: [config.dev]
		});

		gulp.watch(config.src_html, [reload]);
		gulp.watch(config.src_scss, ['sass', reload]);
		gulp.watch([config.base + '/**/*', '!' + config.src_html, '!' + config.src_scss], ['copy', reload])
	}
);


//run the app packed in the dist folder
gulp.task('serve:dist', ['build:dist'], function() {
  browserSync({
    notify: false,
    server: [config.dist]
  });
});

//default task
gulp.task('default', ['serve']);

