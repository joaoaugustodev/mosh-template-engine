const fs = require('fs')

const defaultFilters = require('./bin/filters')
const compose = require('./bin/compose')

/**
 * The main function, it's the mosh function when imports.
 * @param basedir
 * @param ext
 * @param filters
 * @return {Object}
 */
module.exports = (basedir = '', { ext = '.mh', filters = {} }) => {
  const store = {}

  /**
   * Helper for the pipeMosh function
   * @param data
   * @return {Function}
   */
  function mapHelper (data) {
    return function (fun) {
      new Function(`with (this) { return ${fun} }`).call(data)
    }
  }

  /**
   * Make the pipeLine (filter) in template  engine
   * @param data
   * @return {function(*, *): string}
   */
  function pipeMosh (data) {
    return function (match, info) {
      data.fns = info .split('|').slice(1).map(item => item.trim()).map(mapHelper(data))
      const key = info.split('|')[0].trim()
      return !data.fns.length ? `{{ ${key} }}` : `{{ compose(...fns)(${key}) }}`
    }
  }

  /**
   * Compile the file requested
   * @param str
   * @param data
   * @return {String}
   */
  function compile (str, data) {
    return new Function('obj',`
      var arr = []

      with(obj) {
         arr.push('${str
          .replace(/{{\s?(.*)\s?}}/g, pipeMosh(data))
          .replace(/@/g, '<% ')
          .replace(/endforEach|endforeach|endeach/g, '}); %>')
          .replace(/endfor|endif|endswitch/g, '} %>')
          .replace(/\.forEach\((.*?)\):/g, '.forEach(function($1) { %>')
          .replace(/\)\s?:/g, ') { %>')
          .replace(/{{\s?/g, '<%= ')
          .replace(/\s?}}/g, ' %>')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\}\);/g, '});')
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("arr.push('")
          .split("\r").join("\\'")} ')
      }

      return arr.join('').trim()
    `)(data)
  }

  /**
   * Function render the template
   * @param path
   * @param data
   * @return {String}
   */
  store.render = function (path, data) {
    const copyData = Object.assign({}, data, defaultFilters, filters)
    const content = fs.readFileSync(basedir.concat(path, ext), 'utf-8')
    return compile(content, copyData)
  }

  /**
   * This function it's a middleware for the express, it's a very simple to use.
   * @param req
   * @param res
   * @param next
   */
  store.express = function (req, res) {
    res.render = (path, data) => {
      const copyData = Object.assign({}, data, compose, defaultFilters, filters)
      const content = fs.readFileSync(basedir.concat(path, ext), 'utf-8')
      res.setHeader('content-type', 'text/html')
      res.end(compile(content, copyData))
    }
  }

  return store
}
