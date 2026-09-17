# 壁纸资源管理

- 动态壁纸源文件：取自 Wallpaper Engine，复制 `scene.pkg`、`project.json` 等原始文件到本目录
- 解包脚本：`python wallpaper/unpack_wallpaper.py`，输出到 `wallpaper/extracted/`
- 解包产物中 `background.png`（最大 mip）就是首页动态图背景；花瓣粒子由主题 `themes/anime/source/js/home.js` 程序化绘制

## 换壁纸流程（可复用）
1. 把新的壁纸 `scene.pkg` + `project.json` 放进 `wallpaper/`（覆盖同名文件）
2. 运行 `python wallpaper/unpack_wallpaper.py`
3. 把生成的 `wallpaper/extracted/background.png` 压缩后放到 `themes/anime/source/images/background.jpg`
4. 重新 `npx hexo generate` 即可

> 注意：项目根目录的 `scripts/` 在 Hexo 里会被当作 JS 插件加载，所以解包脚本放在本目录而不放 scripts/。
