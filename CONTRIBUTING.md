# 贡献指南

感谢你对 **怪兽推推战** 的兴趣！以下约定可以帮助改动更快被合并。

## 开发环境

项目是纯静态站点，无需构建步骤：

```bash
python3 -m http.server 8080
# 或
npx serve .
```

打开 <http://localhost:8080> 即可调试。

## 目录职责

| 路径 | 职责 | 修改注意 |
|------|------|----------|
| `js/board-core.js` | 纯棋盘规则内核 | 不依赖 DOM；游戏与 AI 共用，改动必须同时通过两者测试 |
| `js/ai.js` | AI 评估与搜索 | 依据真实局面评分，避免只按落点打分 |
| `js/game.js` | 回合流程与渲染 | 保持「胜负 → 进化 → 推动」的结算顺序 |
| `js/effects.js` | 视觉特效 | 不影响游戏状态 |
| `css/style.css` | 样式 | 需兼顾移动端宽度 |
| `index.html` | 页面结构 | 逻辑不要写进 HTML |

## 提交前自检

```bash
npm run check      # JavaScript 语法检查
npm run build:bgm  # 若增删了背景音乐
```

CI 会额外校验资源完整性与音乐清单是否最新。

## 规则约定

改动规则时请同步更新：

1. `index.html` 中的游戏规则弹窗
2. `README.md` 的「游戏规则」章节
3. 棋盘内核与 AI 的评估逻辑（如涉及）

## 代码风格

- 使用 2 空格缩进与 ES2017+ 语法
- 新增函数请附一句中文注释说明用途
- 不引入运行时代理、框架或外部 CDN 依赖，保持零依赖可离线运行

## 提交信息

推荐使用 Conventional Commits：

```text
feat: 新增夺旗模式
fix: 修正成年体三连未即时判胜
docs: 补充音乐清单说明
```

## 素材要求

- 棋盘与棋子图片放入 `assets/images/`，建议正方形、PNG
- 音效放入 `assets/audio/`，命名为 `place-young`、`place-adult`、`push`、`dice`、`evolve`、`victory`
- 背景音乐放入 `assets/bgm/`，并运行 `npm run build:bgm`
- 请勿提交来源不明的版权素材
