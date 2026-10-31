// 扫描 assets/bgm/ 自动生成离线音乐清单 js/audio-manifest.js
// 用法：node scripts/build-bgm-manifest.js
// GitHub Pages 不会返回目录文件列表，因此静态站点必须通过本清单声明背景音乐。
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bgmDir = path.join(root, 'assets', 'bgm');
const outFile = path.join(root, 'js', 'audio-manifest.js');
const EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

if (!fs.existsSync(bgmDir)) {
  fs.mkdirSync(bgmDir, { recursive: true });
}

const files = fs.readdirSync(bgmDir)
  .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

const list = files.map((f) => `'${f.replace(/'/g, "\\'")}'`).join(', ');
const content = `// 本文件由 scripts/build-bgm-manifest.js 自动生成，请勿手工维护。
// 新增背景音乐：把文件放入 assets/bgm/ 后运行 npm run build:bgm
window.GAME_BGM_FILES=[${list}];
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log(`已扫描 ${files.length} 首背景音乐：`);
files.forEach((f) => console.log(' - ' + f));
console.log('清单写入：' + path.relative(root, outFile));
