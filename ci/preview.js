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
