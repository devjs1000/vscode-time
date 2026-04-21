const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const watch = process.argv.includes('--watch');

function copyCSS() {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync(
    path.join('src', 'webview', 'styles.css'),
    path.join('dist', 'webview.css')
  );
}

const baseConfig = {
  bundle: true,
  minify: !watch,
  sourcemap: watch,
};

const extensionConfig = {
  ...baseConfig,
  platform: 'node',
  format: 'cjs',
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
};

const webviewConfig = {
  ...baseConfig,
  platform: 'browser',
  format: 'iife',
  entryPoints: ['src/webview/main.ts'],
  outfile: 'dist/webview.js',
};

if (watch) {
  copyCSS();
  Promise.all([
    esbuild.context(extensionConfig).then(ctx => ctx.watch()),
    esbuild.context(webviewConfig).then(ctx => ctx.watch()),
  ]).then(() => console.log('Watching...'));
} else {
  copyCSS();
  Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(webviewConfig),
  ]).then(() => console.log('Build complete'));
}
