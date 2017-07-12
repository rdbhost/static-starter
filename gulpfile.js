'use strict';

var fs = require('fs');
var config = require('./build/build.config.js');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

// var debug = require('gulp-debug');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

// var notify = require('gulp-notify');
var pkg = require('./package');
var del = require('del');
var cleanCSS = require('gulp-clean-css');
var _ = require('lodash');
var inject = require('gulp-inject-string');
var run = require('gulp-run-command').default;

// optimize images and put them in the dist folder
gulp.task('images', function() {
  return gulp.src(config.src_images)
    .pipe(gulp.dest(config.dist + '/img'))
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
    .pipe(gulp.dest(config.dev+'/css'))
    .pipe(plugins.size({title: 'sass'}));
});
gulp.task('sass:dist', function() {
  return gulp.src(config.src_mainScss)
    .pipe(plugins.sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest(config.dev+'/css'))
    .pipe(plugins.size({title: 'sass'}));
});

//build files for creating a dist release
gulp.task('build:dist', function(cb) {
  runSequence(['build', 'copy:dist', 'images'], 'html', cb);
});

//build files for development
gulp.task('build', function(cb) {
  runSequence(['sass:dist', 'copy:dev'], cb);
});

//generate a minified css files, 2 js file, change theirs name to be unique, and generate sourcemaps
gulp.task('html', function() {
  var assets = plugins.useref.assets({
    searchPath: '{build,client}'
  });

  var val = (parseInt(new Date().getTime()/1000, 10)).toString(16);

  return gulp.src(config.src_html)
    .pipe(assets)
    .pipe(assets.restore())
    .pipe(plugins.useref())
	.pipe(inject.replace('=cachebust', '='+val))

	.pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'html'}));
});


//copy assets to dist folder
gulp.task('copy:dist', function() {
  return gulp.src([
      config.base + '/*',
      '!' + config.base + '/*.html',
      '!' + config.base + '/src'
    ]).pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'copy:dist'}));
});

//copy assets to dev folder
gulp.task('copy:dev', function() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src'
    ])
	.pipe(gulp.dest(config.dev))
    .pipe(plugins.size({title: 'copy:dev'}));
});

//clean dev directories
gulp.task('clean', del.bind(null, [config.dev]));

// Clean build transfered folders
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
		gulp.watch([config.base + '/**/*', '!' + config.src_html, '!' + config.src_scss], ['copy:dev', reload])
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

