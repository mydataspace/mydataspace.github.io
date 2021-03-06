var gulp = require('gulp');
var Server = require('karma').Server;
var bower = require('gulp-bower');
var runSequence = require('run-sequence');
var del = require('del');
var concat = require('gulp-concat');

gulp.task('nodejs', function() {
  return gulp.src([
      './js/api/node.js',
      './js/common.js',
      './js/formatters.js',
      './js/api/entities.js',
      './js/api/client.js',
      './js/api/node-end.js'
    ])
    .pipe(concat('mydataspace.js'))
    .pipe(gulp.dest('./js/dist/'));
});

gulp.task('api', function() {
  return gulp.src([
      './vendor/socket.io.js',
      './js/common.js',
      './js/formatters.js',
      './js/api/entities.js',
      './js/api/client.js'
    ])
    .pipe(concat('api-v3.0.js'))
    .pipe(gulp.dest('./js/dist/'));
});

gulp.task('web20', function() {
  return gulp.src([
    './vendor/socket.io.js',
    './js/common.js',
    './js/formatters.js',
    './js/api/entities.js',
    './js/api/client.js',
    './js/api/web20.js'
  ])
    .pipe(concat('sdk-2.1.js'))
    .pipe(gulp.dest('./js/dist/'));
});


gulp.task('mds', function() {
  return gulp.src([
      './js/common.js',
      './js/formatters.js',
      './js/api/entities.js',
      './js/api/client.js',
      './js/api/localhost.js'
    ])
    .pipe(concat('localhost.js'))
    .pipe(gulp.dest('./js/dist/'));
});

gulp.task('a', ['api', 'nodejs', 'mds', 'web20', 'wizard']);

gulp.task('ui', function() {
  return gulp.src([
    './js/ace.js',
    './js/router.js',
		'./js/ui-constants.js',
    './js/ui-helper.js',
    './js/fields.js',
    './js/identity.js',
    './js/ui-controls.js',
    './js/entity-form.js',
    './js/entity-list.js',
    './js/entity-tree.js',
    './js/pages.js',
    './js/ui-layout/index.js',
    './js/ui-layout/multiline-tabview.js',
    './js/ui-layout/windows/add-app.js',
    './js/ui-layout/windows/add-root.js',
    './js/ui-layout/windows/add-entity.js',
    './js/ui-layout/windows/clone-entity.js',
    './js/ui-layout/windows/add-task.js',
    './js/ui-layout/windows/add-proto.js',
    './js/ui-layout/windows/add-resource.js',
    './js/ui-layout/windows/add-field.js',
    './js/ui-layout/windows/add-file.js',
    './js/ui-layout/windows/show-media.js',
    './js/ui-layout/windows/rename-file.js',
    './js/ui-layout/windows/edit-script.js',
    './js/ui-layout/windows/add-website.js',
    './js/ui-layout/windows/change-version.js',
    './js/ui-layout/windows/add-version.js',
    './js/ui-layout/windows/add-generator.js',
    './js/ui-layout/popups/field-indexed.js',
    './js/ui-layout/popups/field-type.js',
    './js/ui-layout/popups/search-scope.js',
    './js/ui-layout/popups/new-entity.js',
    './js/ui-layout/popups/new-root-version.js',
    './js/ui-layout/popups/new-root.js',
    './js/ui-layout/popups/entity-context-menu.js',
    './js/ui-layout/side-menu.js',
    './js/ui-layout/header.js',
    './js/ui-layout/entity-tree.js',
    './js/ui-layout/entity-list.js',
    './js/ui-layout/entity-form.js',
    './js/ui-layout/apps.js',
    './js/ui.js'
  ])
  .pipe(concat('ui.js'))
  .pipe(gulp.dest('./js/dist'))
  .pipe(gulp.dest('./_site/js/dist'))
  .pipe(gulp.dest('./_site/js/dist'));
});

gulp.task('wizard', function() {
  return gulp.src([
    './js/wizard.js'
  ])
    .pipe(concat('wiz-1.4.js'))
    .pipe(gulp.dest('./js/dist'))
    .pipe(gulp.dest('./_site/js/dist'))
    .pipe(gulp.dest('./_site/js/dist'));
});

gulp.task('wizard', ['wizard:js', 'wizard:css']);

gulp.task('wizard:js', function() {
  return gulp.src([
    './js/wizard.js'
  ])
    .pipe(concat('wiz-1.4.js'))
    .pipe(gulp.dest('./js/dist'))
    .pipe(gulp.dest('./_site/js/dist'))
    .pipe(gulp.dest('./_site/js/dist'));
});

gulp.task('wizard:css', function() {
  return gulp.src(
    '_site/css/wizard.css'
  )
    .pipe(concat('wiz-1.4.css'))
    .pipe(gulp.dest('./js/dist'))
    .pipe(gulp.dest('./_site/js/dist'))
    .pipe(gulp.dest('./_site/js/dist'));
});


gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('bower', function() {
  return bower();
});


gulp.task('vendor:md', function () {
  return gulp.src('bower_components/remarkable/dist/*.js').pipe(gulp.dest('vendor'));
});



gulp.task('vendor:handlebars', function () {
  return gulp.src(['bower_components/handlebars/handlebars.runtime.js', 'bower_components/handlebars/handlebars.js']).pipe(gulp.dest('vendor'));
});


//
// Flags
//

gulp.task('vendor:flags:css', function() {
  return gulp.src(
    'bower_components/flag-icon-css/sass/*'
  ).pipe(gulp.dest('vendor/flag-icon-css'));
});

gulp.task('vendor:flags:svg', function() {
  return gulp.src(
    'bower_components/flag-icon-css/flags/**/*'
  ).pipe(gulp.dest('vendor/flag-icon-css/flags'));
});

gulp.task('vendor:flags', ['vendor:flags:css', 'vendor:flags:svg']);

//
// Bootstrap
//

gulp.task('vendor:bootstrap:js', function() {
  return gulp.src(
    ['bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
    'bower_components/bootstrap-sass/assets/javascripts/bootstrap.js']
  ).pipe(gulp.dest('vendor/bootstrap'));
});

gulp.task('vendor:bootstrap:css', function() {
  return gulp.src(
    'bower_components/bootstrap-sass/assets/stylesheets/**/*'
  ).pipe(gulp.dest('vendor/bootstrap/stylesheets'));
});

gulp.task('vendor:bootstrap:fonts', function() {
  return gulp.src(
    'bower_components/bootstrap-sass/assets/fonts/bootstrap/*'
  ).pipe(gulp.dest('vendor/bootstrap/'));
});

gulp.task('vendor:bootstrap', ['vendor:bootstrap:js', 'vendor:bootstrap:css', 'vendor:bootstrap:fonts']);


gulp.task('vendor:jquery', function() {
  return gulp.src(
    [
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/jquery/dist/jquery.js'
    ]
  ).pipe(gulp.dest('vendor'));
});

//
// Tether
//

gulp.task('vendor:tether', function() {
  return gulp.src(
    ['bower_components/tether/dist/js/tether.min.js',
      'bower_components/tether/dist/js/tether.js',
      'bower_components/tether/dist/css/tether.css',
      'bower_components/tether/dist/css/tether-theme-arrows-dark.css',
      'bower_components/tether-drop/dist/js/drop.min.js',
      'bower_components/tether-drop/dist/js/drop.js',
      'bower_components/tether/src/css/helpers/*.sass']
  ).pipe(gulp.dest('vendor/tether'));
});



gulp.task('vendor:fa:css', function () {
  return gulp.src('bower_components/fontawesome/css/*').pipe(gulp.dest('vendor/fontawesome/css'));
});

gulp.task('vendor:fa:fonts', function () {
  return gulp.src('bower_components/fontawesome/fonts/*').pipe(gulp.dest('vendor/fontawesome/fonts'));
});

gulp.task('vendor:fa', ['vendor:fa:fonts', 'vendor:fa:css']);

gulp.task('vendor:webix:fonts', function () {
  return gulp.src('bower_components/webix/codebase/fonts/*').pipe(gulp.dest('vendor/webix/fonts'));
});

gulp.task('vendor:webix:code', function () {
  return gulp.src('bower_components/webix/codebase/*.*').pipe(gulp.dest('vendor/webix'));
});

gulp.task('vendor:webix', ['vendor:webix:fonts', 'vendor:webix:code']);


// gulp.task('vendor:jquery', function () {
//   return gulp.src('bower_components/jquery/dist/*').pipe(gulp.dest('vendor/jquery'));
// });

gulp.task('vendor:sio', function () {
  return gulp.src('bower_components/socket.io-client/socket.io.js').pipe(gulp.dest('vendor'));
});

gulp.task('vendor:ace', function () {
  return gulp.src([
    'bower_components/ace-builds/src-noconflict/ace.js',
    'bower_components/ace-builds/src-noconflict/ext-searchbox.js',
    'bower_components/ace-builds/src-noconflict/theme-chrome.js',
    'bower_components/ace-builds/src-noconflict/mode-javascript.js',
    'bower_components/ace-builds/src-noconflict/mode-html.js',
    'bower_components/ace-builds/src-noconflict/mode-jade.js',
    'bower_components/ace-builds/src-noconflict/mode-json.js',
    'bower_components/ace-builds/src-noconflict/mode-css.js',
    'bower_components/ace-builds/src-noconflict/mode-less.js',
    'bower_components/ace-builds/src-noconflict/mode-scss.js',
    'bower_components/ace-builds/src-noconflict/mode-text.js',
    'bower_components/ace-builds/src-noconflict/mode-markdown.js'
  ]).pipe(gulp.dest('vendor/ace/src-noconflict'));
});

gulp.task('vendor:clean', function() {
  return del(['vendor/**/*']);
});

gulp.task('jekyll:build', function (done){
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit', shell: true});
  jekyll.on('exit', function(code) {
    done(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
  });
});

gulp.task('jekyll:clean', function() {
  return del(['_site']);
});

gulp.task('jekyll:serve', function (done){
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['serve', '--incremental', '--watch'], {stdio: 'inherit', shell: true});
  jekyll.on('exit', function(code) {
    done(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
  });
});

gulp.task('default', function() {
  runSequence(
    'bower',
    'vendor:clean',
    [
      'vendor:jquery',
      'vendor:fa',
      'vendor:sio',
      'vendor:webix',
      'vendor:bootstrap',
      'vendor:ace',
      'vendor:tether',
      'vendor:handlebars'
    ],
    'api',
    'ui',
    'jekyll:clean',
    'jekyll:build');
});

gulp.task('serve', function() {
  runSequence(
    'bower',
    'vendor:clean',
    [
      'vendor:jquery',
      'vendor:fa',
      'vendor:sio',
      'vendor:webix',
      'vendor:bootstrap',
      'vendor:ace',
      'vendor:tether',
      'vendor:handlebars'
    ],
    'api',
    'ui',
    'jekyll:clean',
    'jekyll:serve');
});
