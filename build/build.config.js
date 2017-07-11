'use strict';
//basic configuration object used by gulp tasks
module.exports = {
  port: 3000,
  tmp: 'build/tmp',
  dist: 'build/dist',
  dev: 'build/dev',
  base: 'client',
  mainScss: 'client/scss/main.scss',
  scss: 'client/scss/**/*.scss',
  html: 'client/**/*.html',
  js: [
    'client/js/**/*.js',
    '!client/vendor/**/*.js'
  ],
  index: 'client/index.html',
  assets: 'client/assets/**',
  images: 'client/img/**/*',
  video: 'client/video/**/*'
};
