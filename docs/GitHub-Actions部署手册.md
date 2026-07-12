# GitHub Actions 自动部署

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
