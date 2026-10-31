# 网页上传清单（GitHub 不能直接拖文件夹时）

GitHub 网页上传**不支持一次拖入整个文件夹**，也不支持在拖拽时新建目录。正确做法是：先在仓库里"新建目录"，进入该目录后，再一次性把对应文件拖进去。

> 仓库根目录里能直接上传的文件，先全部传完；其余按下面的目录逐个创建。

---

## 第 0 步：创建仓库

1. 登录 GitHub，点右上角 **+ → New repository**
2. 名称填 `monster-push-battle`
3. 选择 **Public**
4. **不要**勾选 "Add a README file"
5. 点 **Create repository**

---

## 第 1 步：上传根目录文件

在仓库首页点 **Add file → Upload files**，把下面这些文件拖进去（只拖文件，不要拖文件夹）：

```text
index.html
README.md
LICENSE
CONTRIBUTING.md
package.json
.gitignore
.gitattributes
.nojekyll
```

然后点 **Commit changes**。

> `.gitignore`、`.gitattributes`、`.nojekyll` 是点开头的隐藏文件。Windows 资源管理器中先在"查看"里勾选"隐藏的项目"才能看到它们。

---

## 第 2 步：新建目录并上传（重复 6 次）

每个目录都按同样的方式操作：

1. 仓库首页点 **Add file → Create new file**
2. 在文件名输入框里输入 **`目录名/`**（末尾带斜杠），GitHub 会自动把它识别为目录
3. 文件名后半段随便填一个临时名字，例如 `placeholder.txt`
4. 点 **Commit changes**
5. 进入刚创建好的目录
6. 点 **Add file → Upload files**，把该目录对应的文件拖进去
7. 点 **Commit changes**
8. 目录里的 `placeholder.txt` 可以打开后点删除按钮删掉

### 目录 1：`css`

```text
style.css
```

### 目录 2：`js`

```text
ai.js
audio-manifest.js
board-core.js
effects.js
game.js
```

### 目录 3：`assets/images`

```text
board-bg.webp
board-blur.webp
favicon.svg
fire-young.webp
fire-adult.webp
water-young.webp
water-adult.webp
forest-young.webp
forest-adult.webp
storm-young.webp
storm-adult.webp
og-cover.jpg
og-cover.webp
```

> 如果你解压出来的 `assets/images` 里还有 `board-bg.png`、`fire-young.png` 等 `.png` 文件，**不要上传**，它们已被 WebP 替代。

### 目录 4：`assets/audio`

```text
bgm.wav
dice.wav
evolve.wav
place-adult.wav
place-young.wav
push.wav
victory.wav
```

### 目录 5：`assets/bgm`

```text
README.md
领地低语.wav
```

> 想加新音乐，把音频文件放进这个目录即可，然后按下文"新增背景音乐"更新清单。

### 目录 6：`scripts`

```text
build-bgm-manifest.js
```

### 目录 7：`.github/workflows`

这是两层目录，创建方式：

1. **Create new file**，文件名输入 `.github/workflows/pages.yml`
2. 粘贴工作流内容 → Commit
3. 再 **Create new file**，文件名输入 `.github/workflows/verify.yml`
4. 粘贴内容 → Commit

两个文件都在 `monster-push-battle/.github/workflows/` 目录下，直接在电脑上打开复制即可。

> `docs` 目录只是 README 里的截图，**可以不上传**，不影响游戏运行。如果要传，程序同上，文件是 `home.webp`。

---

## 第 3 步：开启 GitHub Pages

1. 仓库 → **Settings** → 左侧 **Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. 打开 **Actions** 标签，等待 `Deploy to GitHub Pages` 显示绿色对勾（约 1 分钟）
4. 访问：

```text
https://<你的用户名>.github.io/monster-push-battle/
```

---

## 更省事的替代方案

如果不想手动建一堆目录，用命令行一次全部上传：

```bash
cd monster-push-battle
git add .
git commit -m "feat: 怪兽推推战 v1.0.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/monster-push-battle.git
git push -u origin main
```

该目录已初始化好 Git 仓库，并且只有一个提交，直接推送即可。

---

## 常见问题

**文件名带中文上传失败？**
GitHub 网页上传对中文文件名偶发失败。可把 `领地低语.wav` 改名为 `bgm-main.wav`，再修改 `js/audio-manifest.js`：

```javascript
window.GAME_BGM_FILES=['bgm-main.wav'];
```

游戏里仍会显示 `bgm-main`，需要中文显示名请改用下面的命令生成清单。

**图片仍然加载慢？**
确认上传的是 `.webp` 文件，而不是旧的大尺寸 `.png`。当前棋盘图约 299 KB，8 张棋子合计约 164 KB。

**页面空白？**
打开浏览器开发者工具 Console 看报错。最常见原因是漏传了 `js/` 下的某个文件，或目录层级建错。

---

## 新增背景音乐

1. 把音频文件上传到 `assets/bgm/`
2. 本地运行：

```bash
npm run build:bgm
```

3. 提交更新后的 `js/audio-manifest.js`

> GitHub Pages 不返回目录列表，所以必须靠这份清单。
