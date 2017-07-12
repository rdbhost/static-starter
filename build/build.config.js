'use strict';
//basic configuration object used by gulp tasks
module.exports = {
  port: 3000,
  dist: 'build/dist',
  dev:  'build/dev',
  base: 'client',

  src_mainScss: 'client/scss/main.scss',
  src_scss:     'client/scss/**/*.scss',
  src_html:     'client/**/*.html',
  src_js: [
    'client/js/**/*.js',
    '!client/vendor/**/*.js'
  ],
  src_index:  'client/index.html',
  src_assets: 'client/assets/**',
  src_images: 'client/img/**/*',
  src_video:  'client/video/**/*'
};
