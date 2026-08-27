// 生成开发版预览二维码
// 用法: node ci/preview.js
// 需要: ci/private.key (同 upload.js)
const ci = require('miniprogram-ci')
const path = require('path')

const project = new ci.Project({
  appid: 'wx3abc0b4d5ad650c7',
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, '..'),
  privateKeyPath: path.resolve(__dirname, 'private.key'),
  ignores: ['node_modules/**/*'],
})

;(async () => {
  await ci.preview({
    project,
    desc: 'CI预览',
    qrcodeFormat: 'image',
    qrcodeOutputDest: path.resolve(__dirname, 'preview.png'),
    setting: { es6: true, minify: true },
    onProgressUpdate: console.log,
  })
  console.log('预览二维码已生成: ci/preview.png')
})().catch((e) => {
  console.error('预览失败:', e)
  process.exit(1)
})
