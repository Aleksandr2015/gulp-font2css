'use strict'

import path from 'path'
import fontStyleKeywords from 'css-font-style-keywords'
import fontWeightKeywords from 'css-font-weight-keywords'
import fontWeightNames from 'css-font-weight-names'
import mime from 'mime'
import through from 'through2'
import util from 'gulp-util'

/**
 * Extract the `font-family` from the font's file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-family` property and value.
 */
function getFontFamily(basename) {
  return `font-family:"${basename.split('-').shift()}";`
}

/**
 * Guess the `font-style` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-style` property and guessed value.
 */
function guessFontStyle(basename) {
  return basename
    .split('-')
    .slice(1)
    .map(item => item.toLowerCase())
    .reduce((prev, item) => {
      if (fontStyleKeywords.indexOf(item) >= 0) {
        return `font-style:${item};`
      }

      return prev
    }, '')
}

/**
 * Guess the `font-weight` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-weight` property and guessed value.
 */
function guessFontWeight(basename) {
  return basename
    .split('-')
    .slice(1)
    .map(item => item.toLowerCase())
    .reduce((prev, item) => {
      if (item === 'normal') {
        return prev
      }

      if (fontWeightNames[item]) {
        return `font-weight:${fontWeightNames[item]};`
      }

      if (fontWeightKeywords.indexOf(item) >= 0) {
        return `font-weight:${item};`
      }

      return prev
    }, '')
}

/**
 * Convert file contents to a Base64-encoded data: URL.
 * @param  {Object} file File object.
 * @return {String}      Base64-encoded contents inside a `data:` URL.
 */
function getSrc(file) {
  const encodedContents = new Buffer(file.contents).toString('base64')
  return `src:url(data:${mime.lookup(file.path)};charset=utf-8;base64,${encodedContents});`
}

/**
 * Convert fonts to CSS using Gulp.
 *
 * Encodes font files in Base64 inside a CSS `@font-face` rule. The plugin
 * attempts to guess `font-family`, `font-style` and  `font-weight` attributes
 * from the name of each file provided.
 *
 * @return {Object} CSS file object.
 */
function font2css() {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.push(file)
      return callback()
    }

    if (file.isStream()) {
      this.emit('error', new util.PluginError('gulp-font2css', 'Streaming is not supported'))
      return callback()
    }

    if (file.isBuffer()) {
      const basename = path.basename(file.path, path.extname(file.path))

      const attributes = [
        getFontFamily(basename),
        guessFontStyle(basename),
        guessFontWeight(basename),
        getSrc(file)
      ]

      const contents = `@font-face{${attributes.join('')}}`

      file.contents = new Buffer(contents)
      file.path     = util.replaceExtension(file.path, '.css')

      return callback(null, file)
    }
  })
}

export default font2css
