# `@jswangtao/babel-plugin-px2dp`

这是一个自动添加适配算法的 babel 插件，可以将项目中形如这种写法

```
import React from "react";
import { View, StyleSheet } from "react-native";

function STATUSBAR_HEIGHT() {
  return 60;
}

export const Test = () => {
  const fontSize = 10 + 10;
  return (
    <View
      size={`${10 + 10}rpx`}
      fontSize={`${fontSize}rpx`}
      style={[
        styles.container,
        { marginTop: px2dp(124) + STATUSBAR_HEIGHT() },
        { marginTop: 124 + STATUSBAR_HEIGHT() }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    fontSize: "10rpx",

    height: 200 + 200,
    minWidth: textW,
    backgroundColor: "pink"
  }
});


```

装换为

```
import { Dimensions } from "react-native";
import React from "react";
import { View, StyleSheet } from "react-native";
function STATUSBAR_HEIGHT() {
  return 60;
}
export const Test = () => {
  const fontSize = 10 + 10;
  return <View
            size={Dimensions.get('window').width * (10 + 10) / 750}
            fontSize={Dimensions.get('window').width * fontSize / 750}
            style={[
              styles.container,
              {marginTop: px2dp(124) + STATUSBAR_HEIGHT()},
              {marginTop: Dimensions.get('window').width * (124 + STATUSBAR_HEIGHT()) / 750}
            ]}>
        </View>;
};
const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width * 200 / 750,
    height: Dimensions.get('window').width * (200 + 200) / 750,
    fontSize: Dimensions.get('window').width * 10 / 750,
  }
});
```

相当于针对特定样式属性，比如 width,height,进行自动适配，支持 形如

```
10、"10rpx"、`${10 + 10}rpx`，
```

注意：凡是带有 px2dp 的字符和有前注释和后注释的都不转换 形如:

```
px2dp(10)

// position: 'absolute',
   bottom: 0,
// position: 'absolute',
```

## 如何使用

```
yarn add @jswangtao/babel-plugin-px2dp
```

在 babel.config.js 中添加插件配置

```
 [
  "@jswangtao/px2dp",
    {
      uiWidth: 750, // ui设计稿宽度
      includes: ["pages"], // 插件生效的文件夹
      excludes: []      // 插件不生效的文件夹
    }
 ]
```
