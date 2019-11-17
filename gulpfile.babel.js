import gulp from "gulp";
import { spawn } from "child_process";
import browserSync from "browser-sync";
import autoprefix from "gulp-autoprefixer";
import minify from "gulp-clean-css";
import sass from "gulp-sass";
import imagemin from "gulp-imagemin"
//import eslint from "gulp-eslint"
import babel from "gulp-babel";
//import webpack from "webpack"
//import webpackstream from "webpack";
import newer from "gulp-newer";
import uglify from "gulp-uglify";

const siteRoot = "_site";
const mainStylesheet = "_sass/main.scss"; /* Main stylesheet (pre-build) */

const jekyll =
    process.platform === "win32" ?
    "jekyll.bat" :
    "jekyll"; /* Fix Windows compatibility issue */

/**
 * Build Jekyll Site
 */
const buildJekyll = () => {
    browserSync.notify("Running: $ jekyll build");
    return spawn(jekyll, ["build"]);
};

// Clean assets
function clean() {
    return del(["./_site/assets/"]);
}

// Optimize Images
function images() {
    return gulp
        .src("./assets/img/**/*")
        .pipe(newer("./_site/assets/img"))
        .pipe(
            imagemin([
                imagemin.gifsicle({ interlaced: true }),
                imagemin.jpegtran({ progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [{
                        removeViewBox: false,
                        collapseGroups: true
                    }]
                })
            ])
        )
        .pipe(gulp.dest("./_site/assets/img"));
}


/**
 * Compile styles
 */
const compileStyles = () => {
    return gulp
        .src(mainStylesheet)
        .pipe(
            sass({
                includePaths: ["scss"],
                onError: browserSync.notify
            })
        )
        .pipe(
            autoprefix({
                browsers: ["last 2 versions"],
                cascade: false
            })
        )
        .pipe(minify())
        .pipe(gulp.dest("assets/css/"));
};
// Lint scripts
function scriptsLint() {
    browserSync.notify("scripts lint")
    return gulp
        .src(["./assets/js/*.js"])
        //  .pipe(plumber())
        //   .pipe(eslint({ configFile: './assets/js/eslint.json' }))
        //  .pipe(eslint.format())
        //   .pipe(minify())
        //.pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
    return (
        gulp
        .src(["./assets/js/**/*.js"])
        //  .pipe(plumber())
        // .pipe(webpackstream(webpackstream(require('./webpack.config.js'), webpack)))
        // folder only, filename is specified in webpack config
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest("./_site/assets/js/"))
        .pipe(browserSync.stream())
    );
}

/**
 * Build Jekyll and compile styles
 */
const buildSite = done => {
    gulp.watch("./assets/img/**/*", images);
    //scriptsLint, scripts,
    gulp.series(images, compileStyles, buildJekyll, scripts)(done);
};

/**
 * Start BrowserSync server
 */
const startServer = () => {
    browserSync.init({
        files: [siteRoot + "/**"],
        port: 4000,
        open: "local",
        server: {
            baseDir: siteRoot
        }
    });
};

/**
 * Build site and start BrowserSync server
 */
const serve = gulp.series(buildSite, startServer);

const watch = () => {
    gulp.watch(
        [
            "**/*.scss",
            "**/**/*.scss",
            "**/*.html",
            "**/*.md",
            "**/*.yml",
            "!_site/**/*"
        ],
        buildSite
    );
};

const build = done => {
    gulp.parallel(serve, watch)(done);
};



export default build;