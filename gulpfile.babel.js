import gulp from "gulp";
import { spawn } from "child_process";
import browserSync from "browser-sync";
import autoprefix from "gulp-autoprefixer";
import minify from "gulp-clean-css";
import sass from "gulp-sass";
import imagemin from "gulp-imagemin"


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
    return gulp
        .src(["./assets/js/**/*", "./gulpfile.js"])
        .pipe(plumber())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
    return (
        gulp
        .src(["./assets/js/**/*"])
        .pipe(plumber())
        .pipe(webpackstream(webpackconfig, webpack))
        // folder only, filename is specified in webpack config
        .pipe(gulp.dest("./_site/assets/js/"))
        .pipe(browsersync.stream())
    );
}

/**
 * Build Jekyll and compile styles
 */
const buildSite = done => {
    gulp.watch("./assets/img/**/*", images)(done);
    gulp.series(scriptsLint, scripts)(done);
    gulp.series(compileStyles, buildJekyll)(done);
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