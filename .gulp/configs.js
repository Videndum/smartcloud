const jsonConfig = require('gulp-json-config');
const rename = require("gulp-rename");
const jsonFmt = require("gulp-json-fmt");
const { src, dest } = require('gulp');
const exec = require('gulp-exec');

class Configs {

    static schema() {
        return src('./packages/**/README-SOURCE.md')
            .pipe(rename(function (path) {
                path.basename = path.dirname;
                path.dirname = "";
                path.extname = "";
            }))
            .pipe(exec(file => `cd ${file.path} && npm run dev:schema`))
            .pipe(exec.reporter({ stdout: false }));
    }
    static allConfig() {
        return src('.github/config/*.json')
            .pipe(jsonConfig())
            .pipe(jsonFmt(jsonFmt.PRETTY))
            .pipe(rename(function (path) {
                path.basename = "allconfigs";
            }))
            .pipe(dest('.github/'))
    }

    static release() {
        return src('packages/release-mastermind/.github/config/*.json')
            .pipe(jsonConfig())
            .pipe(jsonFmt(jsonFmt.PRETTY))
            .pipe(dest('packages/release-mastermind/.github/'))
            .pipe(rename(function (path) {
                path.basename = "releaseMastermind";
            }))
            .pipe(dest('.github/config'))
    }

    static convention() {
        return src('packages/convention-mastermind/.github/config/*.json')
            .pipe(jsonConfig())
            .pipe(jsonFmt(jsonFmt.PRETTY))
            .pipe(dest('packages/convention-mastermind/.github/'))
            .pipe(rename(function (path) {
                path.basename = "conventionMastermind";
            }))
            .pipe(dest('.github/config'))
    }

    static labels() {
        return src('packages/label-mastermind/.github/config/*.json')
            .pipe(jsonConfig())
            .pipe(jsonFmt(jsonFmt.PRETTY))
            .pipe(dest('packages/label-mastermind/.github/'))
            .pipe(rename(function (path) {
                path.basename = "labelMastermind";
            }))
            .pipe(dest('.github/config'))
    }
}

exports.Configs = Configs;