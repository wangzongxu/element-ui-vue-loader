var fs = require('fs')
var path = require('path')
var t = require('@babel/types')
var traverse = require('@babel/traverse').default
var babelParser = require('@babel/parser')
var generator = require('@babel/generator').default

var comPath = path.resolve(__dirname, '../node_modules/element-ui/lib')
var components = getComponentNames(comPath)
var componentsRe = makeComponentsRe(components)

module.exports = function(data) {
  var usedComponents = getUsedComponents(data)

  if (usedComponents.length > 0) {
    var script = getScript(data)
    var newScript = addComponentRequire(script, usedComponents)
    return data.replace(script, newScript)
  }
  return data
}

function getComponentNames(comPath) {
  return fs.readdirSync(comPath)
    .filter(name => {
      return (
        name !== 'index.js' &&
        name.indexOf('element-ui') !== 0 &&
        path.extname(name) === '.js'
      )
    })
    .map(name => path.parse(name).name)
}

function makeComponentsRe(components) {
  var re = components
    .map(name => 'el-' + name)
    .sort((a, b) => b.length - a.length)
    .join('|')

  return new RegExp(re, 'g')
}

function unique (arr) {
  var obj = {}
  var result = []

  for (var i = 0; i < arr.length; i++) {
    if (!obj[arr[i]]) {
      obj[arr[i]] = true
      result.push(arr[i])
    }
  }
  return result
}

function getTagContent(tag, content) {
  var re = new RegExp('<' + tag + '[\\w+=\\s"\']*>([\\s\\S]+)<\\/'+ tag +'>', 'g')
  var res =  re.exec(content)
  return (res && typeof res[1] !== 'undefined') ? res[1] : ''
}

function getUsedComponents (data) {
  var template = getTagContent('template', data)
  var names = template.match(componentsRe) || []
  return unique(names)
}

function getScript(data) {
  return getTagContent('script', data)
}

function addComponentRequire(script, usedComponents) {
  var ast = babelParser.parse(script, {
    sourceType: 'module',
    plugins: ['optionalChaining']
  })
  var needImport = usedComponents.map(name => {
    return {
      name: name.split('-').map(startLetterUppercase).join(''),
      path: 'element-ui/lib/' + name.replace(/^el-/, '')
    }
  })

  var hasComponentsField = false
  traverse(ast, {
    Program(path) {
      needImport.forEach(item => {
        var importName = t.identifier(item.name)
        var source = t.stringLiteral(item.path)
        var importDefaultSpecifier = t.importDefaultSpecifier(importName)
        var importDeclaration = t.importDeclaration([importDefaultSpecifier], source)
        path.node.body.unshift(importDeclaration)
      })
    },
    ObjectProperty: function(path) {
      if (t.isIdentifier(path.node.key, { name: 'components' })) {
        hasComponentsField = true
        insertComponents(path.node.value.properties)
      }
    },
    exit(path) {
      if (
        !hasComponentsField &&
        t.isObjectExpression(path.node) &&
        t.isExportDefaultDeclaration(path.parent)
      ) {
        var key = t.identifier('components')
        var value = t.ObjectExpression([])
        var prop = t.objectProperty(key, value)

        path.node.properties.push(prop)
        insertComponents(value.properties)
      }
    }
  })

  function insertComponents(properties) {
    needImport.forEach(item => {
      var key = t.identifier(item.name)
      var value = t.identifier(item.name)
      var prop = t.objectProperty(key, value, false, true)
      properties.push(prop)
    })
  }

  var res = generator(ast)
  return res.code
}

function startLetterUppercase(word) {
  var start = word.slice(0, 1)
  var end = word.slice(1)
  return start.toUpperCase() + end
}
