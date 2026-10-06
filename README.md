# 学霸帮帮 · xuebabangbang

给孩子和家长准备的实用学习小工具。

门户首页提供三个工具的使用步骤和入口：[古文乐园](https://guwen.xuebabangbang.cn/)、[汉字乐园](https://hanzi.xuebabangbang.cn/)、[任务小帮手](https://taskhelper.xuebabangbang.cn/)。工具继续运行在各自原有站点，门户不处理工具数据。

`/about` 是独立的“为什么做”页面。`/tools` 保留原有搜索和分类入口，顶部导航的“工具”直接定位到首页工具区。

## 技术栈

- Next.js 15.5.9（App Router）与 React 19.1.0
- TypeScript
- Tailwind CSS

## 本地运行

```bash
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用命令

```bash
npm run lint
npm run typecheck
npm run build
```

## 项目结构

```text
app/             页面与全局布局
components/      可复用的页面组件
data/tools.ts    统一的工具数据
data/community.ts 首页和关于页共用的群二维码与说明
public/illustrations/ 三张独立 SVG 小插画
```

## 新增工具

在 `data/tools.ts` 维护工具名称、地址、三步说明、按钮和插画类型。首页与 `/tools` 共用这些数据。

## 更换群二维码

真实二维码尚待提供，默认 `data/community.ts` 中的 `community.qr.src` 为 `null`，两页显示“群二维码 / 待提供”，不显示扫码或保存操作。

将真实二维码图片放入 `public/`（例如 `public/community-qr.png`），把 `community.qr.src` 改为 `/community-qr.png`。首页和 `/about` 会同时显示“微信扫码进群”，可点击放大、关闭或按 Esc 返回，并提供“保存图片”链接。手机还可在放大后长按图片识别或保存。图片加载失败时会回到占位状态。若图片不是 PNG，同步修改 `downloadFilename` 的后缀。

相关标题、说明和扫码提示均在同一配置文件。保持图片为本站本地文件，确保下载链接可用；微信实际识别与进群仍需接入真实二维码后在手机上验证。

## 部署与预览

保持现有 Next.js 构建与部署方式，不改动 `next.config.ts`。`npm run build` 后使用 `npm run start -- --port 3100` 本地预览。生产站点由 Cloudflare Workers Builds 自动构建并发布 GitHub `main` 分支，项目为 `xuebabangbang`。发布前先完成本地检查与预览验收。

## 开源协议

[MIT License](LICENSE)
