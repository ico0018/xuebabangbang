# 统一用户系统：隔离部署与回滚

## 部署边界

只部署四仓库的 `feature/unified-user-system`。不合并 main、不修改 Cloudflare/DNS、不触碰原站服务和数据库。腾讯云新环境固定在 `/srv/xuebabangbang-unified-preview`，Compose 项目名 `xueba-unified-preview`。数据库没有宿主机端口；账号中心监听 `127.0.0.1:3200`，Nginx 测试入口监听本机 8320–8323。

本地 PostgreSQL 和浏览器测试不能替代腾讯云部署、COS或SMTP实测。各项真实结果单独记录在交付报告。

## 首次部署

1. SSH检查 Ubuntu、现有服务、磁盘内存、Docker 与端口占用；保留 `/srv/xuebabangbang`、`/var/www` 和现有 Nginx 配置。
2. 上传四个分支的完整归档到新目录，记录四个完整提交号。原始 Git、环境文件和测试邮件不发布到静态目录。
3. 使用官方 Docker Ubuntu安装方式安装Docker Engine及Compose插件（已安装时不重装），并以ubuntu的rootless Docker运行。不改现有防火墙，不开放5432。
4. 主站复制 `.env.example` 为 `.env.preview`，随机生成独立数据库密码及 Better Auth secret，权限0600；配置四个 localhost 8320–8323 为 trusted origin。开发邮件需显式 `MAIL_PROVIDER=development`、`ENABLE_DEV_MAIL=true`、`DEV_MAIL_DIR=/app/mail-outbox`。这只会写私有测试邮件，真实外部邮件须SMTP。
5. 汉字、古文静态配置的 API/账号中心使用 localhost:8320；任务工具以对应环境变量构建，主站三个工具链接指向8321/8322/8323。正式域名入口保留在原站。
6. 主站执行 `bash ops/deploy-preview.sh`。复制独立 `ops/nginx.preview.conf` 到 `/etc/nginx/conf.d/xueba-unified-preview.conf`，`nginx -t`成功后只reload Nginx，不替换原站块。
7. 使用 SSH 本地转发打开测试入口。所有认证请求经过SSH，不在公网HTTP提交密码。正式运行仍必须HTTPS，Secure+HttpOnly Cookie及严格CORS。

## 人工检查入口

有OpenSSH客户端时：

```sh
ssh -N -L 8320:127.0.0.1:8320 -L 8321:127.0.0.1:8321 -L 8322:127.0.0.1:8322 -L 8323:127.0.0.1:8323 ubuntu@134.175.136.31
```

- http://localhost:8320/ 主站、注册登录、账号与管理
- http://localhost:8321/ 汉字乐园
- http://localhost:8322/ 古文乐园
- http://localhost:8323/ 任务小帮手

请统一用 localhost，不混用127.0.0.1，Cookie按主机而非端口共享。游客旧记录在其原origin内，测试origin无法读取原HTTPS站的历史，不代表数据被删除。

## COS与备份

`COS_BUCKET`、`COS_REGION`必须真实核查；Bucket维持私有。优先CAM实例角色；否则显式配置STS临时凭证和有效期，拒绝已过期凭证。内网仅在 `TENCENT_SERVER_REGION` 确认与Bucket相同且 `COS_INTERNAL=true` 时启用，并实测路由可达。

```sh
docker compose --env-file .env.preview -f compose.preview.yml run --rm app node ops/cos.cjs test
bash ops/backup.sh
bash ops/restore-drill.sh backups/实际文件.dump
```

COS测试只删除当次脚本自己生成的唯一diagnostics文件；备份脚本不清理任何对象。恢复演练创建新的restore_drill数据库，保留供检查，不覆盖运行库。应在没有新写入的预览维护窗口立即比较备份与恢复的表行数；比较失败不能报告通过。生产恢复需要另外的明确授权与停写方案。

COS和恢复演练通过后安装启用 `xueba-preview-backup.service/.timer`，默认北京时间每天03:30。备份日志失败由systemd记录；需要实际核验定时任务状态，不把配置文件存在当成启用成功。

## 回滚

未合并 main 的分支测试可以停止独立 `xueba-unified-preview` 的 app 容器、恢复上一个测试归档/镜像。不要执行 `down -v`，保留数据库volume、私有邮件、备份和四站原目录。迁移只向前执行，数据库回滚须在新隔离库恢复经过验证的备份并指向该库。删除单独的Nginx测试配置前保存备份，验证成功后reload；原站配置始终保留。

## 配置与上线前检查

SSH凭证、COS与SMTP若尚未提供，部署和对应实测必须标记未完成。首个管理员只能由服务器脚本对已验证邮箱提权，不创建默认管理员或弱密码。大陆服务器正式切换前需核实备案及腾讯云接入备案；当前IP可达不等于备案已核实。正式域名TLS及DNS切换在人工验收后另行授权。

## 本次实测运行记录

2026-10-08用户明确授权复用此前SSH凭据后，本次隔离部署已完成。rootless Docker context与固定DOCKER_HOST socket运行，ubuntu无需docker组或root服务提权。四站仅回环，通过本机SSH隧道检查，原生产服务始终active。

当前COS缺配置，明确使用独立systemd drop-in Environment=BACKUP_TARGET=local；ops/backup.sh默认cos仍要求真实COS成功。每天03:30后加0–300秒，本地备份实测Result=success/exit0。该模式仅本地备份，不称异地备份。未来提供COS后移除local目标覆盖并实测cos模式后才改变报告状态。环境文件0600、backups0700/dump0600、mail-outbox0700且文件0600。

真实11表重启及新库恢复哈希匹配结果见unified-delivery.md和docs/evidence。人工检查入口、私有测试信箱及随机测试账号保存在本机unified目录，秘密不在Git。

## 早期免验证注册配置

详见 unified-registration.md。独立预览显式 REQUIRE_EMAIL_VERIFICATION=false，MAIL_PROVIDER=disabled，ENABLE_DEV_MAIL=false；缺省验证仍为true。部署前备份测试数据库和旧镜像，只执行新增0001兼容迁移。生产不执行。

TRUSTED_PROXY_SECRET 是服务端与回环Nginx共享的随机32位以上私密口令，存于0600 .env.preview；不提交Git。私有 /etc/nginx/snippets/xueba-unified-preview-proxy.conf 必须由部署者生成（0600）：设置 proxy_set_header X-Xbb-Proxy-Secret 为相同口令，以及 proxy_set_header X-Xbb-Client-Ip $remote_addr。仓库预览Nginx配置在所有API代理位置include该文件，必须先创建再 nginx -t/reload。仅覆盖单独预览块；不调整正式站/防火墙。错误或未配代理凭据时使用共享限流桶，不相信浏览器传入的地址。


## 家长入口简化部署（2026-10-08）

四个最终feature分支业务归档与taskhelper静态产物均按SHA256核验后部署，环境配置、Nginx、数据库结构及rootless/ubuntu架构不变。部署前保留数据库备份、原应用image和四仓库原归档；运行库账号/孩子/学习状态完整摘要在替换前后相同，生产主页摘要也相同。当前清单为 artifacts/manifest.json 与 parent-release.json；结果见 docs/evidence/parent-release-results.json。后续纯文档提交独立记录。

新家长检查入口：账号 localhost:8320/account、汉字 localhost:8321/parent.html、古文 localhost:8322/parent.html、任务 localhost:8323/parent/。原学生入口不变，记录同步/备份/恢复只显示于家长页。SSH本地连接已恢复，所有监听仅在127.0.0.1；没有新公网端口。无新增迁移，回滚仅需旧image和静态归档，详见 unified-parent-controls.md。
