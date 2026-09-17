# -*- coding: utf-8 -*-
"""
图片优化脚本（可复用）

把超大原图预先缩到「接近实际显示尺寸」，消除浏览器缩图产生的锯齿和颗粒感，
顺带把体积降下来（封面 4.3MB -> 150KB 左右）。

日常用法只有两步:
  1. 把封面原图丢进 source/images/covers/
  2. 运行 python tools/optimize_images.py（等价于 npm run images）

脚本会自动做这些事:
  * 扫描 source/images/covers/，凡是没有对应 -thumb 的图，都补一张卡片缩略图
  * 主图宽度超过 1920 时，先把原图备份到 assets/covers/，再把主图缩到 1920
    （主图只用于文章页横幅，1920 足够；备份目录不会被打包进站点）
  * 顺手把头像（首页 hero 130px / 侧栏 84px，出 1x+2x）和默认壁纸的卡片缩略图一起生成

选项:
  --check       只报告要做什么，不写文件
  --force       已存在的缩略图也重新生成
  --no-shrink   只补缩略图，不动主图尺寸

新增封面后，文章的 front-matter 这样写（也可以用不带 -thumb 的那张当 cover_thumb）:
  cover: /images/covers/xxx.jpg
  cover_thumb: /images/covers/xxx-thumb.jpg

注意：根目录 scripts/ 会被 Hexo 当作 JS 插件加载，所以本脚本放在 tools/ 下。
"""
import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("需要 Pillow：pip install pillow")

COVERS_DIR = Path("source/images/covers")   # 封面目录：原图丢这里
COVERS_URL = "/images/covers"               # 对应的站点路径
BACKUP_DIR = Path("assets/covers")          # 过大主图的原图备份（不打包进站点）
THUMB_SIZE = (760, 523)                     # 卡片缩略图，16:11 对应 .post-card，约 2 倍显示尺寸
MAX_WIDTH = 1920                            # 主图最大宽度（文章页横幅用）
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
JPEG_OPTS = dict(optimize=True, progressive=True, subsampling=0)  # 4:4:4 保留彩色描边细节

# 固定任务：src 原图 / dst 产物 / size 目标尺寸 / quality JPEG 质量 / crop 是否按比例居中裁剪
JOBS = [
    # 头像：首页 hero 显示 130px、侧栏 84px，所以 1x 出 160、2x 出 320
    dict(src="assets/avatar.jpg", dst="themes/anime/source/images/avatar.jpg",
         size=(160, 160), quality=90, crop=True),
    dict(src="assets/avatar.jpg", dst="themes/anime/source/images/avatar@2x.jpg",
         size=(320, 320), quality=90, crop=True),
    # 默认壁纸的卡片缩略图：没写 cover 的文章，首页卡片退回用这张
    dict(src="wallpaper/extracted/background.png",
         dst="themes/anime/source/images/background-thumb.jpg",
         size=THUMB_SIZE, quality=86, crop=True),
]


def center_crop(im, ratio):
    """按目标宽高比居中裁剪（和 CSS background-size: cover 的取景一致）。"""
    w, h = im.size
    if w / h > ratio:                      # 原图更宽，裁左右
        nw = round(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio)                  # 原图更高，裁上下
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def load(path):
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def save(im, path, quality):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=quality, **JPEG_OPTS)


def kb(path):
    return path.stat().st_size / 1024


def process_job(job, check=False, force=False):
    """固定任务：按给定尺寸生成一张图（产物比原图新就跳过）。"""
    src, dst = Path(job["src"]), Path(job["dst"])
    tw, th = job["size"]
    if not src.exists():
        print("  跳过（原图缺失）：%s" % src)
        return False
    if check:
        print("  待生成：%s -> %s  %dx%d" % (src, dst, tw, th))
        return True
    if dst.exists() and not force and dst.stat().st_mtime >= src.stat().st_mtime:
        print("  已是最新：%s" % dst.name)
        return True
    im = load(src)
    sw, sh = im.size
    if job.get("crop", True):
        im = center_crop(im, tw / th)
    save(im.resize((tw, th), Image.LANCZOS), dst, job.get("quality", 85))
    print("  %s %dx%d -> %s %dx%d  %.0fKB -> %.0fKB"
          % (src.name, sw, sh, dst.name, tw, th, kb(src), kb(dst)))
    return True


def shrink_main(main, im, check=False):
    """主图过宽时：先备份原图，再缩到 MAX_WIDTH。返回是否处理过。"""
    if im.width <= MAX_WIDTH:
        return False
    if main.suffix.lower() not in (".jpg", ".jpeg"):
        print("  提示：%s 宽 %d 超过 %d 且不是 jpg，建议转成 jpg 再放进来（本次不改动）"
              % (main.name, im.width, MAX_WIDTH))
        return False
    if check:
        print("  待缩主图：%s %dx%d -> 宽 %d" % (main.name, im.width, im.height, MAX_WIDTH))
        return True
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup = BACKUP_DIR / main.name
    shutil.copy2(main, backup)             # 原图原样备份，之后可重新生成任意尺寸
    nh = round(im.height * MAX_WIDTH / im.width)
    save(im.resize((MAX_WIDTH, nh), Image.LANCZOS), main, 84)
    print("  主图 %dx%d -> %dx%d（原图备份到 %s）" % (im.width, im.height, MAX_WIDTH, nh, backup))
    return True


def scan_covers(args):
    """扫描封面目录：补缩略图（必要时先把过大的主图缩掉）。"""
    if not COVERS_DIR.is_dir():
        print("  目录不存在：%s" % COVERS_DIR)
        return
    mains = sorted(p for p in COVERS_DIR.rglob("*")
                   if p.is_file() and p.suffix.lower() in EXTS
                   and not p.stem.endswith("-thumb"))
    if not mains:
        print("  目录里还没有图片")
        return

    for main in mains:
        rel = main.relative_to(COVERS_DIR)
        thumb = main.with_name(main.stem + "-thumb.jpg")
        im = load(main)
        print("* %s  %dx%d  %.0fKB" % (rel, im.width, im.height, kb(main)))

        if not args.no_shrink:
            shrink_main(main, im, args.check)

        fresh = thumb.exists() and thumb.stat().st_mtime >= main.stat().st_mtime
        if fresh and not args.force:
            print("  缩略图已是最新：%s" % thumb.name)
            continue
        if args.check:
            print("  待生成缩略图：%s  %dx%d" % (thumb.name, *THUMB_SIZE))
            continue
        im = center_crop(im, THUMB_SIZE[0] / THUMB_SIZE[1])
        save(im.resize(THUMB_SIZE, Image.LANCZOS), thumb, 86)
        print("  缩略图 %s  %dx%d  %.0fKB" % (thumb.name, *THUMB_SIZE, kb(thumb)))
        print("  front-matter: cover: %s/%s\n"
              "                cover_thumb: %s/%s"
              % (COVERS_URL, rel.as_posix(), COVERS_URL,
                 thumb.relative_to(COVERS_DIR).as_posix()))


def main():
    ap = argparse.ArgumentParser(description="把原图预缩到接近显示尺寸，自动补卡片缩略图")
    ap.add_argument("--check", action="store_true", help="只报告要做什么，不写文件")
    ap.add_argument("--force", action="store_true", help="已存在的缩略图也重新生成")
    ap.add_argument("--no-shrink", action="store_true", help="只补缩略图，不改主图尺寸")
    args = ap.parse_args()

    if not Path("_config.yml").exists():
        sys.exit("请在博客根目录运行本脚本")

    print("== 固定任务（头像 / 壁纸缩略图）==")
    process_job_list = [process_job(job, args.check, args.force) for job in JOBS]
    print("  就绪 %d/%d" % (sum(process_job_list), len(JOBS)))

    print("\n== 扫描 %s ==" % COVERS_DIR)
    scan_covers(args)
    print("\n全部完成%s" % ("（--check 模式，未写文件）" if args.check else ""))


if __name__ == "__main__":
    main()
