# MovieScope

MovieScope 是一个基于 Vue 3、Vite 和 TypeScript 的影视发现与评分网站。当前首页已通过本地后端聚合 TMDB、豆瓣和 IMDb 的真实数据，浏览器不会直接携带或请求第三方 API 密钥。

## 本地运行

1. 复制 `.env.example` 为 `.env`，填写 `TMDB_ACCESS_TOKEN` 和 `JUSTONE_API_TOKEN`。
2. 安装依赖：`npm install`。
3. 同时启动前后端：`npm run dev:all`。
4. 打开 `http://127.0.0.1:5173/`。

也可以分别执行 `npm run api` 与 `npm run dev`。后端默认监听 `http://127.0.0.1:8787`，Vite 将 `/api` 请求代理到该服务。

## 数据与缓存

- TMDB：中文标题、类型、海报、背景图、简介、正在上映、热门电影、热门剧集和 Hero 候选池。
- IMDb：Top 250、Hero 的 IMDb 评分补充和电影新闻。
- 豆瓣：近期热门电影/剧集评分；仅在标准化标题和年份可靠匹配时合并。
- 外部评分按来源独立展示，缺失值显示“暂无”，不会把 TMDB 评分冒充 IMDb 或豆瓣评分。
- 所有第三方响应缓存均写入 SQL 表 `api_cache`，同步结果写入 `provider_sync_logs`，不使用进程内存缓存。

未设置 `DATABASE_URL` 时，本地使用持久化 PGlite 数据库，文件位于 `.data/pglite`。生产环境设置 PostgreSQL 连接串后使用 PostgreSQL。两种模式共用 [SQL 迁移](./db/migrations/001_api_cache.sql)。

## 接口

- `GET /api/v1/health`：服务与数据库健康检查。
- `GET /api/v1/home`：首页聚合数据。

后续页面应继续通过 `src/services` 调用 MovieScope 后端，由 `server/providers.mjs` 访问第三方接口；不得从浏览器直接调用 TMDB 或 Just One API。

## 校验

```bash
npm run typecheck
npm run build
```
