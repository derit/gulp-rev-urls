"use strict";

var through = require('through2');
var assign = require('object-assign');
var path = require('path');

var PLUGIN_NAME = 'gulp-rev-urls';

module.exports = revUrls;

var defaults = {
        searchRegex: /(?:url\(["']?(.+?)['"]?\)|\s(?:src|href)=["'](.+?)['"])/g,
        urlRegex: /^(?!https?:|\/\/).+\.[^/]+$/,
        docRoot: null,
        resolveUrl: resolveUrl,
        mapFilePath: mapFilePath,
        getFileHash: getFileHash,
        fileHashes: {},
        hashLength: 8,
        formatUrl: formatUrl,
    };

function revUrls(options) {

    var settings = assign({}, defaults, options);

    return through.obj(function (file, enc, cb) {

        if (file.isStream()) {
            throw new Error(PLUGIN_NAME + ': Streams not supported');
        }

        if (file.isBuffer() && !file.isNull()) {
            replaceContents(file, settings);
        }
        cb(null, file);
    });
}

function replaceContents(file, settings) {
    file.contents = new Buffer(
        String(file.contents).replace(settings.searchRegex, function (match) {
            for (var i = 1; i < arguments.length; i++) {
                if (arguments[i]) {
                    return replaceUrl(arguments[i], match, file, settings);
                }
            }
        })
    );
}

function replaceUrl(url, match, file, settings) {
    if (!settings.urlRegex || settings.urlRegex.test(url)) {
        var filePath = settings.resolveUrl(url, file, settings);
        var mappedPath = settings.mapFilePath(filePath, settings);
        var hash = settings.getFileHash(mappedPath, settings);
        if (hash) {
            var newUrl = settings.formatUrl(url, hash, settings);
            return match.replace(url, newUrl);
        }
    }
    return match;
}

function resolveUrl(url, file, settings) {
    var urlPath = url.replace(/[?#].*$/, '');
    var basePath = urlPath.charAt(0) == '/' ? settings.docRoot || file.base : path.dirname(file.path);
    return path.join(basePath, urlPath);
}

function mapFilePath(filePath, settings) {
    return filePath;
}

function getFileHash(filePath, settings) {
    var hash = settings.fileHashes[filePath];
    return hash && hash.substr(0, settings.hashLength);
}

function formatUrl(url, hash, settings) {
    var dotIndex = url.lastIndexOf('.');
    return url.substr(0, dotIndex) + '.' + hash + url.substr(dotIndex);
}
