/**
 * Wrapper around electron-builder that prevents .DS_Store files
 * from causing ENOTEMPTY errors during universal macOS builds.
 *
 * macOS Finder creates .DS_Store files in the temp build directories,
 * and electron-builder's non-recursive rmdir fails on non-empty dirs.
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')

function cleanTempDirs() {
  if (!fs.existsSync(distDir)) return
  for (const entry of fs.readdirSync(distDir)) {
    if (entry.includes('-temp')) {
      const fullPath = path.join(distDir, entry)
      fs.rmSync(fullPath, { recursive: true, force: true })
    }
  }
}

function runBuild() {
  const hasToken = !!(process.env.GH_TOKEN || process.env.GITHUB_TOKEN)
  const publishFlag = hasToken ? 'always' : 'never'
  if (!hasToken) {
    console.log('  • No GH_TOKEN found, building without publishing to GitHub')
  }
  execFileSync(
    path.join(__dirname, '..', 'node_modules', '.bin', 'electron-builder'),
    ['--mac', '--publish', publishFlag],
    {
      stdio: 'inherit',
      env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'true' }
    }
  )
}

// Clean before build
cleanTempDirs()

try {
  runBuild()
} catch (err) {
  // If the error is ENOTEMPTY on temp dirs, clean up and retry once
  if (err.message && err.message.includes('ENOTEMPTY') && err.message.includes('-temp')) {
    console.log('\n  • Build failed due to .DS_Store in temp dirs, cleaning and retrying...\n')
    cleanTempDirs()
    runBuild()
  } else {
    process.exit(err.status || 1)
  }
}
