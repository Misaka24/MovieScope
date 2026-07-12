# MovieScope

MovieScope 是一个基于 Vue 3、TypeScript、Node.js 与 MySQL 的影视资料聚合、发现、评分评价和个人观影管理平台。TMDB 是免费主体数据源；Just One API 提供 IMDb 与豆瓣深度数据；浏览器只访问 MovieScope 后端，不接触第三方密钥。

## 主要功能

- 首页、搜索、探索、新闻、IMDb 电影/剧集 Top 250；
- 电影/剧集详情、横向 Hero、预告片、完整演职员和剧照页面；
- TMDB/IMDb/豆瓣影迷评价（默认 TMDB）、IMDb 影评人评论、奖项、“你知道吗”和票房摘要；
- 豆瓣评分、长评、近期热门电影/剧集及 IMDb→豆瓣 ID 映射；
- 站内星级评分、评价、剧透筛选、个人主页与历史；
- 注册登录、HttpOnly Cookie 会话、管理员权限、审核、Provider 与缓存管理；
- MySQL 持久化缓存、动态 TTL 和上游故障 stale 回退。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vue Router、Vite、Tailwind CSS |
| 后端 | Node.js ESM、原生 `node:http`、Fetch API |
| 数据库 | MySQL 8、`mysql2/promise`、SQL migrations |
| 数据源 | TMDB、Just One IMDb/豆瓣、Wikidata SPARQL |
| 部署 | Docker、Docker Compose、Nginx、GitHub Actions、GHCR |

## 数据分工

- TMDB：搜索、趋势、中文主体资料、海报/剧照、预告片、演职员、影人、推荐和默认热门榜。
- Just One IMDb：Redux 评分与详情、用户/影评人评价、奖项、票房、“你知道吗”、新闻和电影/剧集 Top 250。
- Just One 豆瓣：条目评分、长篇影评和近期热门；豆瓣短评接口已停用。
- MySQL：账号、会话、站内评价、历史、管理员数据、API 缓存和外部 ID 映射。

## 本地运行

1. 安装 Node.js 20+ 与 MySQL 8，并创建 `moviescope` 数据库。
2. 复制 `.env.example` 为 `.env`，填写 MySQL、`TMDB_ACCESS_TOKEN` 和 `JUSTONE_API_TOKEN`。
3. 执行 `npm install`。
4. 执行 `npm run dev:all`，访问 `http://127.0.0.1:5173`。

```powershell
npm run api
npm run dev:web
npm test
npm run typecheck
npm run build
npm run check
```

API 默认监听 `http://127.0.0.1:8787`；启动时按文件名顺序执行 `db/migrations/*.mysql.sql`。

## 当前缓存策略

影视通用 Just One 数据：上映 ≤14 天缓存 1 天；14–60 天缓存 7 天；60–90 天缓存 30 天；>90 天缓存 60 天。奖项在上映 180 天内缓存 7 天，之后 45 天；“你知道吗”在上映 30 天内缓存 7 天，之后 45 天。Top 250 为 7 天，豆瓣近期热门为 3 天，IMDb 新闻为 1 天。详情见架构文档。

## 生产部署架构

MovieScope 采用“GitHub Actions 构建镜像，服务器只负责运行镜像”的自动部署方式。生产服务器不在宿主机直接运行 Vite、Node.js 或 MySQL，而是由 Docker Compose 管理三个服务：

部署体系的核心分工是：GitHub保存源代码，Actions验证并构建，GHCR保存可运行镜像，Docker Compose运行服务，MySQL卷保存业务数据，双层Nginx负责应用路由与公网接入，Cloudflare负责DNS和边缘代理。更详细的逐层原理、网络隔离、一次请求与一次发布的完整时序见[部署手册：部署与上线原理](./docs/GitHub-Actions部署手册.md#0-部署与上线原理)。

| 服务 | 生产职责 | 网络范围 |
| --- | --- | --- |
| web | Nginx 托管 Vite 静态前端，并将 /api/ 转发给 API | 仅绑定宿主机 127.0.0.1:8080 |
| api | Node.js 后端、认证、业务接口、第三方 API 聚合和迁移 | 仅 Docker 内部网络 |
| mysql | 用户、会话、互动、评价、管理数据和 API 缓存 | 仅 Docker 内部网络 |

公网请求链路：

~~~text
用户浏览器
  → Cloudflare DNS / CDN / 代理
  → 宿主机 Nginx（HTTPS、域名入口）
  → 127.0.0.1:8080 的 web 容器
      ├─ 页面和静态资源 → web 直接返回
      └─ /api/v1/*       → api:8787
                              ├─ 读写 mysql:3306
                              └─ 按需请求第三方上游
~~~

MySQL 和 Node API 不直接暴露公网；第三方 Token 只保存在服务器的 .env.production 中，不会进入浏览器、Git 仓库或前端镜像。

### 首次部署

1. 在服务器数据盘创建部署目录和备份目录，例如 /data/moviescope。
2. 安装 Docker Engine、Docker Compose 插件和宿主机 Nginx。
3. 将 .env.production.example 复制为服务器上的 .env.production，填写镜像、MySQL 密码、站点来源和 API Token。
4. 配置部署 SSH 公钥，并在 GitHub Environment/Secrets 保存服务器地址、端口、用户、部署路径和私钥。
5. 配置 Cloudflare DNS；需要隐藏源站时开启代理。
6. 参考 deploy/nginx-host.conf.example 配置宿主机 Nginx，并申请 HTTPS 证书。
7. 首次启动 docker-compose.prod.yml。MySQL 健康后 API 才会启动；API 启动时自动执行 db/migrations/*.mysql.sql；最后 Web 容器启动。

完整命令和 Secrets 清单见[GitHub Actions 部署手册](./docs/GitHub-Actions部署手册.md)。

### 推送代码后如何自动上线

推送 main 分支后，[部署工作流](./.github/workflows/deploy.yml)按三个阶段执行：

1. **验证**：安装锁定依赖，执行类型检查、生产构建和服务端测试；失败则停止发布，线上版本不变。
2. **构建镜像**：根据 Dockerfile.web 和 Dockerfile.api 构建前端、后端镜像，生成 latest 与 sha-<commit> 标签并推送 GHCR。
3. **服务器部署**：SSH 上传 Compose 与脚本；若 MySQL 正在运行则先备份；随后拉取镜像、替换容器并请求 /api/v1/health 验证部署。

日常发布流程：

~~~bash
git add <本次变更文件>
git commit -m "<Conventional Commit>"
git push origin main
~~~

推送后通常不需要登录服务器复制文件，但必须在 GitHub Actions 页面确认验证、镜像和部署任务均成功。

### 前端、后端与数据库如何更新

- **前端修改**：重新构建 moviescope-web 镜像并替换 Web 容器，不清空 API 或数据库。
- **后端修改**：重新构建 moviescope-api 镜像并替换 API 容器，MySQL 数据卷不受影响。
- **数据库结构修改**：新增按编号递增的 db/migrations/*.mysql.sql，不能重写已经在生产执行过的迁移。API 启动时执行尚未应用的迁移。
- **环境变量或密钥修改**：Git 推送不会改写服务器 .env.production，需在服务器更新后重新部署或重启相关容器。
- **Nginx、DNS 或证书修改**：属于宿主机外围基础设施，需要单独更新，不包含在应用镜像中。

### 数据持久化与备份

MySQL 使用 Docker 命名卷 mysql_data。常规更新和重建容器不会删除该卷；生产环境禁止随意执行 docker compose down -v。

每次自动部署前，[数据库备份脚本](./deploy/backup-mysql.sh)会在 MySQL 已运行时执行一致性导出，写入 backups/，默认保留 14 天。重要升级前应额外制作长期备份，并将备份复制到其他磁盘或对象存储。

### 回滚

GHCR 同时保存 latest 和 sha-<commit> 镜像。回滚时，将服务器 .env.production 中的 WEB_IMAGE、API_IMAGE 指向目标 SHA 标签，再执行 ./deploy/deploy.sh。若回滚涉及不兼容的数据库结构，还需评估迁移是否可逆，并根据部署前备份恢复；数据库不会随镜像自动回退。

### 服务器长期保留的内容

~~~text
/data/moviescope/
├─ .env.production          # 真实生产密钥，不提交 Git
├─ docker-compose.prod.yml  # Actions 自动更新
├─ deploy/                  # 部署与备份脚本，Actions 自动更新
└─ backups/                 # MySQL 压缩备份
~~~

容器镜像由 GHCR 管理，MySQL 数据由 Docker 数据卷持久化。仓库中的 example 文件是安全模板，不能替代服务器上的真实配置。

## 文档

- [完整项目与架构说明](./docs/项目与架构说明.md)
- [需求理解](./docs/需求理解.md)
- [技术方案设计](./docs/方案设计.md)
- [用户使用手册](./docs/用户使用手册.md)
- [管理员操作手册](./docs/管理员操作手册.md)
- [GitHub Actions 部署手册](./docs/GitHub-Actions部署手册.md)

生产环境使用 `docker-compose.prod.yml` 编排 MySQL、API 和 Nginx Web；密钥仅配置在服务器环境变量或 GitHub Secrets。`.env`、日志、数据库数据、缓存导出和构建产物不得提交。

## License

[MIT](./LICENSE)
