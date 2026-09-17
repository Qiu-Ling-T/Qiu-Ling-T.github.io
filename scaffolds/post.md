---
title: {{ title }}
date: {{ date }}
# 封面图：把原图丢进 source/images/covers/，跑一次 npm run images（= python tools/optimize_images.py），
# 脚本会打印这两行该填什么；主图过宽会自动缩到 1920，原图备份到 assets/covers/
cover:
# 卡片缩略图：填脚本生成的同名 -thumb 版本，如 /images/covers/xxx-thumb.jpg；留空则首页退回用 cover
cover_thumb:
# 横幅取景（只影响文章页顶部那条横幅，可留空用主题默认的 center 30%）：
#   头部靠上的图 → 25%~35%；头部居中的图 → 50%；头部靠下的图 → 60%~75%
#   也可以写 top / bottom / center 25%；改完 hexo g 刷新浏览器看效果即可
cover_position:
# 分类：从下面四个里选一个填：
#   动画 / 游戏 / 生活 / 技术
categories:
tags:
---