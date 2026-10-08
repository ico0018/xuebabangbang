# 注册机制优化（2026-10-08）

本次只修改 portal 的注册、登录、邮箱所有权和对应测试。三个学习工具继续复用原分支。只更新 `/srv/xuebabangbang-unified-preview`，保留 rootless Docker、User=ubuntu、回环 Nginx/SSH。main、DNS、原站和生产数据库均不变。

## 服务端配置与流程

`REQUIRE_EMAIL_VERIFICATION` 只有精确的 `false` 关闭验证；缺省、true、空值和非法值均要求验证。通过服务端读取，重启 app 生效，不使用 NEXT_PUBLIC 或浏览器开关。

- false：邮箱（trim+lowercase）+10–128位密码→注册→HttpOnly/SameSite Session→原先请求的受允许工具入口，默认账号中心。邮箱仍为 `email_verified=false`。
- true：新账号创建后发验证邮件，无 Session；真实邮件 token 验证后自动登录。无邮件 Provider 时给出503明确提示，不创建新账号。
- 测试环境明确配置 false、MAIL_PROVIDER=disabled、ENABLE_DEV_MAIL=false；普通注册和登录不依赖SMTP。保留原私有信箱历史；它不代表邮件实际送达。
- 注册表单提供实时邮箱格式反馈、10–128位长密码及密码管理器、显示/隐藏、重复提交锁、中文错误、确认密码。returnTo/next 仅跳转到门户或配置的工具 origin，不允许开放重定向；权限仍由服务端验证。

## 数据库和旧账号

沿用真实 `email_verified` 布尔值（满足验证状态记录要求，不伪造验证时间）。兼容迁移 0001 只增加受保护的 `email_verification_exempt` 标记和 `lower(btrim(email))` 唯一索引。已有普通未验证账号以及 false 模式新账号获得学习登录兼容资格；以后开启 true 后仍可用原密码学习。客户端不能申请该标记，管理员不适用。

迁移先建规范化唯一索引，有历史大小写/空白碰撞则事务失败，不能擅自合并或删除账号。之后规范化历史邮箱，不更改用户 ID、密码、孩子、学习记录和真实验证状态。无数据库新增业务表。迁移可重复执行；真实原始schema升级测试保留旧记录revision和密码。

## 安全边界

- 注册每IP每分钟4次、登录每IP每分钟8次；规范化邮箱有独立同等限流。重置/发验证邮件每IP每5分钟4次、每邮箱3次。使用现有 rate_limits 原子upsert及HMAC标识，支持并发和重启后持续冷却，响应429+Retry-After。Better Auth原有数据库限流也保留。
- Nginx覆盖X-Xbb-Client-Ip并附加私有TRUSTED_PROXY_SECRET。只有匹配32位以上私密口令的请求才采用该IP；所有外来X-Forwarded-For/X-Real-IP/内部IP头在传给认证库前清除。默认不相信任何传入IP，缺少可信代理时使用共享限流桶。测试SSH全部来自回环，人工检查和自动测试共享IP，出现429按冷却重试。
- 普通用户不具备管理员角色；管理员创建Session和所有管理API额外要求真实email_verified=true。原有禁用、权限、家长密码再次认证、session撤销和数据所有权检查保留。
- 不开放修改邮箱；update-user不能变更受保护字段。修改密码仍要求原密码，管理孩子/学习计划仍要求15分钟家长授权。
- 免验证/兼容邮箱不能用裸验证链接升级归属。确认归属必须通过邮箱的一次性密码重置token：更换原密码、真正标记验证、撤销旧session。防止提前占用地址的人仍凭原密码访问。不能凭知道邮箱、伪造emailVerified、假token或重放token接管账号。
- 邮箱证明、管理员权限和未来付费/通知/敏感数据权限独立于普通学习准入。`hasVerifiedEmail` 提供按操作的服务端门禁；未来功能必须在操作入口调用该门禁并独立审核支付授权。
- 正式找回密码、邮箱确认、强制验证注册/重新发信均需配置真实SMTP。development Provider仅用于隔离自动化验证真实token，不作为正式找回方式，不生成不安全替代流程。

## 测试与回滚

本地已通过13个单元测试、类型/规范检查，以及实际PostgreSQL和真实认证/API路由的7组集成测试：两种模式/缺省true、无邮件注册、重复邮箱及DB约束、IP/邮箱并发限流/伪造头/重启、普通管理员拒绝、学习读写与多用户隔离、原始schema迁移/旧密码登录、邮箱控制权token/失效/重放/旧session撤销。

集成运行：在本机隔离PG55432提供unified/runtime/.env.test，执行 `npm run test:auth-integration`。脚本只创建新的registration_policy/registration_migration数据库，拒绝任意外网数据库。云端使用显式AUTH_TEST_ALLOW_PREVIEW=true，只允许db/xueba_preview作为创建隔离测试数据库的起点，不对运行库执行测试写入。结果不含账号密码/token。

云端部署和最终浏览器回归记录待完成后补入 docs/evidence/registration-*.json。

迁移前备份原测试库、旧镜像和环境文件。应用回滚恢复旧测试镜像及旧env；新增列/索引可保留，旧代码可读取原结构。旧镜像仍严格要求验证，已有未验证用户需要邮件验证，故回滚体验可能变严格；数据不会删除。不要删除列、down -v或覆盖运行库。如果迁移失败，事务回滚，保留旧app；如确需完整DB恢复，使用备份恢复到新隔离数据库并另行审核连接切换。只影响预览项目。

最终必须等待人工验收；Draft PR不合并，DNS不变。
