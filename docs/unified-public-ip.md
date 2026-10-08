# 腾讯云公网 IP HTTPS 测试版

2026-10-08，用户明确要求公网 IP 访问，不使用本地连接、不迁移 DNS。该要求替代此前只用 localhost/SSH 检查的入口限制，仍不授权合并 main/dev 或切换正式域名。

**状态：服务器部署和本地实现检查通过；公网 443 外网连接超时，浏览器完整验收未执行。当前等待腾讯云访问规则放行，不宣称可人工验收。**

## 已部署入口

- 账号中心：https://134.175.136.31/account
- 管理后台：https://134.175.136.31/admin
- 汉字乐园：https://134.175.136.31/hanzi/
- 古文乐园：https://134.175.136.31/guwen/
- 任务小帮手：https://134.175.136.31/taskhelper/
- 集中家长页面：https://134.175.136.31/taskhelper/parent/

以上为已配置的公网入口，需先解决外网 TCP443 超时才可打开。手机/电脑随后直接访问，不依赖 SSH 隧道。旧 localhost 地址只属于历史验收记录。

## 部署与安全配置

仅使用 /srv/xuebabangbang-unified-preview 和现有 feature/unified-user-system。账号镜像业务源码 `0a67d2cdb4155a1726853e8bdba476846a42e820`，Task源码/静态构建 `97ea36104b4bd696571411e17086000c44f009ad`；汉字业务 `5af788877c523fa2b0e563ae171845aee3fce3f9`、古文 `d9fcc04e721ff89e1333cea3915e89e270c965fb` 无业务改动，只改服务器预览 cloud-config。Portal后续 `b4b12bc9f1c07cbc4b64b06f4e1861517acbbaea` 仅追加续期运维文件，后续交付文档提交另记，不重建业务镜像。

增加独立 IP Nginx 块。80仅提供IP的ACME验证和HTTPS重定向；443只服务134.175.136.31，未知Host返回421，不使用正式域名或改原站块。三个工具通过各自静态前缀提供；禁止隐藏文件、源码/测试/脚本/环境/备份/数据库dump。两个记录iframe精确路径允许当前HTTPS IP作为frame ancestor；消息仍检查确切来源和窗口。

账号 app仍只在127.0.0.1:3200，PostgreSQL无宿主机公开端口，rootless Docker不变。TRUSTED_ORIGINS和BETTER_AUTH_URL仅https://134.175.136.31，COOKIE_DOMAIN为空，保持Secure+HttpOnly host-only Cookie，不放宽远程HTTP认证。预览仍REQUIRE_EMAIL_VERIFICATION=false、MAIL_PROVIDER=disabled，未验证标记如实保留，邮箱找回/验证仍需真实SMTP。

Portal buildargs可由已有私有.env.preview中的三个NEXT_PUBLIC_*链接设置；Task构建设置API/PORTAL=HTTPS IP根、HANZI_URL=/hanzi/、GUWEN_URL=/guwen/、NEXT_PUBLIC_TOOL_BASE=/taskhelper。相对工具面板路径保留前缀，favicon也带Task前缀。

切换浏览器来源不会删除旧localhost/原站本机记录；新IP页面无法直接读取另一个来源的localStorage。已有统一账号及云端学习数据保留，登录后按同一账号和孩子恢复；新IP来源的游客历史仍由本来源读取。不得把不同来源的空缓存误认为旧数据丢失。

## IP证书与自动续期

已签发IP SAN证书，服务器标准CA校验TLS成功。当前证书截止2026-10-15 12:56:40（北京时间），不把服务器内部检查当成Windows外网TLS通过。IP证书可由Certbot webroot申请，无需DNS调整；方法见 [Let's Encrypt官方说明](https://letsencrypt.org/2026/03/11/shorter-certs-certbot)。

私有Certbot5.8.0路径为 .certbot-runtime/bin/certbot，证书与ACME账户在私有ip-tls，均不提交Git/不通过网页提供。xueba-preview-ip-tls.service由ubuntu执行、UMask0077；timer每日北京时间03:12/15:12加最多10分钟随机延迟。实际systemd服务Result=success/ExecMainStatus=0，timer active；真实ACME续期dry-run及部署hook的nginx-t/reload已通过。没有重启数据库或改原备份任务。

## 数据保留与证据

无数据库结构变化，无迁移。部署前备份 `backups/preview-20261008T140946Z-2654.dump`，明确本地备份，非COS异地备份。替换立即前后完整账号/孩子/学习数据SHA相同：`0276adc3308abe64df832a1fddf85c79d06e6435cc00ab02ef842e3a1ffe5226`。运行镜像 `sha256:227e92a8f24659cc6db2c9b89a2eea254b07d8da7a9752bfd762d6cda989555c`。原正式主页SHA仍 `05c355b6bf439819fc155d2508da24451bd96ddb1f8a7f4d18f2b074c4de84c5`，原服务active。生产数据库、main/dev、DNS未改。

最初首次reload后立即请求新443导致启动时序失败，自动回滚到原镜像；随后增加TLS健康轮询并重试，最终部署通过。私有public-ip-review保存失败诊断、最终phase/release、备份与回滚，不把一次失败掩盖为通过。Windows静态导出档中的新目录显式设置755、文件644，以确保Nginx读取。

实现检查：Portal最终20单测/lint/typecheck/公开URL构建，独立业务19单测和最后Host guard断言；Task45/lint/typecheck/构建/cloud11；静态工具各UI8/cloud11。独立公网路径/HTTPS/proxy/Host4项和原消息13项通过，静态产物25个绝对链接均保留/taskhelper。完整报告 [unified-public-ip-qa.md](unified-public-ip-qa.md)。

实际服务器TLS健康和未知Host421通过；Windows curl与Chrome外网443均20秒超时，没有HTTP或TLS元数据，服务器UFW443允许规则仍0个外网命中。外网注册/登录/三工具/手机浏览器/实际Cookie和限流尚未执行，不声明通过。证据为docs/evidence/public-ip-*.json。

## 当前需要的腾讯云规则

广州CVM实例 `ins-ed8etx60`、公网IP134.175.136.31。需要在该实例关联的安全组检查并添加入站规则：来源0.0.0.0/0、协议端口TCP:443、策略允许，确保规则顺序不被更早的拒绝规则遮蔽。只增加所需443，不放通全部端口；22/80/原规则保留。参见 [腾讯云官方添加安全组规则](https://cloud.tencent.com/document/product/213/112614)。

服务器UFW已经允许443。SSH不能直接改变腾讯云安全组；元数据没有可用CAM角色列举，控制台浏览器工具初始化失败，无法代操作云端规则。已向用户请求放行完成的状态，等待“已放行”后重新做只读外网健康和完整浏览器验收。这是缺少云控制台通道，不是生产上线确认，也不是自动审批拒绝。

## 回滚与边界

私有public-ip-review/rollback保存原.env.preview、compose、原镜像ID、静态归档、Taskout和两cloud-config。恢复旧env/compose和回滚镜像，只重建preview app；恢复旧Task静态产物和工具config；移除本次独立public IP配置，检查Nginx后reload。数据库卷和新学习数据保留，禁止down-v/覆盖生产数据库。旧loopback块从未删除。IP的ACME和续期可保持私有，若明确停用则只停本次证书timer，不动原备份服务。

全部Draft PR保持未合并。当前等待云端TCP443规则，然后公网人工验收；未经用户明确验收和上线授权，禁止main/dev合并和DNS切换。
