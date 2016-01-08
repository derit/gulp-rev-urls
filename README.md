# gulp-rev-urls

Gulp plugin for flexibly revving URLs by injecting a file hash. Handles relative URLs and compatible with any plugin that for generates file hashes/manifests e.g. `gulp-hasher`.

## Install:

`npm install --save-dev gulp-rev-urls`

## Usage:

```js
gulp.src('src/**/*')
    .pipe(revUrls(options))
    .pipe(gulp.dest('dist'))
```

Note: this plugin does not support streaming.

## Options

#### options.searchRegex : RegExp

Identifies candidate URLs for replacement. Must contain at least one capture group.

Defaults to: `/(?:url\(["']?(.+?)['"]?\)|\s(?:src|href)=["'](.+?)['"])/g`

#### options.urlRegex : RegExp

Tests whether a URL captured from `options.searchRegex` should be replaced.

Defaults to: `/^(?!https?:|\/\/).+\.[^/]+$/`

#### options.docRoot : string

Path to the document root, i.e. the URL "/".

Defaults to: `file.base`

#### options.resolveUrl(url, file, settings) : string

Returns file path corresponding to `url`.

Defaults to: prepends `options.docRoot` for root-relative URLs; prepends `file.dirname` otherwise.

#### options.mapFilePath(filePath, settings) : string

Returns hash lookup key corresponding to `filePath`.

Defaults to: `filePath`

#### options.getFileHash(filePath, settings) : string

Returns hash for `filePath` for inserting into URL.

Defaults to: looks for `filePath` in `options.fileHashes`, if found returns `hashLength` chars.

#### options.fileHashes : object

Maps file paths to hashes.

Defaults to: `{}`

#### options.hashLength : number

Number of characters to inject into URL.

Defaults to: `8`

#### options.formatUrl(url, hash, settings) : string

Inserts `hash` into URL.

Defaults to: inserts `hash` into `url` prior to file extension.

#### Note: `settings`

In callback functions, `settings` refers to the default options, overridden by any given options.

## Example

A complete example with gulp-hasher:

```js
var gulp = require('gulp');
var revUrls = require('gulp-rev-urls');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var hasher = require('gulp-hasher');
var path = require('path');

var revOptions = {
        docRoot: 'src/public',
        fileHashes: hasher.hashes,
        mapFilePath: function (filePath) {
            return path.resolve(filePath);
        },
    };

gulp.task('hash-img', function () {
    return (
        gulp.src('src/**/*.+(jpg|gif|png|svg|ico)')
            .pipe(hasher())
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('min-css', ['hash-img'], function () {
    return (
        gulp.src('src/**/*.css')
            .pipe(revUrls(revOptions))
            .pipe(minifyCss())
            .pipe(hasher())
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('min-js', function () {
    return (
        gulp.src('src/**/*.js')
            .pipe(uglify())
            .pipe(hasher())
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('rev-html', ['hash-img', 'min-css', 'min-js'], function () {
    return (
        gulp.src('src/**/*.html')
            .pipe(revUrls(revOptions))
            .pipe(htmlmin())
            .pipe(gulp.dest('dist'))
    );
});
```

Note: in this example above only the URLs are changed; the filenames remain unchanged. This relies on the web server to strip the hash from URLs and extend the cache expiry, e.g. for Apache:

```
RewriteRule ^(.+\.)[0-9a-f]{8}\.(jpe?g|png|gif|svg|ico|css|js)$   $1$2    [PT,E=revved:1]

Header set Cache-Control "max-age=1200" env=!revved
Header set Cache-Control "max-age=1536000" env=revved
```
