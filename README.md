# 学霸帮帮 · xuebabangbang

给孩子和家长准备的实用学习小工具。

第一版提供首页和学习工具箱，无需登录即可使用。现在已接入 [汉字花园](https://hanzi.xuebabangbang.cn)，后续新增工具只需维护统一的工具数据文件。

## 技术栈

- Next.js（App Router）
- TypeScript
- Tailwind CSS

## 本地运行

```bash
npm install
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
```

## 新增工具

在 `data/tools.ts` 的 `tools` 数组新增一项后，工具页会自动显示；设置 `featured: true` 后，首页热门工具也会同步显示。

## 开源协议

[MIT License](LICENSE)
