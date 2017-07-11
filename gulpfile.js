'use strict';

var fs = require('fs');
var request = require('sync-request');
var config = require('./build/build.config.js');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

// var debug = require('gulp-debug');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var notify = require('gulp-notify');
var pkg = require('./package');
var del = require('del');
var gulpif = require('gulp-if');
var cleanCSS = require('gulp-clean-css');
var _ = require('lodash');
var inject = require('gulp-inject-string');
var ico = require('gulp-to-ico');
var run = require('gulp-run-command').default;

// optimize images and put them in the dist folder
gulp.task('images', function() {
  return gulp.src(config.images)
    .pipe(gulp.dest(config.dist + '/img'))
    .pipe(plugins.size({title: 'img'}));
});

//generate css files from scss sources
gulp.task('sass', function() {
  return gulp.src(config.mainScss)
    .pipe(plugins.sass())
    .on('error', plugins.sass.logError)
    .on("error", notify.onError({
        title: 'SASS ERROR',
		message: '<%= error.message %>',
		sound: true
    }))
    .pipe(gulp.dest(config.tmp))
    .pipe(plugins.size({title: 'sass'}));
});
gulp.task('sass:dist', function() {
  return gulp.src(config.mainScss)
    .pipe(plugins.sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest(config.tmp))
    .pipe(plugins.size({title: 'sass'}));
});

//build files for creating a dist release
gulp.task('build:dist', ['clean'], function(cb) {
  runSequence(['build', 'copy', 'copy:assets', 'images'], 'html', 'favicon', 'clean:dist', 'inject:cachebust', cb);
});

//build files for development
gulp.task('build', ['clean'], function(cb) {
  runSequence(['sass:dist', 'copy:dev'], cb);
});

//generate a minified css files, 2 js file, change theirs name to be unique, and generate sourcemaps
gulp.task('html', function() {
  var assets = plugins.useref.assets({
    searchPath: '{build,client}'
  });

  return gulp.src(config.html)
    .pipe(assets)
    //.pipe(plugins.if('*.js', plugins.uglify({
    //  mangle: false,
    //})))
    //.pipe(plugins.if('*.css', cleanCSS()))
    //.pipe(plugins.if(['**/*main.js', '**/*main.css'], plugins.header(config.banner, {
    //  pkg: pkg
    //})))
    //.pipe(plugins.rev())
    .pipe(assets.restore())
    .pipe(plugins.useref())
    //.pipe(plugins.revReplace())
    .pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'html'}));
});

//copy assets in dist folder
gulp.task('copy:assets', function() {
  return gulp.src(config.assets, {dot: true})
	.pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'copy:assets'}));
});

//copy assets in dist folder
gulp.task('copy', function() {
  return gulp.src([
      config.base + '/*',
      '!' + config.base + '/*.html',
      '!' + config.base + '/src'
    ]).pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'copy'}));
});

//copy assets in dev folder
gulp.task('copy:dev', function() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src'
    ])
	.pipe(gulp.dest(config.dev))
    .pipe(plugins.size({title: 'copy'}));
});

// Copy dev assets
gulp.task('copy:dev:assets', function() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src',
      '!' + config.base + '/**/*.html'
    ])
	.pipe(gulp.dest(config.dev))
    .pipe(plugins.size({title: 'copy'}));
});

// Create the favicon from the png
gulp.task('favicon', ['copy:fav'], function() {
  return gulp.src(config.dist + '/favicon.png')
    .pipe(ico('favicon.ico'))
    .pipe(gulp.dest(config.dist));
});
//copy over the social assets and place them in the root of the dist
gulp.task('copy:fav', function() {
  return gulp.src([
      config.base + '/img/fav/*',
      config.base + '/site-config/*'
    ])
	.pipe(gulp.dest(config.dist))
    .pipe(plugins.size({title: 'copy:fav'}));
});

//clean temporary directories
gulp.task('clean', del.bind(null, [config.dev, config.tmp]));
// Clean build transfered folders
gulp.task('clean:dist', del.bind(null, [
  'build/dist/scss',
  'build/dist/js',
  'build/dist/vendor',
  'build/dev',
  'build/tmp',
  'build/dist/img/fav',
  'build/dist/site-config'
]));

//run the server after having built generated files, and watch for changes
gulp.task('serve', ['build'], function() {
		browserSync({
			notify: false,
			logPrefix: pkg.name,
			server: ['build', config.dev]
		});

		gulp.watch(config.html, [reload]);
		gulp.watch(config.scss, ['sass', reload]);
		gulp.watch([config.base + '/**/*', '!' + config.html, '!' + config.scss], ['copy:dev:assets', reload])
	}
);


// Inject JSON Variables for Production
gulp.task('inject:cachebust', function() {
  var val = (parseInt(new Date().getTime()/1000, 10)).toString(16);
  return gulp.src(config.dist + '/*.html')
	  // .pipe(debug())
      .pipe(inject.replace('=cachebust', '='+val))
      .pipe(gulp.dest(config.dist));
});


//run the app packed in the dist folder
gulp.task('serve:dist', ['build:dist'], function() {
  browserSync({
    notify: false,
    server: [config.dist]
  });
});

//default task
gulp.task('default', ['serve']);

