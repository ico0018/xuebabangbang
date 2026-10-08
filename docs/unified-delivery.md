# 学霸帮帮统一用户系统交付记录

日期：2026-10-08（北京时间）。

**四个功能分支已部署到腾讯云独立测试环境，云端账号/权限/三工具同步与数据库重启、备份恢复实测通过。main、DNS 和原网站均未修改。COS、真实 SMTP 和正式域名 HTTPS/备案仍待配置核实。READY FOR OWNER REVIEW。**

## 四个仓库与审阅入口

全部使用 `feature/unified-user-system`。

| 仓库           | 已实现                                                                           | 已验证的功能提交                                                                           | 草稿 PR                                                       |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| xuebabangbang  | 统一认证、账号中心、多孩子、管理员、云 API、迁移、隔离 Docker/Nginx/COS/备份配置 | 0c66b0a706e4ff9dd23b8f7e847db1ef6671e694（运行镜像业务来源；后续为文档证据提交） | [PR #3](https://github.com/ico0018/xuebabangbang/pull/3)      |
| AdhdTaskHelper | Repository + CloudSyncAdapter、真实家长验证、孩子独立缓存与离线记录              | 3a3a5f7a9d609fcae4a9bff41e1bc063c13951a9                                                   | [PR #3](https://github.com/ico0018/AdhdTaskHelper/pull/3)     |
| hanzi_garden   | 静态生字掌握/听写进度及队列同步                                                  | 86d87007915f0daf3961f46fb1540e5e0b2ef6e4                                                   | [PR #4 → dev](https://github.com/ico0018/hanzi_garden/pull/4) |
| guwen_leyuan   | 静态阅读/学习/默写记录同步                                                       | bb193d1e4824e6abfe211700c812f28f45837deb                                                   | [PR #1](https://github.com/ico0018/guwen_leyuan/pull/1)       |

认证、用户/数据、工具同步和基础设施分别提交。草稿不代表发布许可。汉字沿用仓库 dev 门禁，其余PR指向main但保持草稿；没有任何合并。

## 注册机制优化

2026-10-08免验证注册优化已通过云端模式/权限/三工具/手机浏览器复验，最终页面修正版部署、真实容器替换限流和数据保留复检也已PASS，可以人工验收。新机制、兼容迁移、安全边界和最终证据见 [unified-registration.md](unified-registration.md)。以下第一阶段邮箱流程属于历史验证记录，最终预览配置以注册优化记录为准。

## 账号和权限

提供 `/register`、`/login`、`/forgot-password`、`/reset-password`、`/account`、`/admin`。Better Auth官方密码认证、可配置邮箱验证和重置负责密码协议，Session在PostgreSQL；HttpOnly Cookie，HTTPS时Secure，14天有效期，数据库限流，明确Origin/CORS。认证token不放localStorage。远程认证强制HTTPS，HTTP仅允许本机SSH转发的localhost预览。

一个家长可创建、编辑、切换多个孩子，只记录昵称和可选年级。删除需要再验证家长密码及输入孩子昵称二次确认。家长再验证按当前服务端Session短期授权；修改任务、模板、家长评分等必须授权，儿童计时、自检、提醒消费和合法每日结算仍可正常同步。

管理员只有服务端role=admin可访问；提供搜索、用户详情、状态恢复/禁用、Session撤销、统计和审计。禁用撤销已有Session并拒绝创建新Session。不能查询密码或任意修改别人学习内容。首个管理员由服务器命令对已验证邮箱提权，要求显式确认，不创建默认管理员。

邮件Provider明确配置：disabled会明确拒绝找回/邮箱验证，免验证注册可正常使用，不假装已发送；development需显式启用，只写私有测试邮箱文件；smtp需真实配置。目前已验证development链接流程，未验证真实SMTP送达。

## 数据库 Schema

| 表                                          | 用途                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| users / sessions / accounts / verifications | Better Auth拥有的认证模型，加入受保护role、状态和当前孩子/家长授权字段                               |
| child_profiles                              | user_id外键、昵称、可选年级、时间戳                                                                  |
| tool_states                                 | profile_id、tool_key、schema_version、revision、JSONB payload、updated_at；(profile_id,tool_key)唯一 |
| user_entitlements                           | 工具/操作权限及期限，为未来付费权限预留，不开发支付                                                  |
| file_objects                                | 私有对象元数据预留                                                                                   |
| audit_logs                                  | 管理员写操作与关键家长操作审计                                                                       |
| rate_limits                                 | 认证/API数据库限流，无Redis                                                                          |
| sync_events                                 | 最近同步成功/失败统计                                                                                |

所有Profile API按Session用户检查所有权，不信任浏览器userId；工具Payload校验、1MiB限制，写入锁定孩子行并检查revision，冲突返回409。多工具导入在一个事务中，任一冲突全部回滚。导出仅包含本人家庭数据。

## 三工具同步

保留各工具独立结构及游客localStorage原键。登录缓存按账号和孩子隔离；游客迁移在各工具自己的origin中明确确认，原数据不删除。即时保存本机，云端异步；未上传修改持久保存，断网/Session失效不能显示同步成功。双方不同记录需要选择，保留恢复副本和双份导出。数据相等比较兼容PostgreSQL JSONB键序。

任务小帮手的计时、自检、复盘、积分和模板原逻辑保留。汉字教材、古文目录和默写判定没有修改。游客家长PIN只提供当前浏览器的保护，账号模式才有服务端密码授权，界面与文档明确说明。

## 实际验证结果

- 主站：lint/typecheck/10单测/生产构建PASS。
- 独立真实PostgreSQL/API：18组PASS，额外认证4组PASS，真实CloudSyncAdapter/API 5组PASS。
- 浏览器：六页面在320/390/768/1440宽度无横向溢出；密码确认拒绝不一致；跨工具同账号、两孩子切换、游客历史保留、离线补传、第二浏览器恢复、家长新增任务并云保存/儿童显示全部PASS，无浏览器运行错误。
- 任务小帮手：40核心/家长回归、10同步、lint/typecheck、独立依赖静态webpack构建PASS。
- 汉字：原题库测试、语法、10同步PASS。
- 古文：原Node20、Python27、语法、10同步PASS。
- 独立三工具同步30、PIN3、家长学习回归2均PASS。
- 实际PostgreSQL17.10重启后固定样例用户、孩子、revision及payload摘要一致。
- 官方pg_dump17.11生成真实custom-format备份，pg_restore恢复到新隔离库；11业务表全部行数与完整排序行摘要一致。备份SHA256：23affb28799962355231799d28f9e39bac940242436208549ba7ecc5f195487b。

QA独立捕捉并修复：家长权限误拦截儿童提醒消费/跨日结算、非法静态Payload持久化、JSONB键序误判、未创建孩子时反复reload、存储额度失败后错误显示同步成功。各项已复验。

## 腾讯云部署与人工检查

实际环境：腾讯云广州，服务器 134.175.136.31，新目录 /srv/xuebabangbang-unified-preview。普通用户 rootless Docker，独立项目 xueba-unified-preview；PostgreSQL17 持久卷，数据库无宿主机端口。账号服务127.0.0.1:3200，独立 Nginx 回环入口8320–8323。app/db均healthy，实测约82/74MiB，总内存可用2.6GiB。

云端已通过真实邮箱验证/密码重置/旧Session撤销、错误密码、HttpOnly/SameSite Cookie、服务端管理员和家长授权、跨用户孩子读写拒绝、Origin校验、409冲突与非法Payload拒绝。三工具同账号、两个孩子隔离、离线补传和另一浏览器恢复均PASS，无运行错误。登录后的移动端账号中心（真实孩子列表）及管理员后台另行PASS；四宽度六路由覆盖公共页面/登录引导，不代替已登录页面检查。

云端数据库重启前后，以及真实custom-format备份恢复到新库后，11张业务表完整排序行哈希和数量全部一致。备份 SHA256：9f985af23444e771a353671e397ac170072ff5a03758fd9f9842e034fbdac7a6；服务器0600、备份目录0700；已通过SSH复制到本机并再次校验。恢复库 restore_drill_20261008030210_12297 保留供检查，未覆盖任何运行库。每日本地备份timer已启用，ubuntu执行、手动运行exit0，日志明确Local-only；预定北京时间03:30加0–300秒随机延迟。

原 nginx/xuebabangbang-portal 服务始终active，原网站主页SHA前后相同。main和DNS没有修改。测试口仅服务器/本机回环可用，通过固定主机密钥SSH连接；没有公网HTTP密码登录。

| 待配置项 | 当前状态 |
| --- | --- |
| COS私有Bucket/Region+CAM或STS | 脚本实测exit1：COS_BUCKET is not configured。上传/读取/删除、COS异地备份未通过；不伪称成功。 |
| 真实SMTP | 缺配置；私有开发信箱验证/重置真实token已通过，不发真实邮件。 |
| 正式域名HTTPS跨子域 | 未切换域名；仅localhost同主机不同端口会话已实测。 |
| ICP与腾讯云接入备案 | 未核实，正式切换前需用户平台信息或控制台核查。 |
| 人工验收/合并上线 | 等待用户检查并另行明确授权。 |

主站运行依赖audit无high/critical，4项moderate来自drizzle-kit旧esbuild开发服务器链；本环境不启动该开发服务器。主站完整开发依赖仍有13项告警（含7high），任务工具继承开发依赖有7high；这些是ESLint/开发服务器等工具链。未用force降级。静态工具由Nginx提供。

## 测试入口

当前电脑已启动SSH检查连接；双击 F:/taskHelper/unified/打开腾讯云测试版.cmd 可重新建立。

- http://localhost:8320/account 账号中心
- http://localhost:8320/admin 管理后台
- http://localhost:8321/ 汉字乐园
- http://localhost:8322/ 古文乐园
- http://localhost:8323/ 任务小帮手
- http://localhost:8324/ 本机私有测试信箱

这些localhost入口实际连接腾讯云，原本本机预览已停止。随机密码的人工检查管理员账号仅保存在 F:/taskHelper/unified/runtime/人工检查账号.txt，经真实验证邮箱后由服务端提权并审计；不设默认/公开管理员。当前可自行注册邮箱与密码，立即自动登录，无需邮件验证；真实SMTP尚未配置，找回/确认邮箱明确提示暂不可用，私有信箱仅保留第一阶段历史邮件。正式网站旧localStorage仍保留在原origin，测试页不会自动读取它。

完整检查指南：F:/taskHelper/unified/腾讯云人工检查说明.md。服务器构建的准确四分支提交和归档SHA写入 /srv/xuebabangbang-unified-preview/artifacts/manifest.json；最新 docs/ops 之后的提交以该部署清单为准。

## 回滚与后续

见 unified-deployment.md。回滚只停止/替换独立预览app和测试Nginx配置，保留全部数据库volume、邮件和备份，不执行down -v。数据库恢复到新隔离库。原站配置和数据库保持原样。人工验收通过后才处理单独授权的main合并或正式发布。

**READY FOR OWNER REVIEW**

**DNS NOT CHANGED**
