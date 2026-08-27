// 强制 IPv4 出口：直连若走本地 IPv6 会被微信 IP 白名单拒绝(errCode -10008)
// 给 dns.lookup 打补丁固定 family:4，比 setDefaultResultOrder 更彻底
;(function forceDirectIPv4() {
  // 清除代理，强制直连（代理侧可能走本地 IPv6，绕过下面的 dns 补丁）
  ;['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy'].forEach(k => delete process.env[k])
  process.env.NO_PROXY = '*'
  process.env.no_proxy = '*'
  const dns = require('dns')
  const patch = (obj, key) => {
    const orig = obj[key]
    obj[key] = function (hostname, options, cb) {
      if (typeof options === 'function') { cb = options; options = {} }
      if (typeof options === 'number') { options = { family: options } }
      options = Object.assign({}, options, { family: 4 })
      return orig.call(this, hostname, options, cb)
    }
  }
  try { patch(dns, 'lookup') } catch (e) {}
  try { if (dns.promises) patch(dns.promises, 'lookup') } catch (e) {}
})()

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
  ignores: ['node_modules/**/*', 'ci/**/*'],
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
