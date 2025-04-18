const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: '/',
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'index.html',
      filename: 'index.html'
    }
  }
}) 