# -*- coding: utf-8 -*-
"""
wallpaper 解包脚本（可复用）

把 Wallpaper Engine / Lively 的动态壁纸包（scene.pkg, PKGV0024 格式）解包成
博客可用的静态资源：
  1. 解析 PKGV0024 文件表（[name_len][name][field][size]，数据按表顺序累积排列）
  2. 提取所有文件（scene.json / materials / particles / .tex …）
  3. .tex 是自定义贴图格式（TEXV0005/TEXI0001/TEXB0004），内嵌 4 张完整 PNG
     mip（例如 2560/1280/640/320），按 PNG chunk 边界完整提取每一张
  4. 把最大的一张 mip 复制为 background.png 作为首页背景

换壁纸流程：把新的 scene.pkg + project.json 放进 wallpaper/，重跑本脚本，
把输出的 background.png 拷到主题资源目录即可（粒子动画参数在 theme 里按需微调）。

用法:
  python wallpaper/unpack_wallpaper.py \
      --pkg wallpaper/scene.pkg \
      --out wallpaper/extracted
"""
import argparse
import os
import struct
import sys
from pathlib import Path

PKG_MAGIC = b"PKGV0024"
PNG_SIG = b"\x89PNG\r\n\x1a\n"


def parse_pkg(data: bytes):
    """返回 [(name, size)]，且确认 magic；数据区 = 文件表结束后按 size 累积。"""
    if data[4:12] != PKG_MAGIC:
        raise ValueError("不是 PKGV0024 壁纸包，magic = %r" % data[4:12])
    count = struct.unpack_from("<I", data, 12)[0]
    off = 16
    entries = []
    for _ in range(count):
        nl = struct.unpack_from("<I", data, off)[0]
        off += 4
        name = data[off : off + nl].decode("utf-8", "replace")
        off += nl
        field = struct.unpack_from("<I", data, off)[0]
        off += 4
        size = struct.unpack_from("<I", data, off)[0]
        off += 4
        entries.append((name, field, size))
    start = off
    for name, _, size in entries:
        if start + size > len(data):
            raise ValueError("文件 %r 越界" % name)
        start += size
    return entries, off


def extract_pngs(data: bytes):
    """在 bytes 中定位所有 PNG 签名，并按 chunk 边界切出完整 PNG。"""
    pngs = []
    i = 0
    while True:
        i = data.find(PNG_SIG, i)
        if i < 0:
            break
        p = i + len(PNG_SIG)
        while True:
            if p + 8 > len(data):
                break
            (clen,) = struct.unpack_from(">I", data, p)
            ctype = data[p + 4 : p + 8]
            p += 8 + clen + 4  # 跳过 type+data+crc
            if ctype == b"IEND":
                pngs.append(data[i:p])
                break
        i += 1
    return pngs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkg", default="wallpaper/scene.pkg")
    ap.add_argument("--out", default="wallpaper/extracted")
    args = ap.parse_args()

    pkg_path = Path(args.pkg)
    out = Path(args.out)
    if not pkg_path.exists():
        sys.exit("找不到 %s" % pkg_path)
    data = pkg_path.read_bytes()

    print("== 解析 %s (%d 字节) ==" % (pkg_path, len(data)))
    entries, table_end = parse_pkg(data)
    print("  文件表结束 @ %d，共 %d 个文件" % (table_end, len(entries)))

    pos = table_end
    png_out = []
    for name, field, size in entries:
        blob = data[pos : pos + size]
        pos += size
        dst = out / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(blob)
        print("  提取 %-45s %8d B" % (name, size))

        # .tex -> 内嵌 PNG mip
        if name.lower().endswith(".tex"):
            pngs = extract_pngs(blob)
            for i, png in enumerate(pngs):
                fname = dst.stem + "_mip%d.png" % i
                p = dst.parent / fname
                p.write_bytes(png)
                png_out.append((fname, p))
            print("    └─ 内嵌 PNG %d 张: %s" % (len(pngs), ", ".join(x[0] for x in png_out[-len(pngs):])))

    # 把最大一张 mip 作为 background.png
    best = None
    for fname, p in png_out:
        if best is None or p.stat().st_size > best.stat().st_size:
            best = p
    if best:
        bg = out / "background.png"
        bg.write_bytes(best.read_bytes())
        print("== background.png = %s (%d B) ==" % (best.name, best.stat().st_size))

    print("完成。输出目录: %s" % out)


if __name__ == "__main__":
    main()
