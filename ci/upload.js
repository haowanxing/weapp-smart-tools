// 上传体验版 / 开发版脚本
// 用法: node ci/upload.js [version] [desc]
//   node ci/upload.js 1.0.0 "MQTT工具"
// 需要: 从微信公众平台下载的代码上传密钥, 放到 ci/private.key
// 并把本机公网IP加入公众平台的IP白名单
const ci = require('miniprogram-ci')
const path = require('path')

const version = process.argv[2] || '1.0.0'
const desc = process.argv[3] || `CI上传 ${version}`

const project = new ci.Project({
  appid: 'wx3abc0b4d5ad650c7',
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, '..'),
  privateKeyPath: path.resolve(__dirname, 'private.key'),
  ignores: ['node_modules/**/*'],
})

;(async () => {
  const result = await ci.upload({
    project,
    version,
    desc,
    setting: {
      es6: true,
      minify: true,
      // 小程序使用了 npm, 需要在上传时构建 npm
      // ci 会自动读取 project.config.json 的 packNpm 设置
    },
    onProgressUpdate: console.log,
  })
  console.log('上传完成:', JSON.stringify(result, null, 2))
})().catch((e) => {
  console.error('上传失败:', e)
  process.exit(1)
})
