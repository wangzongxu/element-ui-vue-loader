## element-ui-vue-loader

用于在vue文件中自动按需加载Element-ui组件的webpack loader

## 用法

```js
// webpack.config.js
{
  rules: [
    {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: { /* vue-loader config */ }
    },
    { // 需要放在vue-loader下边
      test: /\.vue$/,
      loader: 'element-ui-vue-loader'
    }
  ]
}
```