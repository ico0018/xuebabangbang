# 汉字和古文记录集中到任务家长端

2026-10-08追加需求：用户明确选择“任务小帮手的家长端”。本轮只调整学习页入口和记录操作的位置，保持已实现的账号、孩子、家长算式和学习同步。最终版本已部署既有独立预览，独立本地与实际浏览器验收通过，可以开始人工检查。

## 页面行为

汉字和古文的学习页不再创建家长入口、同步提示或记录管理占位。后台自动云同步与学习内容照常工作。任务小帮手 /parent/ 在原有家长授权内显示“汉字乐园”和“古文乐园”两块记录面板，直接提供本机导入、重试同步、导出备份和出现冲突时的恢复操作。无需跳到另一个页面。

只有一个当前孩子选择和退出家长模式入口。切换孩子后三个应用同步显示新孩子。已开启的登录家长状态继续使用，无需在两块面板再次输入密码或答题。嵌入面板的导入、保留本机、恢复云端先显示中文内嵌确认，取消不写入。

## 保留本机记录与授权

浏览器按网页来源保存本机记录，不同端口或子域不能直接读取彼此localStorage。集中面板使用各应用自己的 parent.html?embedded=1，因此汉字记录仍由汉字来源读取，古文仍由古文来源读取；不复制整个浏览器缓存，也不把记录经消息发送给任务页面。游客原记录、云端隔离缓存和冲突恢复副本保留。

已登录面板只依据服务端Session parentReady，不接受游客消息授予真实账号权限。游客中心只在本机算式通过后给指定子面板发送不含数据的提示；子面板检查精确parentBase来源、window.parent身份、仅允许规定type字段，guest状态只在当前面板内存生效。额外记录、孩子ID、URL和任意指令均不接收。框架尺寸消息也验证确切来源和iframe身份，不能触发数据操作。

## 独立预览配置与回滚

继续 /srv/xuebabangbang-unified-preview、rootless Docker、ubuntu、loopback Nginx和既有SSH入口。本次不重建、替换或重启账号容器/数据库，无数据库迁移。只更新三个静态分支与任务构建，并在预览Nginx的两条 /parent.html位置设置 frame-ancestors http://localhost:8323，禁止其他网站嵌入记录面板。其他原站块、监听端口和私有代理凭据不改变。

任务静态构建显式设置 NEXT_PUBLIC_ACCOUNT_API/NEXT_PUBLIC_ACCOUNT_PORTAL=http://localhost:8320、NEXT_PUBLIC_HANZI_URL=http://localhost:8321、NEXT_PUBLIC_GUWEN_URL=http://localhost:8322；两静态工具的cloud-config增加parentBase=http://localhost:8323。默认仓库配置仍为既有HTTPS域名，正式站没有发布。

部署前数据库本地备份、原三个归档/任务out、cloud-config和原Nginx预览块保存在私有 parent-central-review/rollback。回滚只恢复这些静态产物和原预览Nginx文件，先 nginx -t再reload；保留数据库数据卷和用户的新学习记录。账号镜像无需操作，不允许down -v或生产修改。

## 验收

独立验收检查实际学生页面无入口，中央真实按钮在手机和电脑可操作；两个来源分别导入和备份自己的历史，取消不写入，冲突双份备份/恢复有效，切换孩子后记录隔离，未开启登录状态不能通过embedded参数或伪造消息绕过服务端。最终业务提交、构建校验和部署/浏览器证据如下。

人工检查入口：http://localhost:8323/parent/。仍等待人工验收，不合并main/dev，不切换DNS或生产。

## 最终交付与验证

部署业务来源：Taskhelper `9e9c98bbb8f9059a471451116cbbed86985dc08b`，汉字 `5af788877c523fa2b0e563ae171845aee3fce3f9`，古文 `d9fcc04e721ff89e1333cea3915e89e270c965fb`。账号镜像仍来自此前Portal业务 `81abd4a89b9f37295c7e8c5c3aa64940b8a5eb61`；Portal本次仅修改预览Nginx模板和文档，未重建账号镜像。后续状态/文档提交另行记录，不替代部署业务来源。

本地独立13项检查PASS；Task43单测、11同步、lint/typecheck和最终静态构建PASS；汉字/古文各8界面、11同步和语法PASS，汉字原题库、古文原Node20/Python27检查PASS。实际腾讯云浏览器375/768/1440检查最终面板、学生入口移除、导入取消/确认、双版本冲突备份/恢复、两个孩子切换隔离、单一家长退出与伪造消息拒绝；完整结果见 [独立报告](unified-parent-central-qa.md)。未重复声称本轮重测SMTP/Portal认证实现，相关功能未改动，之前验收仍保留。

数据库没有结构变化或迁移。部署立即前后账号、孩子、学习状态完整摘要相同：`5ed4a9b04bdbf33caba9bfe130c5b5f0791d1e10edbd79093baad07553cd1e26`；账号镜像相同：`sha256:60c4365bf757b85fd55c382164f5338bda5f3d02f26c0a873a711664371b60f0`。原站主页摘要仍为 `05c355b6bf439819fc155d2508da24451bd96ddb1f8a7f4d18f2b074c4de84c5`，原服务active。备份为私有 `backups/preview-20261008T095858Z-21637.dump`，明确本地备份，未配置COS。证据：`evidence/central-release-results.json`、`evidence/parent-central-controls-local-results.json`、`evidence/parent-central-controls-browser-results.json`、`evidence/parent-central-controls-isolation-results.json`（额外六次服务端原样快照与两面板实际绘制验证）。

## 本轮修改文件

- Taskhelper：`README.md`、`src/app/globals.css`、`src/components/nora-app.tsx`、`src/components/parent.tsx`、新增 `src/components/parent-record-widgets.tsx` 与测试、`src/lib/parent-auth.ts`、新增 `src/lib/parent-widget.ts` 与测试、`vitest.config.mjs`。
- 汉字：`README.md`、`cloud-config.js`、`cloud-ui.css`、`cloud-ui.js`、`scripts/test-parent-ui.cjs`、`vercel.json`（仅分支配置，未发布正式托管）。Manager追加`.agents/STATUS.md`和`.agents/DECISIONS.md`。
- 古文：`README.md`、`cloud-config.js`、`cloud-ui.css`、`cloud-ui.js`、`scripts/test-parent-ui.cjs`。
- Portal：`ops/nginx.preview.conf`、本轮交付/部署/QA文档和非敏感证据。账号业务API没有改动。

真实SMTP需求未改变：邮箱确认、密码找回、开启强制验证后的实际邮件送达仍需真实SMTP；免验证注册和此次家长记录面板不依赖SMTP。所有现有Draft PR保持草稿未合并，main/dev/DNS和生产数据库不动，停止在等待人工验收。
