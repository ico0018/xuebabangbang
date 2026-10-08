# 统一账号中心与数据接口

本分支为隔离测试环境提供 Node.js 运行时。现有首页与三个工具入口保留，账号数据库不部署到 Cloudflare 静态 Workers。运行命令、服务器隔离与备份见部署文档；本文件描述业务接口。

## 数据库与认证

Better Auth 1.7.7 + Next.js 15.5.27 + Drizzle + PostgreSQL。Next.js 从 15.5.9 升级为同系列已修复安全问题的补丁；PostCSS / Sharp 依赖通过 overrides 修复。认证使用框架默认密码算法与 HttpOnly Session Cookie；禁止在 localStorage 保存 Token。账号表 users / sessions / accounts / verifications 使用 Better Auth 的单一模型，role 和 disabled 不能由注册输入设置。

迁移：设置 DATABASE_URL，运行 npm run db:migrate。迁移文件 drizzle/0000_young_titanium_man.sql。数据库不向公网暴露。数据库其他表：

- child_profiles：只保存所属用户、昵称与可选年级。
- tool_states：profile_id + tool_key 唯一；JSONB payload、schema_version=1、递增 revision。
- user_entitlements：工具/操作权限扩展。现有免费工具默认可操作，未过期的显式拒绝优先。
- file_objects：私有对象存储元信息扩展。
- audit_logs：家长验证、档案变化、数据导入、管理员变更记录，不保存密码或完整学习内容。
- sync_events：成功/冲突/失败，供后台检查；不记录学习 payload。
- rate_limits：认证和业务请求数据库限流。

首个管理员：先正常注册并完成邮箱验证，服务器设置 CONFIRM_ADMIN_EMAIL 为该邮箱，再运行 npm run admin:promote -- <邮箱>。仅接受已验证且未禁用账号，提权写审计日志；无默认管理员与密码。

## 邮件

MAIL_PROVIDER=smtp：SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASSWORD / MAIL_FROM。缺少配置的注册、邮件重置及验证请求返回 503 MAIL_NOT_CONFIGURED，不显示发送成功。

隔离测试允许 MAIL_PROVIDER=development + ENABLE_DEV_MAIL=true。DEV_MAIL_DIR 指定私有收件箱；文件包含实际验证/重置链接，必须由测试管理员在服务器读取，不能公开访问或提交 Git。默认目录 .dev-mail 已忽略。SMTP 配置成功仍需用真实邮件验证收件与发送域名。

BETTER_AUTH_URL 是固定干净 origin；远程域名必须 HTTPS。http 仅 localhost、127.0.0.1 或 ::1 用于 SSH 预览。TRUSTED_ORIGINS 为精确逗号分隔允许列表；COOKIE_DOMAIN 如启用必须是此 URL 的显式父域。预览端口共享 localhost Cookie；生产在统一 API 使用 credentials: include。

## 认证页面与 API

/register、/login、/forgot-password、/reset-password、/account、/admin。注册、邮箱验证及找回密码保持原有认证规则。登录后完成一次中文大写数字乘法选择题即可管理孩子档案，本次登录期间无需重复输入密码或答题。

Better Auth 官方端点挂载 /api/auth/*。业务端点 /api/v1/*；所有写请求 Content-Type: application/json 并带允许的 Origin。缺少 Origin 的写请求拒绝。未登录 401，无权限 403，非本人档案返回 404，非法 Schema 400，过大 413，频繁请求 429，修订冲突 409。业务读写均不缓存。

- GET /session → {user:{id,email,name,role},activeProfileId,parentReady,parentUnlockedUntil}
- GET /parent-challenge → {challenge,question,choices}，中文大写数字乘法题与三个数字选项。签名题目有效五分钟，绑定当前服务器 Session，不返回正确答案标记。
- POST /parent-unlock {challenge,answer:number} → 服务端核对 HMAC、Session 归属、题目有效期与乘法结果；答错不授权，尝试全账号限流每分钟五次，无密码回退。通过后 parentReady=true，持续当前登录；主动退出家长模式或登出后结束。
- POST /parent-lock {} → 立即关闭管理权限。
- GET /profiles → {profiles:[{id,nickname,grade}],activeProfileId}
- POST /profiles {nickname,grade?} → 新孩子档案，同时设为当前孩子；需家长验证。
- PATCH /profiles/:id {nickname,grade?} → 需家长验证、归属与操作权限。
- DELETE /profiles/:id {confirmNickname} → 需家长验证与准确昵称，事务删除云端状态并清空引用该档案的 Session 当前孩子。
- POST /active-profile {profileId} → 归属校验后切换当前 Session。
- PATCH /account {name} → 家长昵称，需要家长验证。
- POST /logout-all {} → 需家长验证，撤销本人所有 Session。
- GET /profiles/:id/state/:tool → {revision,schemaVersion,payload}。空记录 revision=0、payload=null。
- PUT /profiles/:id/state/:tool {revision,schemaVersion:1,payload} → profile 行锁串行化首写与后续变更，比较当前 revision 后写入 revision+1；冲突不写入。返回完整状态。

支持 tool=taskhelper / hanzi / guwen。taskhelper payload 使用工具当前完整 databaseSchema（lib/taskhelper-models.ts 来自同批 taskhelper/src/lib/models.ts，未来模型变化须同时更新并测试版本兼容）。汉字和古文只允许已知 localStorage key，值须为可解析的 JSON 对象/数组文本；教材与其他浏览器数据不能上传。请求总体上限 1 MiB，当前 schemaVersion 仅接受 1。

taskhelper 服务端独立比较任务定义、模板、孩子身份、计划任务列表、家长质量评价与评分基线。修改需当前登录已开启家长入口。儿童计时、自检、复盘、完成奖励、合理的跨日扣分及非独立启动后的提醒清除可以同步。比较采用深层内容比较，避免 PostgreSQL JSONB 重新排列 key 产生虚假权限拒绝。

## 导入导出

GET /export 下载本人所有孩子与状态，format=xuebabangbang-export-v1；不含密码、Session、其他用户数据。账号中心可以选择原孩子记录并确认恢复到当前孩子。

POST /profiles/:id/import {confirmNickname,states:[{toolKey,revision,schemaVersion:1,payload}]}：先检查家长入口状态、归属、工具权限、所有 payload 和重复工具；同一事务内锁档案并校验每项 revision。任何冲突使全部导入回滚，不能部分覆盖。写入审计日志。离线迁移操作也可在各工具域内使用相同 state PUT。

## 管理员

GET /admin/users?q=邮箱或昵称（最多100项）、GET /admin/users/:id 查看基本资料和档案；不返回学习 payload。GET /admin/stats 提供用户/新增/孩子/工具与同步统计；今日使用 Asia/Shanghai。GET /admin/audit 返回最近100项日志。

POST /admin/users/:id {action:"disable"|"restore"|"revoke-sessions"} 需服务器确认已验证邮箱的 admin 角色，以及已开启的家长入口。计算题不会提升账号角色，也不会跳过后台的认证与权限校验。禁用与 Session 撤销为同一事务；禁用账号后登录 Session 创建钩子拒绝创建，业务请求再次读取 enabled 状态。禁止当前管理员自我禁用。所有变更写审计。

## 验证命令

npm run lint / npm run typecheck / npm run test / npm run build。tests/policy.test.ts 与 tests/payload.test.ts 覆盖权限、真实敏感字段与儿童自动状态、Schema、JSONB顺序及配置边界。真实数据库/邮件/API验收由独立 QA 脚本执行，见 QA 交付文件。不能以单元测试替代真实 Session、PostgreSQL、邮件验证。


家长入口是防儿童误点的简易门槛，不能作为成年人身份或密码重新验证的证明。服务器认证、管理员已验证角色、租户隔离、CSRF/Origin 与数据权限保持独立检查。复用 sessions.parent_unlocked_until 作为当前 Session 已完成题目的标志，初次通过写入该 Session expires_at；parentReady 始终同时检查真实 Session expires_at，因此滚动续期不会产生重复题目，无数据库迁移。旧字段返回当前真实 Session 到期时间，供旧接口兼容。签名题目五分钟内可重试，不是一次性令牌；不同 Session、登出再登录、过期或篡改均不能复用。
