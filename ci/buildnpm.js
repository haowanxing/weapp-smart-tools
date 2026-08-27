const ci = require('miniprogram-ci')
const path = require('path')
ci.packNpmManually({
  packageJsonPath: path.resolve(__dirname, '..', 'package.json'),
  miniprogramNpmDistDir: process.argv[2] || path.resolve(__dirname, '..'),
}).then(r => console.log('构建结果:', JSON.stringify(r))).catch(e => { console.error(e); process.exit(1) })
