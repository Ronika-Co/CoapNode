const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const version = process.env.npm_package_version
if (!version) {
  console.error('npm_package_version not set — run via npm version')
  process.exit(1)
}

const appJsx = path.join(__dirname, '..', 'src', 'renderer', 'src', 'App.jsx')
let content = fs.readFileSync(appJsx, 'utf8')

const updated = content.replace(/CoapNode v\d+\.\d+\.\d+/g, `CoapNode v${version}`)

if (updated === content) {
  console.error(`No version string found in App.jsx (expected "CoapNode vX.Y.Z")`)
  process.exit(1)
}

fs.writeFileSync(appJsx, updated)
execSync(`git add ${appJsx}`)
console.log(`Updated App.jsx version string to v${version} (staged for commit)`)
