# 学霸帮帮统一用户系统交付记录

日期：2026-10-08（北京时间）。

**代码及本机验证已完成，四仓库分支已推送、草稿 PR 已创建。腾讯云尚未部署，等待当前聊天授权复用此前 SSH 凭据；不能把本机测试当作云端部署成功。main 与 DNS 均未修改。**

## 四个仓库与审阅入口

全部使用 `feature/unified-user-system`。

| 仓库           | 已实现                                                                           | 已验证的功能提交                                                                           | 草稿 PR                                                       |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| xuebabangbang  | 统一认证、账号中心、多孩子、管理员、云 API、迁移、隔离 Docker/Nginx/COS/备份配置 | e5417c2f330f54c21ec7c366167cceb1a9b2365f；基础设施8d4ebd5776304f34bab817b07642d4e9ccb275f5 | [PR #3](https://github.com/ico0018/xuebabangbang/pull/3)      |
| AdhdTaskHelper | Repository + CloudSyncAdapter、真实家长验证、孩子独立缓存与离线记录              | 3a3a5f7a9d609fcae4a9bff41e1bc063c13951a9                                                   | [PR #3](https://github.com/ico0018/AdhdTaskHelper/pull/3)     |
| hanzi_garden   | 静态生字掌握/听写进度及队列同步                                                  | 94fe0ff29bb1fbc658a4ad94a9d231bd6e16bd7d                                                   | [PR #4 → dev](https://github.com/ico0018/hanzi_garden/pull/4) |
| guwen_leyuan   | 静态阅读/学习/默写记录同步                                                       | bb193d1e4824e6abfe211700c812f28f45837deb                                                   | [PR #1](https://github.com/ico0018/guwen_leyuan/pull/1)       |

认证、用户/数据、工具同步和基础设施分别提交。草稿不代表发布许可。汉字沿用仓库 dev 门禁，其余PR指向main但保持草稿；没有任何合并。

## 账号和权限

提供 `/register`、`/login`、`/forgot-password`、`/reset-password`、`/account`、`/admin`。Better Auth官方密码认证、邮箱验证和重置负责密码协议，Session在PostgreSQL；HttpOnly Cookie，HTTPS时Secure，14天有效期，数据库限流，明确Origin/CORS。认证token不放localStorage。远程认证强制HTTPS，HTTP仅允许本机SSH转发的localhost预览。

一个家长可创建、编辑、切换多个孩子，只记录昵称和可选年级。删除需要再验证家长密码及输入孩子昵称二次确认。家长再验证按当前服务端Session短期授权；修改任务、模板、家长评分等必须授权，儿童计时、自检、提醒消费和合法每日结算仍可正常同步。

管理员只有服务端role=admin可访问；提供搜索、用户详情、状态恢复/禁用、Session撤销、统计和审计。禁用撤销已有Session并拒绝创建新Session。不能查询密码或任意修改别人学习内容。首个管理员由服务器命令对已验证邮箱提权，要求显式确认，不创建默认管理员。

邮件Provider明确配置：disabled会报错，不假装已发送；development需显式启用，只写私有测试邮箱文件；smtp需真实配置。目前已验证development链接流程，未验证真实SMTP送达。

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

## 尚未完成的外部验证

| 项目                               | 当前真实状态                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| 腾讯云分支部署 / 服务器状态        | 未登录本次部署；现有服务器报告只能作为此前背景。需当前聊天批准复用SSH凭据。         |
| Docker Compose / Nginx在腾讯云实测 | 配置和脚本已完成，未在腾讯云运行，不标PASS。                                        |
| COS上传→读取→删除                  | SDK脚本已完成，仅删除自建随机测试对象；Bucket/Region/CAM或STS尚未配置，未实测。     |
| COS备份及定时任务                  | 脚本/恢复文档已完成，本机备份恢复PASS；COS上传、服务器恢复、定时器启用未验证。      |
| 真SMTP                             | 未提供配置，未验证送达。                                                            |
| 部署后跨子域HTTPS                  | localhost不同端口共享Cookie已实测；实际域名TLS/Cookie/CORS仍需部署后验证，未切DNS。 |
| 备案与腾讯云接入备案               | 未核实，正式切换前需检查。                                                          |

自动审批拒绝了从旧会话提取密码并建立SSH命令通道，理由是当前授权来源不足。已请求你在当前聊天确认；未绕过该拒绝。另曾尝试把备份service改为root被审批拒绝，已保留ubuntu权限，不执行该提权；部署时需检查ubuntu已有Docker访问权限或采用rootless Docker。

任务小帮手继承的开发工具依赖审计仍有7项high（ESLint/serve等）；静态产物不运行这些工具，预览使用Python/Nginx。主站生产依赖audit无high/critical，4项moderate主要与迁移工具链有关。未使用force降级。

## 当前可访问的本机预览

- http://localhost:8320/ 主站、账号中心
- http://localhost:8321/welcome.html 汉字乐园
- http://localhost:8322/ 古文乐园
- http://localhost:8323/ 任务小帮手，家长入口 `/parent/`

这些是当前电脑上的真实本机预览，**不是腾讯云地址**；当前会话服务在运行，机器/服务停止后需按保存的运行配置重启。使用测试账号；邮件由私有development outbox处理，不会发送到外部邮箱。正式HTTPS origin历史不在这些测试origin里，原记录未被删。

## 腾讯云待执行方式与回滚

见 `unified-deployment.md`：新目录 `/srv/xuebabangbang-unified-preview`，独立Compose名称，数据库Volume持久、5432不发布到宿主机，四入口只监听服务器loopback，通过SSH四端口转发验收。原 `/srv/xuebabangbang`、`/var/www`、现有Nginx块和服务保留。部署前保存四提交，上传分支归档；迁移/健康检查成功后才启用独立测试配置。

回滚只管理独立预览app/镜像及测试配置，保留数据库volume、邮件与备份，不执行down -v。数据库恢复到全新库，不覆盖现有库。用户人工验收通过后，才另行授权main合并和正式切换；没有预先安排合并或DNS任务。

**尚未达到云端 READY FOR OWNER REVIEW：腾讯云部署与外部配置待完成。**

**DNS NOT CHANGED**
