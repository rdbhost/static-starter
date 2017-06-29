'use strict';

var fs = require('fs');
var request = require('sync-request');
var config = require('./build/build.config.js');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var notify = require('gulp-notify');
var reload = browserSync.reload;
var pkg = require('./package');
var del = require('del');
var gulpif = require('gulp-if');
var cleanCSS = require('gulp-clean-css');
var _ = require('lodash');
var inject = require('gulp-inject-string');
var devConfig = JSON.parse(fs.readFileSync('./variables.json'));
var liveConfig = JSON.parse(request('GET', config.config_url).getBody());
var ico = require('gulp-to-ico');
var run = require('gulp-run-command').default;

// optimize images and put them in the dist folder
function images() {
  return gulp.src(config.images)
    .pipe(gulp.dest(config.dist + '/img'))
    .pipe(plugins.size({
      title: 'img'
    }));
}

//generate css files from scss sources
function sass() {
  return gulp.src(config.mainScss)
    .pipe(plugins.sass())
    .on('error', plugins.sass.logError)
    .on("error", notify.onError({
        title: 'SASS ERROR',
		message: '<%= error.message %>',
		sound: true
    }))
    .pipe(gulp.dest(config.tmp))
    .pipe(plugins.size({
      title: 'sass'
    }));
}
function sass_dist() {
  return gulp.src(config.mainScss)
    .pipe(plugins.sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest(config.tmp))
    .pipe(plugins.size({
      title: 'sass'
    }));
}

//build files for creating a dist release
gulp.task('build:dist', ['clean'], function(cb) {
  gulp.series(['build', copy, copy_assets, images], html, 'clean:dist', 'inject:prod', cb);
});

//build files for development
gulp.task('build', ['clean'], function(cb) {
  gulp.series([sass_dist, copy_dev], cb);
});

//generate a minified css files, 2 js file, change theirs name to be unique, and generate sourcemaps
function html() {
  var assets = plugins.useref.assets({
    searchPath: '{build,client}'
  });

  return gulp.src(config.html)
    .pipe(assets)
    .pipe(plugins.if(['**/*main.js', '**/*main.css'], plugins.header(config.banner, {
      pkg: pkg
    })))
    .pipe(plugins.rev())
    .pipe(assets.restore())
    .pipe(plugins.useref())
    .pipe(plugins.revReplace())
    .pipe(gulp.dest(config.dist))
    .pipe(plugins.size({
      title: 'html'
    }));
}

//copy assets in dist folder
function copy_assets() {
  return gulp.src(config.assets, {
      dot: true
    }).pipe(gulp.dest(config.dist))
    .pipe(plugins.size({
      title: 'copy:assets'
    }));
}

//copy assets in dist folder
function copy() {
  return gulp.src([
      config.base + '/*',
      '!' + config.base + '/*.html',
      '!' + config.base + '/src'
    ]).pipe(gulp.dest(config.dist))
    .pipe(plugins.size({
      title: 'copy'
    }));
}

//copy assets in dev folder
function copy_dev() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src'
    ]).pipe(gulp.dest(config.dev))
    .pipe(plugins.size({
      title: 'copy'
    }));
}

// Copy dev assets
function copy_dev_assets() {
  return gulp.src([
      config.base + '/**/*',
      '!' + config.base + '/src',
      '!' + config.base + '/**/*.html'
    ]).pipe(gulp.dest(config.dev))
    .pipe(plugins.size({
      title: 'copy'
    }));
}

//copy over the social assets and place them in the root of the dist
function copy_fav() {
  return gulp.src([
      config.base + '/img/fav/*',
      config.base + '/site-config/*'
    ]).pipe(gulp.dest(config.dist))
    .pipe(plugins.size({
      title: 'copy:fav'
    }));
}

//clean temporary directories
gulp.task('clean', del.bind(null, [config.tmp]));
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
gulp.task('serve', function() {
	gulp.series('build', 'inject:dev', function() {
		browserSync({
			notify: false,
			logPrefix: pkg.name,
			server: ['build', config.dev]
		});
	});
	gulp.watch(config.html, ['inject:dev', reload]);
	gulp.watch(config.scss, [sass, reload]);
	gulp.watch([config.base + '/**/*', '!' + config.html, '!' + config.scss], [copy_dev_assets, reload]);
});

// Inject JSON Varibles
gulp.task('inject:dev', function(cb) {
  var keys = _.keys(devConfig);
  var stream = gulp.src(config.html);

  for(var i = 0; i < keys.length; i++) {
    stream = stream.pipe(inject.replace('<% ' + keys[i] + ' %>', devConfig[keys[i]]));
  }

  stream = stream.pipe(gulp.dest(config.dev));

  setTimeout(cb, 100);
});

// Inject JSON Varibles for Production
gulp.task('inject:prod', function(cb) {
  var keys = _.keys(liveConfig);
  var stream = gulp.src(config.dist + '/**/*.html');

  for(var i = 0; i < keys.length; i++) {
    stream = stream.pipe(inject.replace('<% ' + keys[i] + ' %>', liveConfig[keys[i]]));
  }

  stream = stream.pipe(gulp.dest(config.dist));

  setTimeout(cb, 100);
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

// Export contents of sketch file
// gulp.task('sketch', run('sketchtool export slices --compact=YES --save-for-web=YES sketch/static-starter.sketch --output=client/img'))
