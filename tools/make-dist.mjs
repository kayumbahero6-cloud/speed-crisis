// Copies only the files the website needs into dist/ (so node_modules etc. are not published).
import fs from 'fs';
fs.rmSync('dist', { recursive: true, force: true }); fs.mkdirSync('dist', { recursive: true });
for (const f of ['index.html', 'css', 'js', 'icons', 'assets', 'sw.js', 'manifest.webmanifest']) if (fs.existsSync(f)) fs.cpSync(f, 'dist/' + f, { recursive: true });
console.log('dist ready');
