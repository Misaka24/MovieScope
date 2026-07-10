# MovieScope

MovieScope 是一个基于 Vue 3、Vite、TypeScript、Node.js 和 MySQL 的影视搜索、发现、评分与用户社区网站。浏览器只访问 MovieScope 后端，不直接携带第三方 API 密钥。

## 功能

- 首页、搜索、探索、榜单、新闻、影视详情和影人详情；
- TMDB 影视资料与中文本地化信息；
- imdbapi.dev 的 IMDb 单片评分数据；
- Just One API 的 IMDb Top 250 与新闻数据；
- 注册、登录、HttpOnly Cookie 会话和登录限流；
- 想看、在看、看过、收藏、评分和短评；
- 个人中心、公开/私密主页、浏览与搜索历史；
- 用户管理、短评审核、审计日志和数据源日志后台；
- 第三方 API 响应使用 MySQL 持久化缓存，不使用进程内业务缓存。

豆瓣数据接口当前暂停调用和展示。

## 文档

- [用户使用手册](./docs/用户使用手册.md)
- [管理员操作手册](./docs/管理员操作手册.md)
- [需求理解](./docs/需求理解.md)
- [方案设计](./docs/方案设计.md)
- [代码审查](./docs/代码审查.md)

## 本地运行

1. 创建 MySQL 数据库 `moviescope`。
2. 复制 `.env.example` 为 `.env`，填写 MySQL 参数和需要使用的第三方 API Token。
3. 安装依赖：`npm install`。
4. 同时启动前后端：`npm run dev:all`。
5. 打开 `http://127.0.0.1:5173/`。

也可以分别启动：

```powershell
npm run api
npm run dev:web
```

后端默认监听 `http://127.0.0.1:8787`，Vite 将 `/api` 请求代理到后端。

## MySQL 与迁移

后端启动时会按文件名顺序自动执行 `db/migrations/*.mysql.sql`。当前主要业务表包括：

- `users`
- `user_sessions`
- `auth_login_attempts`
- `user_media_entries`
- `user_browse_history`
- `user_search_history`
- `admin_audit_logs`
- `api_cache`
- `provider_sync_logs`

`MYSQL_URL` 配置后优先于 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD` 和 `MYSQL_DATABASE`。

## 数据来源

- TMDB：中文标题、类型、海报、背景图、简介、演职员、图片、上映信息、热门电影、热门剧集、发现筛选和观看平台等。
- imdbapi.dev：通过 IMDb ID 获取普通电影和剧集的 IMDb 数据与评分。
- Just One API：暂时仅保留 IMDb Top 250 和影视新闻。
- 豆瓣：当前暂停，不发起请求，也不展示豆瓣 UI。

影视条目优先展示 IMDb 评分；确实没有 IMDb ID 或 IMDb 未收录时，可按页面规则回退展示 TMDB 评分，并明确标注来源。

## 缓存核查

所有第三方响应缓存写入 MySQL 的 `api_cache`，同步结果写入 `provider_sync_logs`。

```powershell
npm run cache:inspect
npm run cache:export
npm run cache:export -- cache-review.json
```

也可以使用 DBeaver、DataGrip 或 MySQL Workbench 连接 `moviescope` 数据库直接核查。缓存或日志导出文件可能包含大量第三方响应，不应提交到 Git。

## 创建管理员

先通过网站注册普通账号，再执行：

```powershell
npm run admin:promote -- <用户名或邮箱>
```

重新登录后可访问 `/admin`。系统没有默认管理员和默认管理员密码。

## 主要接口

- `GET /api/v1/health`：服务和 MySQL 健康检查；
- `GET /api/v1/home`：首页聚合数据；
- `GET /api/v1/search`：综合搜索；
- `GET /api/v1/discover`：影视探索与筛选；
- `POST /api/v1/auth/register`：注册；
- `POST /api/v1/auth/login`：登录；
- `GET /api/v1/me/profile`：当前用户个人中心数据；
- `PUT /api/v1/me/media/:type/:id`：保存观影状态、收藏、评分和短评；
- `GET /api/v1/admin/overview`：管理员概览。

前端页面应继续通过 `src/services` 访问 MovieScope 后端，由服务端的 Provider 层访问第三方 API。

## 校验

```powershell
npm run typecheck
npm run build
node --test server/home-service.test.mjs server/user-service.test.mjs
```

不要提交 `.env`、数据库密码、第三方 API Token、会话 Token、数据库转储或缓存导出文件。
