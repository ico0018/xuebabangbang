# 家长入口与记录管理简化

日期：2026-10-08。仅在 feature/unified-user-system 和腾讯云独立预览实施；不合并、不上线、不改变 DNS 或生产数据库。已完成分支部署和独立云端验收，可以开始人工检查。

## 当前行为

进入家长页面时，选择一道大写汉字乘法题的答案，例如“贰 × 捌 = ?”，有三个数字选项。答对后，同一登录会话可直接添加孩子、管理任务和学习记录，不再输入家长密码，不再十五分钟后锁定。返回孩子学习页面不会清除家长状态；主动退出家长模式或退出账号会清除。重新登录需要重新答题。

算式用于减少儿童误点；它不证明真实成人身份，也不是支付、邮箱所有权或管理员授权凭证。账号登录、密码修改时的原密码、真实邮箱证明、管理员角色和数据所有权检查仍独立执行。游客工具仅保存在当前浏览器，游客算式也是误点保护。

账号中心 /account 提供孩子档案和三个家长管理链接。汉字 parent.html、古文 parent.html、任务 /parent/ 保留选择孩子、同步、本机记录导入、冲突恢复和导出备份。各工具在自己的网页来源读取本机记录，游客原记录保留。学生页面只显示学习内容和家长入口，不显示同步、备份或恢复工具。自动云同步继续在后台运行。

## 服务端边界

GET /api/v1/parent-challenge 为已登录会话创建随机题目；POST /api/v1/parent-unlock 严格接收 challenge 和数字 answer。题目由认证密钥签名并绑定当前 Session，五分钟内有效，篡改、错误答案和另一会话复用被拒绝。五分钟仅是未答题的有效期，与已开启家长权限的持续时间无关。题目/答案不写审计日志；授权动作保留审计。

复用数据库持久化限流：每账号每分钟最多五次答题，重启应用不清除冷却。真实账号授权仍通过服务器 Session、账号状态、孩子所有权和权限检查，不能提交 parentReady 或 role 伪造授权。管理员仍要求实际已验证邮箱和 admin 角色；家长算式不会授予管理员资格。

## 数据库与兼容

无新增迁移、无新增表或列。复用已有 sessions.parent_unlocked_until 字段作为已开启标记，并检查真实 Session 有效期；旧十五分钟值不再作为家长超时期限。服务端 API 增加 parentReady，并保留 parentUnlockedUntil 兼容字段。账户注销、新登录和主动 parent-lock 都会清除授权。原账号、孩子、学习数据、密码哈希、邮箱验证状态不改。

## 部署与回滚

仍为 /srv/xuebabangbang-unified-preview、ubuntu rootless Docker、User=ubuntu 备份、loopback Nginx 和既有 SSH 隧道。不开新公网端口。部署前保存本地数据库备份、旧应用镜像、四个分支归档、任务静态产物与配置；部署立即前后比对完整账号/孩子/学习数据摘要与原站主页摘要。

云端私有 parent-review 保存备份记录、前后摘要及旧版本。旧镜像标签 xueba-unified-preview-parent-rollback:20261008；回滚应用可将该镜像恢复为 xueba-unified-preview-app 再仅重建 preview app。三个工具恢复 parent-review/rollback 的归档，恢复两份原 cloud-config.js；任务使用旧 taskhelper-out.tar（仅替换独立预览静态产物）。无需数据库回退，保留新旧学习数据。若回到旧版，家长字段会再次按旧的时间规则解释，需按旧流程重新确认。禁止 down -v、删除数据卷、覆盖生产数据库或更改正式站配置。

## 验证

开发：portal17单测、8组真实隔离 PostgreSQL 认证/API 集成、lint/typecheck/production build通过。独立 QA 已验证算式生成、签名、错误与跨会话拒绝、超过原十五分钟仍可创建孩子/任务、注销后清除授权、普通账号与管理员边界及多账号隔离。三工具各11项同步、静态家长界面各4项、任务40项与lint/typecheck/build、汉字原题库、古文20项Node和27项Python检查均通过。


独立云端浏览器8组全部PASS：375/768/1440px，真实注册自动登录并连续创建两个孩子，添加任务保存云端且孩子首页可见，同登录各家长页不再答题/输入密码，学生页没有记录管理；同源游客导入、冲突双版本备份及恢复、不同孩子隔离、另账号三工具读写404、退出再登录重新答题但原任务保留。浏览器无运行错误。17分钟是浏览器clock模拟，另由真实API测试回溯授权标记17分钟；没有冒称真实墙钟等待。

最终镜像在腾讯云新隔离数据库完成8组认证/API回归，原管理员账号/原孩子与导出门禁复验PASS。原有主站主页SHA和替换前后完整账号/孩子/学习数据SHA相同；备份 backups/preview-20261008T080150Z-28437.dump 保存在私有预览目录。最新版本、静态产物和镜像见 evidence/parent-release-results.json；独立验收详见 unified-parent-qa.md。

仅改测试环境，仍需真实SMTP的邮箱确认、密码找回和强制邮箱验证流程没有改变；预览保持 REQUIRE_EMAIL_VERIFICATION=false 和 MAIL_PROVIDER=disabled。COS未配置，备份仍为本地备份。main/dev/DNS不变，所有PR保持Draft，等待人工验收。

## 本轮修改文件

- portal：`.gitignore`、`components/AccountCenter.tsx`、`components/AdminCenter.tsx`、`docs/account-system.md`、`docs/unified-registration.md`、`lib/api.ts`、`lib/parent-challenge.ts`、`scripts/test-auth-integration.mjs`、`tests/parent-challenge.test.ts`、`tests/support/auth-server.ts`。
- taskhelper：`README.md`、`scripts/test-cloud-sync.cjs`、`src/app/globals.css`、`src/components/account-panel.tsx`、`src/components/nora-app.tsx`、`src/components/parent-gate.tsx`、`src/lib/account-sync.ts`、`src/lib/cloud-sync.d.ts`、`src/lib/cloud-sync.js`、`src/lib/parent-auth.test.ts`、`src/lib/parent-auth.ts`。
- hanzi：`.agents/DECISIONS.md`、`.agents/STATUS.md`、`README.md`、`cloud-sync.js`、`cloud-ui.css`、`cloud-ui.js`、`parent.html`、`scripts/test-cloud-sync.cjs`、`scripts/test-parent-ui.cjs`。
- guwen：`README.md`、`cloud-sync.js`、`cloud-ui.css`、`cloud-ui.js`、`parent.html`、`scripts/test-cloud-sync.cjs`、`scripts/test-parent-ui.cjs`。

Manager另更新 STATUS.md、交付/部署文档和本轮证据；后续纯文档提交不改变上列运行镜像业务来源。
