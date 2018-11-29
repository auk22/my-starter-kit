"use strict";

// 参考　http://taklog.hateblo.jp/entry/2016/12/11/091542
// 参考　http://cidermitaina.hatenablog.com/entry/2017/11/27/014525


const gulp = require('gulp');

// pug
//--------------------
const pug  = require('gulp-pug'); // テンプレートエンジン
const data = require('gulp-data'); // pugをルート相対パスで記述

// Sass,CSS
//----------------------
const sass         = require('gulp-sass');// sass
const autoprefixer = require('gulp-autoprefixer'); // cssにベンダープレフィックスを付与
const cssmin       = require('gulp-cssmin'); // cssのミニファイ

// JavaScript
//--------------------
const uglify = require('gulp-uglify'); // JSファイルのミニファイ

// utility
//--------------------
const browser     = require('browser-sync'); // ブラウザシンク
const plumber     = require('gulp-plumber'); // エラー回避
const rename      = require('gulp-rename'); // ファイルの名前変更
const replace     = require('gulp-replace'); // ファイル内のテキスト書き換え
const changed     = require('gulp-changed'); // 変更のあったファイルのみ更新
const cached      = require('gulp-cached'); // 変更のあったファイルのみ更新
const notify      = require("gulp-notify"); // コンパイルエラーを通知します
const imagemin    = require('gulp-imagemin'); // 画像の圧縮
const pngquant    = require('imagemin-pngquant'); // png画像の圧縮（imageminのプラグイン）
const mozjpeg     = require('imagemin-mozjpeg'); // jpeg画像の圧縮（imageminのプラグイン）
const svgmin      = require('gulp-svgmin'); // svg画像の圧縮
const watch       = require('gulp-watch');
const path        = require('path');

// File system
const fs = require('fs');

var paths = {
  'src'     : 'src/',
  'pugDir'  : 'src/pug/',
  'pugSrc'  : ['src/pug/**/*.pug', '!src/pug/**/_*.pug'],
  'sassSrc' : 'src/sass/**/*.scss',
  'jsSrc'   : 'src/js/*.js',
  'imgSrc'  : 'src/img/',
  'jsonSrc' : 'src/pug/data/',
  'rootDir' : 'dist/',
  'cssDir'  : 'dist/css/',
  'jsDir'   : 'dist/js/',
  'imgDir'  : 'dist/img/'
};

// prefix
//--------------------
const autoprefixerOptions = {
  browsers: ['last 2 version', 'ie >= 11', 'Android >= 4.4'],
  cascade: false,
  grid: true
};

// pug task
//--------------------
gulp.task('pug', () => {
  const locals = {
    'info': JSON.parse(fs.readFileSync(paths.jsonSrc + 'info.json'))
  }
  return gulp.src(paths.pugSrc)
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(data(function(file) {
      locals.relativePath = path.relative(file.base, file.path.replace(/.pug$/, '.html'));
        return locals;
    }))
    .pipe(pug({
        locals : locals,
        basedir: paths.pugDir,
        pretty: true
    }))
    .pipe(gulp.dest(paths.rootDir))
});

gulp.task('html', gulp.series('pug'));

// sass task
//--------------------
gulp.task('sass', () => {
  return gulp.src(paths.sassSrc)
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(sass({outputStyle: 'expanded'}))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(gulp.dest(paths.cssDir))
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.cssDir))
});

gulp.task('css', gulp.series('sass'));

// jpg,png,gif画像の圧縮タスク
gulp.task('imagemin', () => {
    const srcGlob = paths.imgSrc + '/**/*.+(jpg|jpeg|png|gif)';
    const dstGlob = paths.imgDir;
    return gulp.src( srcGlob )
    .pipe(changed( dstGlob ))
    .pipe(imagemin([
      pngquant({ quality: '65-80', speed: 1 }),
      mozjpeg({ quality: 80 }),
      imagemin.gifsicle({
          interlaced: false,
          optimizationLevel: 3,
          colors:180
      })
    ]
    ))
    .pipe(gulp.dest(paths.imgDir));
});
// svg画像の圧縮タスク
gulp.task('svgmin', () => {
    const srcGlob = paths.imgSrc + '/**/*.+(svg)';
    const dstGlob = paths.imgDir;
    return gulp.src( srcGlob )
    .pipe(changed( dstGlob ))
    .pipe(svgmin())
    .pipe(gulp.dest(paths.imgDir));
});

gulp.task('img', gulp.parallel('imagemin', 'svgmin'));

// js task
//--------------------
gulp.task('jsmin', () => {
  return gulp.src(paths.jsSrc)
      .pipe(cached('js'))
      .pipe(gulp.dest(paths.jsDir))
      .pipe(uglify({
        output:{
        comments: /^!/
      }
      }))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest(paths.jsDir))
});

gulp.task('js', gulp.parallel('jsmin'));


// Generate HTML
//--------------------
gulp.task('pugDist', (cb) => {
  // jsonを変数infoに代入
  const info = JSON.parse(fs.readFileSync(paths.jsonSrc + 'info.json'));
  // templateファイルを指定
  const template = paths.pugDir + '_template/_template.pug';
  for (var i = 0; i < info.length; i++) {
    gulp.src(template)
      .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
      .pipe(data(function(file) {
        return {
          'info': info
        }
      }))
      .pipe(pug({
        locals: {
          number : i
        },
        basedir: paths.pugDir,
        pretty : true
      }))
      .pipe(rename(info[i].id + '.html'))
      // <>がエスケープされるので元に戻す
      .pipe(replace('&lt;br&gt;','<br>'))
      .pipe(gulp.dest(paths.rootDir));
  }
  cb();
});


// server
//--------------------
gulp.task('server', () => {
  browser({
    server: {
      baseDir: paths.rootDir
    },
    notify   : true,
    xip      : false
  });
  watch(['src/sass/**/*.scss'], gulp.series('sass', browser.reload));
  watch(['src/js/*.js'], gulp.series('jsmin', browser.reload));
  watch(['src/pug/**/*.pug'], gulp.series('pug', browser.reload));
  watch(['src/img/**/*'], gulp.series('img', browser.reload));
});


// default
//--------------------
gulp.task('build', gulp.parallel('css', 'js', 'img', 'html'));
gulp.task('default', gulp.series('build', 'server'));
