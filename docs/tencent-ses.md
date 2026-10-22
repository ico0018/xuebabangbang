# 腾讯云 SES 邮件接入

门户支持 `MAIL_PROVIDER=tencent-ses`，使用腾讯云官方模块化 Node.js SDK。只发送邮箱验证和密码找回两种模板邮件，不开放任意主题、正文或收件人列表接口。原有 SMTP 与私有开发邮件模式保留。

## 当前腾讯云预览配置

- 站点：`https://134.175.136.31`
- 地域：`ap-guangzhou`
- 发信域名：`mail.xuebabangbang.cn`，2026-10-22 已验证通过。
- 发信地址：`noreply@mail.xuebabangbang.cn`，别名“学霸帮帮”。
- 邮箱验证模板：64840；密码找回模板：64841。提交时均为“审核中”；只有控制台显示审核通过后才可发送。

两个纯文本模板将完整链接写成 `https://134.175.136.31/{{path}}`，变量仅含本站认证接口的路径与参数（去除第一个斜杠）。固定网址末尾的斜杠是模板审核要求。变更站点地址时，必须同步修改并重新审核模板，再更新运行环境；不要把任意完整网址放入模板变量。

## 私密运行变量

将以下字段写入服务器现有 `.env.preview`，保留数据库密码、会话密钥及其余配置。文件权限保持0600，不提交到仓库，不打印完整环境或发送请求。

```dotenv
MAIL_PROVIDER=tencent-ses
MAIL_FROM=noreply@mail.xuebabangbang.cn
SES_REGION=ap-guangzhou
SES_SECRET_ID=
SES_SECRET_KEY=
SES_VERIFY_TEMPLATE_ID=64840
SES_RESET_TEMPLATE_ID=64841
```

`SES_SESSION_TOKEN` 仅在使用临时凭据时配置。`BETTER_AUTH_URL` 必须是 HTTPS 站点源地址，不含路径、用户名、查询参数或片段。配置缺失或非法时，邮件功能保持不可用。

推荐使用无控制台登录权限的专用子用户。只授予 `ses:SendEmail`，并通过 `ip_equal` / `qcs:ip` 限制来源为 `134.175.136.31/32`。该接口按操作授权，资源字段使用 `*`；这不代表授权其他腾讯云服务或 SES 管理接口。不要使用主账号密钥或邮件服务全读写策略。

```json
{
  "version": "2.0",
  "statement": [{
    "effect": "allow",
    "action": ["ses:SendEmail"],
    "resource": ["*"],
    "condition": {"ip_equal": {"qcs:ip": ["134.175.136.31/32"]}}
  }]
}
```

## 发布与验收

先确认两个模板审核通过、专用身份已授权和服务器私密配置齐全，再启用发信。API 返回 MessageId 仅表示腾讯云受理，不能算收件成功；需检查投递记录及实际收信，再打开一次性链接完成验证和密码找回测试。测试只使用用户授权的收件地址及独立测试账号，不修改既有用户的密码。

邮件投递和认证链接全部通过前，保留当前 `REQUIRE_EMAIL_VERIFICATION=false`；不要提前阻断普通用户注册。以后启用强制验证时，保留既有普通账号的服务端兼容标记和管理员验证要求。

本改动不需要数据库迁移。部署仅替换门户 app 镜像；先备份数据库、源码、运行环境和原镜像，健康检查失败时恢复。不要直接运行包含迁移的完整部署脚本。正式域名切换和 main 分支发布仍需单独授权。

服务端校验收件人、固定主题、本站认证路径、token 和回跳源。SDK 错误对外统一提示，不传播原始错误、密钥或一次性链接。测试覆盖缺失配置、非法模板编号、两种模板映射、跨站与异常链接拒绝，以及发送受理/失败行为。

## 官方文档

- [SendEmail](https://cloud.tencent.com/document/api/1288/51034)
- [发信模板](https://cloud.tencent.com/document/product/1288/52777)
- [邮件推送的 CAM 授权范围](https://intl.cloud.tencent.com/zh/document/product/598/57150)
- [IP 条件策略](https://cloud.tencent.com/document/product/598/38037)
