"use strict";

var Through = require('through2');
var Assign = require('object-assign');
var Path = require('path');
var Url = require('url');

var PLUGIN_NAME = 'gulp-rev-urls';

module.exports = revUrls;

var defaults = {
        manifest: {},
        parse: parseJson,
        transform: null,
        pattern: /(?:url\(["']?(.+?)['"]?\)|\s(?:src|href)=["'](.+?)['"])/g,
        revise: reviseUrl,
        docRoot: null,
        debug: false,
    };

function revUrls(options) {
    var settings = Assign({}, defaults, options);
    var manifest = settings.manifest;

    if (typeof manifest == 'string') {
        var contents = require('fs').readFileSync(manifest, 'utf8');
        manifest = settings.parse(contents, settings);
    }

    if (settings.transform) {
        var obj = {};
        for (var key in manifest) {
            settings.transform(obj, key, manifest[key], settings);
        }
        manifest = obj;
    }

    if (settings.debug) { console.log("Manifest:", manifest); }

    return Through.obj(function (file, enc, cb) {
        if (file.isStream()) {
            throw new Error(PLUGIN_NAME + ': Streams not supported');
        }
        if (file.isBuffer() && !file.isNull()) {
            replaceContents(file, manifest, settings);
        }
        cb(null, file);
    });
}


function parseJson(contents, settings) {
    return JSON.parse(contents);
}

function replaceContents(file, manifest, settings) {
    var baseUrl = Url.resolve('/', Path.relative(settings.docRoot || file.base, file.path));
    if (settings.debug) { console.log(baseUrl, ':'); }

    file.contents = new Buffer(
        String(file.contents).replace(settings.pattern, function (match) {
            for (var i = 1; i < arguments.length; i++) {
                if (arguments[i]) {
                    return replaceMatch(arguments[i], match, baseUrl, manifest, settings);
                }
            }
        })
    );
}

function replaceMatch(origUrl, match, baseUrl, manifest, settings) {
    var fullUrl = Url.resolve(baseUrl, origUrl);
    var revUrl = settings.revise(origUrl, fullUrl, manifest, settings);
    if (settings.debug && origUrl !== revUrl) {
        console.log('\t', origUrl, '==>', revUrl);
    }
    return match.replace(origUrl, revUrl);
}

function reviseUrl(origUrl, fullUrl, manifest, settings) {
    return manifest[fullUrl] || origUrl;
}
