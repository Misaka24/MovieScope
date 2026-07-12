# GitHub Actions 自动部署

## 0. 部署与上线原理

“部署”是把已经验证过的程序、运行环境和配置放到服务器上持续运行；“上线”是在部署成功后，通过域名、HTTPS 和反向代理让公网用户能够安全访问。MovieScope 将这两件事拆分为构建、分发、运行和公网接入四层，避免在服务器上临时安装依赖、手工复制文件或直接暴露数据库。

### 0.1 技术组件与职责

| 技术或组件 | 所在位置 | 负责什么 | 不负责什么 |
| --- | --- | --- | --- |
| Git / GitHub | 开发端与代码托管平台 | 保存源代码和提交历史，触发发布 | 不直接运行网站 |
| GitHub Actions | GitHub 托管 Runner | 检查代码、运行测试、构建镜像、连接服务器发布 | 不长期承载线上流量 |
| Dockerfile.web | CI 构建阶段 | 用 Node/Vite 编译前端，再生成只含 Nginx 和静态文件的生产镜像 | 不保存用户数据 |
| Dockerfile.api | CI 构建阶段 | 安装后端生产依赖，封装 Node 服务、迁移和脚本 | 不包含前端页面和 MySQL 数据 |
| Docker Buildx | GitHub Actions | 可复现地构建镜像并使用构建缓存 | 不负责运行容器 |
| GHCR | GitHub Container Registry | 保存 web/api 的 latest 与 SHA 版本镜像 | 不保存 .env.production 或数据库 |
| Docker Compose | 生产服务器 | 声明并编排 mysql、api、web 的启动顺序、网络、卷和健康检查 | 不提供公网域名和 TLS |
| MySQL 8.4 | mysql 容器 | 持久化用户、会话、评价、管理数据和 API 缓存 | 不直接向公网开放 |
| Node.js API | api 容器 | 业务逻辑、认证、权限、SQL、第三方 API 聚合与缓存 | 不直接向公网开放端口 |
| 容器内 Nginx | web 容器 | 返回 Vite 静态文件、缓存 assets、处理 SPA 回退、转发 /api | 不负责公网证书 |
| 宿主机 Nginx | 服务器操作系统 | 监听 80/443、绑定域名、终止 TLS，再转发到 127.0.0.1:8080 | 不运行 Vue 或业务逻辑 |
| Cloudflare | DNS 与边缘代理 | 域名解析、代理源站、边缘 TLS、缓存和基础防护 | 不替代源站应用和数据库 |
| Docker Volume | 生产服务器数据盘 | 让 MySQL 数据独立于容器生命周期持久保存 | 不自动提供异地备份 |
| SSH / SCP | Actions 到服务器 | 安全执行部署命令并上传 Compose/脚本 | 不承载用户访问流量 |

### 0.2 为什么需要两层 Nginx

MovieScope 同时使用宿主机 Nginx 与 Web 容器中的 Nginx，二者职责不同：

1. **宿主机 Nginx是公网入口**：监听服务器 80/443，选择正确域名和证书，将请求转发到本机 127.0.0.1:8080。它允许一台服务器未来托管多个域名，也避免把容器端口直接开放到公网。
2. **容器内 Nginx是应用入口**：提供 /usr/share/nginx/html 中的 Vite 构建产物；访问 /assets 时设置长期缓存；访问 Vue Router 的前端路由时回退 index.html；访问 /api/ 时通过 Docker DNS 将请求转发到 api:8787。

如果只使用静态文件服务器，刷新 /title/movie/123 等前端路由可能得到 404；容器内的 try_files 回退解决这个问题。如果让浏览器直接访问 API，又需要公开 API 端口并处理跨域；现在前端和 API 共享同一域名，浏览器只请求 /api/v1/*，由 Nginx 在服务器内部转发。

### 0.3 Docker 网络与端口隔离

docker-compose.prod.yml 创建 backend 内部网络。Compose 服务名同时是内部 DNS 名，因此 Web 容器可以访问 http://api:8787，API 容器可以访问 mysql:3306，无需写死容器 IP。

端口暴露关系：

~~~text
公网 80/443
  └─ 宿主机 Nginx
       └─ 127.0.0.1:8080 → web:80
                              ├─ 静态文件
                              └─ /api → api:8787 → mysql:3306
~~~

只有 Web 映射了 127.0.0.1:8080:80，而且绑定在回环地址。API 和 MySQL 没有 ports 配置，所以即使知道服务器 IP，也不能从公网直接连接 8787 或 3306。这是网络层的最小暴露原则。

### 0.4 前端镜像如何生成

Dockerfile.web 使用多阶段构建：

1. build 阶段基于 node:24-alpine，执行 npm ci 和 npm run build；
2. Vite 将 Vue、TypeScript、CSS 和资源编译为 dist/ 下的 HTML、JavaScript 和 CSS；
3. 最终阶段基于 nginx:1.27-alpine，只复制 dist 和容器 Nginx 配置。

因此线上 Web 镜像不需要 Node.js 开发服务器，也不包含 src 源文件或 node_modules 开发依赖。静态资源文件名包含内容哈希，Nginx 可以对 /assets 设置 immutable 长缓存；新版本发布时文件名变化，浏览器会请求新文件。

### 0.5 后端镜像如何生成

Dockerfile.api 基于 node:24-alpine，只安装 npm ci --omit=dev 的生产依赖，然后复制 server、db 和 scripts。容器以非 root 的 node 用户运行，通过 server/server.mjs 启动 HTTP 服务。

API 启动时连接 mysql 服务，并按顺序执行尚未应用的 db/migrations/*.mysql.sql。迁移文件相当于数据库结构的版本历史，因此已经发布的迁移不能随意修改；新的结构变化应新增更高编号迁移。

### 0.6 MySQL为什么不会随更新消失

容器是可替换的运行实例，镜像更新时旧容器会被删除并创建新容器。MySQL 的 /var/lib/mysql 挂载到命名卷 mysql_data，数据实际保存在独立卷中，不属于容器可写层。因此 docker compose up -d 替换 MySQL 容器不会删除数据。

需要特别区分：

- docker compose down：删除容器和网络，默认保留命名卷；
- docker compose down -v：同时删除命名卷，会导致数据库数据丢失；
- mysqldump 备份：生成可搬迁、可恢复的逻辑备份，用于卷损坏、误操作或跨机器恢复。

数据卷不是备份。卷仍可能因磁盘故障或误删损坏，所以自动部署前会额外执行 mysqldump，并应配置异地备份。

### 0.7 GitHub Actions发布流水线原理

工作流由 push main 或手动 workflow_dispatch 触发，并按依赖关系运行：

~~~text
verify
  └─ 成功后 → images（web 与 api 并行构建）
                  └─ 两个镜像都成功后 → deploy
~~~

verify 是发布门禁。只有类型检查、前端构建和服务端测试全部成功，才允许构建镜像。images 使用矩阵分别构建 web 与 api，Buildx 缓存会复用未变化的依赖层，缩短后续构建时间。镜像同时打 latest 和 sha-<commit> 标签：latest 用于默认部署，SHA 标签用于追踪与回滚。

concurrency 使用固定 production 分组且 cancel-in-progress 为 false，防止两个 main 提交同时操作同一台服务器。较早的部署不会在数据库迁移或容器更新中途被强行取消。

### 0.8 Actions如何连接服务器

部署 Job 从 GitHub Secrets 读取 SSH 主机、端口、用户、部署路径和 Base64 私钥。Runner 临时还原私钥，用 ssh-keyscan 写入 known_hosts，然后：

1. 通过 SCP 上传 docker-compose.prod.yml、deploy.sh 和 backup-mysql.sh；
2. 通过 SSH 登录服务器；
3. 使用本次 GITHUB_TOKEN 登录 GHCR；
4. 如果 MySQL 已运行，先执行数据库备份；
5. 执行 deploy.sh 拉取并更新容器。

Runner 结束后会销毁，私钥不保存在仓库。服务器上的 .env.production 不通过 SCP 覆盖，因此生产密码和 Token 与代码发布解耦。

### 0.9 Compose启动顺序与健康检查

Compose 的 depends_on 不只是声明顺序：API 等待 MySQL healthcheck 成功后才启动；Web 等待 API healthcheck 成功后再启动。健康检查分别验证：

- MySQL：mysqladmin ping 能连接数据库；
- API：容器内请求 /api/v1/health 返回成功；
- Web：容器内 /healthz 返回 200；
- 部署脚本：最终从宿主机请求 http://127.0.0.1:8080/api/v1/health。

最后一次检查会穿过“宿主机端口 → Web Nginx → API”链路，因此不仅验证进程存在，也验证反向代理和容器网络是否正常。

### 0.10 用户访问一次页面时发生什么

以打开电影详情页为例：

1. 浏览器查询 DNS，Cloudflare 返回代理节点地址；
2. 浏览器与 Cloudflare建立 HTTPS；Cloudflare再连接源站；
3. 宿主机 Nginx根据域名选择 MovieScope站点并转发到 127.0.0.1:8080；
4. Web Nginx返回 index.html 和带哈希的前端资源；
5. Vue在浏览器中启动并根据路由渲染详情页；
6. 前端请求同域 /api/v1/titles/movie/<id>；
7. Web Nginx把 /api 请求转发到 api:8787；
8. API先查询 MySQL缓存和站内数据，必要时访问上游，聚合后返回 JSON；
9. Vue使用返回数据更新页面。

浏览器从不直接知道 mysql:3306、api:8787 或第三方 Token。

### 0.11 一次代码发布时发生什么

1. 开发者提交并推送 main；
2. Actions用该提交的完整代码运行验证；
3. 同一提交被构建成 Web/API 镜像并推送 GHCR；
4. 部署 Job备份当前数据库；
5. 服务器 docker compose pull 下载新镜像；
6. docker compose up -d 比较当前容器配置与镜像，只替换需要更新的服务；
7. API新实例启动并执行增量迁移；
8. 健康检查通过后，Web和宿主机代理继续对外服务；
9. 最终链路检查成功，Actions标记部署完成。

代码、镜像和数据库是三种不同状态：Git记录源代码，GHCR保存可运行程序版本，MySQL卷保存业务数据。理解这个区别是安全更新和回滚的基础。

### 0.12 Cloudflare、HTTPS与源站隐藏

Cloudflare代理开启后，普通DNS查询看到的是Cloudflare边缘地址，用户请求先到Cloudflare，再由Cloudflare转发源站。它可以提供边缘TLS、缓存、限速和基础攻击防护。但如果源站IP通过历史DNS、邮件或其他服务泄露，代理本身不能完全阻止绕过访问。

更严格的源站保护应同时做到：

- 防火墙只开放SSH、80和443；
- SSH使用非默认端口和密钥认证；
- 8080仅绑定127.0.0.1；
- API与MySQL不映射宿主机端口；
- 可进一步限制80/443只允许Cloudflare IP段；
- Cloudflare到源站使用Full (strict)，源站保留有效证书。

### 0.13 哪些修改不会靠push自动完成

自动部署处理的是仓库内代码、Dockerfile、Compose和部署脚本。以下外部状态不会因Git push自动改变：

- 服务器 .env.production 中的密码、Token和镜像覆盖值；
- GitHub Secrets；
- Cloudflare DNS、代理、缓存和TLS设置；
- 宿主机Nginx站点配置；
- 防火墙和SSH配置；
- 证书续期故障；
- 数据盘挂载、Docker数据根目录和异地备份策略。

修改这些内容后，需要在对应系统中操作并验证，不能只看Actions绿色就假设外围配置已经更新。

> 当前实现基线：2026-07-12。生产环境只需配置 TMDB 与 Just One API 凭据，不再配置 `imdbapi.dev`。

本项目在推送到 `master` 后自动执行：代码检查 → 测试 → 构建 Web/API 镜像 → 推送 GHCR → SSH 到服务器备份 MySQL → 拉取镜像 → 更新容器 → 健康检查。

## 1. 服务器首次准备

以下命令以 Ubuntu 24.04、域名 `moviescope.example.com`、部署目录 `/opt/moviescope` 为例。

```bash
sudo apt update
sudo apt install -y ca-certificates curl nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo mkdir -p /opt/moviescope/deploy /opt/moviescope/backups
sudo chown -R $USER:$USER /opt/moviescope
```

退出 SSH 后重新登录，使 Docker 用户组生效。

## 2. 创建部署用户 SSH 密钥

本机生成独立部署密钥：

```bash
ssh-keygen -t ed25519 -C moviescope-deploy -f moviescope_deploy
ssh-copy-id -i moviescope_deploy.pub deploy@SERVER_IP
```

私钥 `moviescope_deploy` 的完整内容放入 GitHub Secret `DEPLOY_SSH_KEY`。公钥只放在服务器 `~/.ssh/authorized_keys`。

## 3. 服务器生产环境变量

在服务器创建 `/opt/moviescope/.env.production`，参考仓库的 `.env.production.example`。至少替换域名、两个 MySQL 密码和 API Token：

```bash
nano /opt/moviescope/.env.production
chmod 600 /opt/moviescope/.env.production
```

镜像名称中的 OWNER 必须小写并替换为 GitHub 用户名或组织名：

```env
WEB_IMAGE=ghcr.io/owner/moviescope-web:latest
API_IMAGE=ghcr.io/owner/moviescope-api:latest
WEB_ORIGIN=https://moviescope.example.com
```

## 4. GitHub Secrets

仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 示例 | 说明 |
| --- | --- | --- |
| `DEPLOY_HOST` | `203.0.113.10` | 服务器公网 IP |
| `DEPLOY_PORT` | `22` | SSH 端口 |
| `DEPLOY_USER` | `deploy` | 部署用户 |
| `DEPLOY_PATH` | `/opt/moviescope` | 部署目录 |
| `DEPLOY_SSH_KEY` | 私钥全文 | 不要上传公钥或带密码密钥 |

建议在 GitHub Environments 新建 `production`，可选配置审批和仅允许 `master` 部署。

## 5. 首次部署

完成 Secrets 和服务器环境变量后，推送一次提交到 `master`，或在 Actions 页面手动运行 “Deploy MovieScope”。流水线会把 Compose 和脚本上传至服务器并启动服务。

检查：

```bash
cd /opt/moviescope
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl http://127.0.0.1:8080/api/v1/health
```

## 6. 配置宿主机 Nginx 与 HTTPS

将仓库 `deploy/nginx-host.conf.example` 复制到服务器并替换域名：

```bash
sudo nano /etc/nginx/sites-available/moviescope
sudo ln -s /etc/nginx/sites-available/moviescope /etc/nginx/sites-enabled/moviescope
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d moviescope.example.com
```

证书启用后重新确认服务器 `.env.production` 的 `WEB_ORIGIN` 是完全一致的 HTTPS 域名。

## 7. 后续自动更新

今后正常执行：

```bash
git add .
git commit -m "feat: update MovieScope"
git push origin master
```

GitHub Actions 会自动部署。每次部署前，如果 MySQL 已运行，会先在服务器 `backups/` 生成压缩备份，默认保留 14 天。

## 8. 回滚

GHCR 同时保留 `latest` 和 `sha-提交哈希` 标签。修改服务器 `.env.production`：

```env
WEB_IMAGE=ghcr.io/owner/moviescope-web:sha-abcdef1
API_IMAGE=ghcr.io/owner/moviescope-api:sha-abcdef1
```

然后：

```bash
cd /opt/moviescope
./deploy/deploy.sh
```

## 9. 注意事项

- GitHub仓库和镜像包若为私有，服务器需要保持GHCR登录状态；Actions每次部署都会重新登录。
- `.env.production`、数据库密码和API密钥只保留在服务器，绝不能提交到Git。
- 防火墙只开放SSH、80、443。8080只绑定到127.0.0.1，MySQL不暴露公网。
- 自动迁移在API容器启动时执行。单API实例下可用；未来扩容多实例前应拆成独立迁移Job。
- 首次部署没有现存MySQL容器时会跳过备份，这是正常行为。
