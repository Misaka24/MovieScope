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

## 文档

- [完整项目与架构说明](./docs/项目与架构说明.md)
- [用户使用手册](./docs/用户使用手册.md)
- [管理员操作手册](./docs/管理员操作手册.md)
- [GitHub Actions 部署手册](./docs/GitHub-Actions部署手册.md)

生产环境使用 `docker-compose.prod.yml` 编排 MySQL、API 和 Nginx Web；密钥仅配置在服务器环境变量或 GitHub Secrets。`.env`、日志、数据库数据、缓存导出和构建产物不得提交。

## License

[MIT](./LICENSE)
