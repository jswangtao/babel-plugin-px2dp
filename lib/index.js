const { declare } = require("@babel/helper-plugin-utils");
const path = require("path");
const { keyNameList } = require("./const");
var localDimensions = "Dimensions"; // 本地Dimensions的引用名称

const defaultOptions = {
  uiWidth: 750,
  includes: [],
  excludes: ["node_modules"],
  superIncludes: []
};

const plugin = declare((api, opts) => {
  // 断言babel为7,否则报错
  api.assertVersion(7);
  const { types, template } = api;
  // 组装参数
  let options = {
    ...opts,
    uiWidth: opts.uiWidth || defaultOptions.uiWidth,
    includes: opts.includes
      ? Array.from(new Set([...defaultOptions.includes, ...opts.includes]))
      : defaultOptions.includes,
    superIncludes: opts.superIncludes
      ? Array.from(new Set([...defaultOptions.superIncludes, ...opts.superIncludes]))
      : defaultOptions.superIncludes,
    excludes: opts.excludes
      ? Array.from(new Set([...defaultOptions.excludes, ...opts.excludes]))
      : defaultOptions.excludes
  };

  return {
    visitor: {
      Program(path, state) {
        let isPlugin = false;
        isPlugin = filterFileName(state.filename, options);

        if (isPlugin) {
          let importList = path.node.body || [];
          // 去掉原Dimensions引用
          importList.forEach(item => {
            // 找到import并且是reacat-native的节点
            if (item.type === "ImportDeclaration" && item.source.value === "react-native") {
              item.specifiers.forEach((y, i) => {
                if (y.imported.name === localDimensions) {
                  item.specifiers.splice(i, 1);
                }
              });
            }
          });

          // 添加 import { Dimensions } from "react-native";
          importList.unshift(
            types.importDeclaration(
              [types.importSpecifier(types.identifier(localDimensions), types.identifier(localDimensions))],
              types.stringLiteral("react-native")
            )
          );
        }
      },
      Property(path, state) {
        let isPlugin = false;
        isPlugin = filterFileName(state.filename, options);
        if (isPlugin) {
          // 如果是默认的属性需要转换，并且是 number节点 1 、函数表达式 200 + 200、变量取值obj.a，则转换
          if (
            keyNameList.includes(path.node.key.name) &&
            // number节点 1
            types.isNumericLiteral(path.node.value)
            // 函数表达式 200 + 200
            // types.isBinaryExpression(path.node.value) ||
            // 变量取值obj.a
            // types.isMemberExpression(path.node.value) ||
          ) {
            // 如果有前注释或者后注释就跳过
            if (path.node.leadingComments || path.node.trailingComments) {
              return;
            }
            // 表达式中不包含px2dp，不包含Dimensions，才转换
            if (path.toString().indexOf("px2dp") === -1 && path.toString().indexOf(localDimensions) === -1) {
              // 找到第一个 : 的位置
              const colonIndex = path.toString().indexOf(":");
              let ast = types.objectProperty(
                types.identifier(path.node.key.name),
                template.expression(
                  `${localDimensions}.get('window').width * ( ${path.toString().slice(colonIndex + 1)} ) / ${
                    options.uiWidth
                  }`,
                  { placeholderPattern: false }
                )()
              );
              path.replaceWith(ast);
              // 如果不调用跳过会导致死循环replaceWith的节点
              path.skip();
            }
          }
        }
      },
      StringLiteral(path, state) {
        let isPlugin = false;
        isPlugin = filterFileName(state.filename, options);
        if (isPlugin) {
          // 如果是 string节点，并且带有rpx单位
          // 30rpx或30.5rpx或-30.5rpx这种的都可以被检测到
          if (/^(-|)\d+((\.\d+)|)rpx$/.test(path.node.value)) {
            var result = path.node.value.split("rpx")[0];
            let ast = template.expression(
              `${localDimensions}.get('window').width * ( ${result} ) / ${options.uiWidth}`
            )();
            path.replaceWith(ast);
            // 如果不调用跳过会导致死循环replaceWith的节点
            path.skip();
          }
        }
      },
      TemplateLiteral(path, state) {
        let isPlugin = false;
        isPlugin = filterFileName(state.filename, options);
        if (isPlugin) {
          // `${fontSize}rpx`可以被检测到
          // /^\${[0-9a-zA-Z_]+}rpx$/.test(`${fontSize}rpx`)
          // 模板字符串
          var templateStr = path.toString();
          if (/^`\${[\s\S]*}rpx`$/.test(templateStr)) {
            var startIndex = templateStr.indexOf("{");
            var endIndex = templateStr.lastIndexOf("}");
            // 截取模板中的变量
            var result = templateStr.slice(startIndex + 1, endIndex);
            let ast = template.expression(
              `${localDimensions}.get('window').width * ( ${result} ) / ${options.uiWidth}`
            )();
            path.replaceWith(ast);
            // 如果不调用跳过会导致死循环replaceWith的节点
            path.skip();
          }
        }
      }
    }
  };
});

// 根据路径判断哪些插件的作用区域，excludes的优先级高于 includes
function filterFileName(filename, options) {
  // 处理Mac和windows路径是斜杠和反斜杠问题，统一为 斜杠
  filename = filename.split(path.sep).join("/");
  let flag = false;
  // 包含
  options.includes.forEach(inc => {
    // 路径里面进行筛选
    if (filename?.indexOf(inc) !== -1) {
      flag = true;
    }
  });
  // 排除
  options.excludes.forEach(exc => {
    // 路径里面进行筛选
    if (filename?.indexOf(exc) !== -1) {
      flag = false;
    }
  });
  // 包含(一般不用)
  options.superIncludes.forEach(inc => {
    // 路径里面进行筛选
    if (filename?.indexOf(inc) !== -1) {
      flag = true;
    }
  });
  return flag;
}

module.exports = plugin;
