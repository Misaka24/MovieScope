import { createServer } from "node:http";
import { loadEnv } from "./env.mjs";
import { getDatabase } from "./database.mjs";
import { getHomeData } from "./home-service.mjs";
import {
  discoverCatalog,
  getBrowsePage,
  getCatalogOptions,
  getIndustryNews,
  getExternalTitleReviews,
  getPersonDetails,
  getPopularPeople,
  getPopularBySource,
  getTitleDetails,
  getWatchProviders,
  resolveTitleId,
  searchCatalog,
} from "./catalog-service.mjs";
import {
  authenticateUser,
  changePassword,
  clearHistory,
  createSession,
  deleteMediaEntry,
  getCommunityReviews,
  toggleReviewLike,
  getHistory,
  getMediaEntry,
  getOwnProfile,
  getPublicProfile,
  getSessionUser,
  httpError,
  listMediaEntries,
  recordBrowse,
  recordSearch,
  registerUser,
  revokeSession,
  sessionDays,
  updateProfile,
  upsertMediaEntry,
} from "./user-service.mjs";
import {
  adminAnalytics,
  adminBulkUsers,
  adminCache,
  adminDeleteCache,
  adminDeleteGroup,
  adminDeleteProvider,
  adminGroups,
  adminLogs,
  adminMediaAnalytics,
  adminModerate,
  adminOverview,
  adminProviders,
  adminPutCache,
  adminReviews,
  adminSaveGroup,
  adminSaveProvider,
  adminSaveSetting,
  adminSetUserAccess,
  adminSettings,
  adminTestProvider,
  adminUpdateUser,
  adminUserDetail,
  adminUsers,
  getAdminAccess,
  isRegistrationEnabled,
  publicSettings,
  requireAdminPermission,
} from "./admin-service.mjs";
import { getSettingValue } from "./runtime-config.mjs";
import { getDoubanReviewDetail } from "./douban-service.mjs";

loadEnv();
const port = Number(process.env.API_PORT || 8787),
  host = process.env.API_HOST || "127.0.0.1",
  allowedOrigin = process.env.WEB_ORIGIN || "http://127.0.0.1:5173",
  cookieName = "moviescope_session";
function sendJson(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    ...headers,
  });
  response.end(JSON.stringify(body));
}
function success(response, data, status = 200, headers = {}) {
  sendJson(
    response,
    status,
    { data, meta: { requestId: crypto.randomUUID() }, error: null },
    headers,
  );
}
function queryParams(url) {
  return Object.fromEntries(url.searchParams.entries());
}
function cookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const index = value.indexOf("=");
        return [
          decodeURIComponent(value.slice(0, index)),
          decodeURIComponent(value.slice(index + 1)),
        ];
      }),
  );
}
function sessionCookie(token, expiresAt) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}
function clearCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
async function readJson(request) {
  let size = 0,
    body = "";
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024)
      throw httpError(413, "请求内容过大", "PAYLOAD_TOO_LARGE");
    body += chunk;
  }
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw httpError(400, "请求 JSON 格式无效", "INVALID_JSON");
  }
}
function clientIp(request) {
  return String(
    request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
  )
    .split(",")[0]
    .trim();
}
async function authUser(request) {
  return getSessionUser(cookies(request)[cookieName]);
}
async function requireUser(request) {
  const user = await authUser(request);
  if (!user) throw httpError(401, "请先登录", "AUTH_REQUIRED");
  return user;
}
async function requireAdmin(request) {
  const user = await requireUser(request);
  if (user.role !== "admin")
    throw httpError(403, "需要管理员权限", "ADMIN_REQUIRED");
  return user;
}
async function requirePermission(request, key) {
  const user = await requireAdmin(request);
  await requireAdminPermission(user, key);
  return user;
}
function mediaPayload(details) {
  return {
    mediaType: details.mediaType,
    tmdbId: details.id,
    imdbId: details.imdbId,
    title: details.title,
    posterUrl: details.poster,
    releaseYear: details.year,
    genres: details.genres || [],
    originalLanguage: details.originalLanguage || null,
    originCountry: details.originCountries?.[0] || null,
  };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
    response.end();
    return;
  }
  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method || "GET")) {
      const origin = request.headers.origin;
      if (origin && origin !== allowedOrigin)
        throw httpError(403, "请求来源不受信任", "INVALID_ORIGIN");
    }
    if (
      !url.pathname.startsWith("/api/v1/admin") &&
      ![
        "/api/v1/health",
        "/api/v1/auth/me",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/settings/public",
      ].includes(url.pathname) &&
      (await getSettingValue("maintenance_mode", false))
    ) {
      const user = await authUser(request);
      if (user?.role !== "admin")
        throw httpError(503, "网站正在维护，请稍后再试", "MAINTENANCE_MODE");
    }
    if (request.method === "GET" && url.pathname === "/api/v1/health") {
      const db = await getDatabase();
      await db.query("SELECT 1 AS ok");
      success(response, { status: "ok", database: db.mode });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/auth/register") {
      if (!(await isRegistrationEnabled()))
        throw httpError(403, "网站当前暂停注册", "REGISTRATION_DISABLED");
      const body = await readJson(request),
        user = await registerUser(body),
        session = await createSession(user.id, {
          ip: clientIp(request),
          userAgent: request.headers["user-agent"],
        });
      success(response, { user }, 201, {
        "Set-Cookie": sessionCookie(session.token, session.expiresAt),
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/auth/login") {
      const body = await readJson(request),
        user = await authenticateUser(
          body.identifier,
          body.password,
          clientIp(request),
        ),
        session = await createSession(user.id, {
          ip: clientIp(request),
          userAgent: request.headers["user-agent"],
        });
      success(response, { user }, 200, {
        "Set-Cookie": sessionCookie(session.token, session.expiresAt),
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/auth/logout") {
      await revokeSession(cookies(request)[cookieName]);
      success(response, { loggedOut: true }, 200, {
        "Set-Cookie": clearCookie(),
      });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/auth/me") {
      const user = await authUser(request);
      success(response, {
        user,
        adminAccess:
          user?.role === "admin" ? await getAdminAccess(user.id) : null,
      });
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/settings/public"
    ) {
      success(response, await publicSettings());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/me/profile") {
      const user = await requireUser(request);
      success(response, await getOwnProfile(user.id));
      return;
    }
    if (request.method === "PUT" && url.pathname === "/api/v1/me/profile") {
      const user = await requireUser(request);
      success(response, {
        user: await updateProfile(user.id, await readJson(request)),
      });
      return;
    }
    if (request.method === "PUT" && url.pathname === "/api/v1/me/password") {
      const user = await requireUser(request),
        body = await readJson(request);
      await changePassword(user.id, body.currentPassword, body.nextPassword);
      success(response, { changed: true }, 200, {
        "Set-Cookie": clearCookie(),
      });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/me/media") {
      const user = await requireUser(request);
      success(response, await listMediaEntries(user.id, queryParams(url)));
      return;
    }
    const myMedia = url.pathname.match(
      /^\/api\/v1\/me\/media\/(movie|tv)\/(\d+)$/,
    );
    if (myMedia && request.method === "GET") {
      const user = await requireUser(request);
      success(
        response,
        await getMediaEntry(user.id, myMedia[1], Number(myMedia[2])),
      );
      return;
    }
    if (myMedia && request.method === "PUT") {
      const user = await requireUser(request),
        body = await readJson(request);
      success(
        response,
        await upsertMediaEntry(user.id, {
          ...body,
          mediaType: myMedia[1],
          tmdbId: Number(myMedia[2]),
        }),
      );
      return;
    }
    if (myMedia && request.method === "DELETE") {
      const user = await requireUser(request);
      await deleteMediaEntry(user.id, myMedia[1], Number(myMedia[2]));
      success(response, { deleted: true });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/me/history") {
      const user = await requireUser(request);
      success(response, await getHistory(user.id));
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/me/history/browse"
    ) {
      const user = await requireUser(request);
      await recordBrowse(user.id, await readJson(request));
      success(response, { recorded: true }, 201);
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/me/history/search"
    ) {
      const user = await requireUser(request);
      await recordSearch(user.id, await readJson(request));
      success(response, { recorded: true }, 201);
      return;
    }
    const historyDelete = url.pathname.match(
      /^\/api\/v1\/me\/history\/(browse|search)$/,
    );
    if (historyDelete && request.method === "DELETE") {
      const user = await requireUser(request);
      await clearHistory(user.id, historyDelete[1]);
      success(response, { cleared: true });
      return;
    }
    const publicProfile = url.pathname.match(/^\/api\/v1\/users\/([^/]+)$/);
    if (publicProfile && request.method === "GET") {
      const viewer = await authUser(request);
      success(
        response,
        await getPublicProfile(
          decodeURIComponent(publicProfile[1]),
          viewer?.id,
        ),
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/v1/admin/access") {
      const admin = await requireAdmin(request);
      success(response, await getAdminAccess(admin.id));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/overview") {
      await requirePermission(request, "dashboard.view");
      success(response, await adminOverview());
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/admin/analytics"
    ) {
      await requirePermission(request, "analytics.view");
      success(response, await adminAnalytics());
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/admin/analytics/media"
    ) {
      await requirePermission(request, "analytics.view");
      success(response, await adminMediaAnalytics(queryParams(url)));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/users") {
      await requirePermission(request, "users.view");
      success(response, await adminUsers(queryParams(url)));
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/admin/users/bulk"
    ) {
      const admin = await requirePermission(request, "users.manage");
      success(
        response,
        await adminBulkUsers(admin, await readJson(request), clientIp(request)),
      );
      return;
    }
    const adminUser = url.pathname.match(/^\/api\/v1\/admin\/users\/(\d+)$/);
    if (adminUser && request.method === "GET") {
      await requirePermission(request, "users.view");
      success(response, await adminUserDetail(Number(adminUser[1])));
      return;
    }
    if (adminUser && request.method === "PATCH") {
      const admin = await requirePermission(request, "users.manage");
      success(
        response,
        await adminUpdateUser(
          admin,
          Number(adminUser[1]),
          await readJson(request),
          clientIp(request),
        ),
      );
      return;
    }
    const adminUserAccess = url.pathname.match(
      /^\/api\/v1\/admin\/users\/(\d+)\/access$/,
    );
    if (adminUserAccess && request.method === "PUT") {
      const admin = await requirePermission(request, "users.permissions");
      success(
        response,
        await adminSetUserAccess(
          admin,
          Number(adminUserAccess[1]),
          await readJson(request),
          clientIp(request),
        ),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/groups") {
      await requirePermission(request, "users.permissions");
      success(response, await adminGroups());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/admin/groups") {
      const admin = await requirePermission(request, "users.permissions");
      success(
        response,
        await adminSaveGroup(admin, await readJson(request), clientIp(request)),
        201,
      );
      return;
    }
    const adminGroup = url.pathname.match(/^\/api\/v1\/admin\/groups\/(\d+)$/);
    if (adminGroup && request.method === "PUT") {
      const admin = await requirePermission(request, "users.permissions");
      success(
        response,
        await adminSaveGroup(
          admin,
          await readJson(request),
          clientIp(request),
          Number(adminGroup[1]),
        ),
      );
      return;
    }
    if (adminGroup && request.method === "DELETE") {
      const admin = await requirePermission(request, "users.permissions");
      success(
        response,
        await adminDeleteGroup(admin, Number(adminGroup[1]), clientIp(request)),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/reviews") {
      await requirePermission(request, "reviews.view");
      success(response, await adminReviews(queryParams(url)));
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/admin/reviews/moderate"
    ) {
      const admin = await requirePermission(request, "reviews.moderate"),
        body = await readJson(request);
      success(
        response,
        await adminModerate(
          admin,
          body.entryIds,
          body.status,
          clientIp(request),
        ),
      );
      return;
    }
    const adminReview = url.pathname.match(
      /^\/api\/v1\/admin\/reviews\/(\d+)$/,
    );
    if (adminReview && request.method === "PATCH") {
      const admin = await requirePermission(request, "reviews.moderate"),
        body = await readJson(request);
      success(
        response,
        await adminModerate(
          admin,
          Number(adminReview[1]),
          body.status,
          clientIp(request),
        ),
      );
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/admin/providers"
    ) {
      await requirePermission(request, "providers.view");
      success(response, await adminProviders());
      return;
    }
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/admin/providers"
    ) {
      const admin = await requirePermission(request, "providers.manage");
      success(
        response,
        await adminSaveProvider(
          admin,
          await readJson(request),
          clientIp(request),
        ),
        201,
      );
      return;
    }
    const adminProvider = url.pathname.match(
      /^\/api\/v1\/admin\/providers\/([a-zA-Z0-9_-]+)$/,
    );
    if (adminProvider && request.method === "PUT") {
      const admin = await requirePermission(request, "providers.manage");
      success(
        response,
        await adminSaveProvider(
          admin,
          await readJson(request),
          clientIp(request),
          adminProvider[1],
        ),
      );
      return;
    }
    if (adminProvider && request.method === "DELETE") {
      const admin = await requirePermission(request, "providers.manage");
      success(
        response,
        await adminDeleteProvider(admin, adminProvider[1], clientIp(request)),
      );
      return;
    }
    const adminProviderTest = url.pathname.match(
      /^\/api\/v1\/admin\/providers\/([a-zA-Z0-9_-]+)\/test$/,
    );
    if (adminProviderTest && request.method === "POST") {
      const admin = await requirePermission(request, "providers.test");
      success(
        response,
        await adminTestProvider(admin, adminProviderTest[1], clientIp(request)),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/cache") {
      await requirePermission(request, "cache.view");
      success(response, await adminCache(queryParams(url)));
      return;
    }
    if (request.method === "PUT" && url.pathname === "/api/v1/admin/cache") {
      const admin = await requirePermission(request, "cache.manage");
      success(
        response,
        await adminPutCache(admin, await readJson(request), clientIp(request)),
      );
      return;
    }
    if (request.method === "DELETE" && url.pathname === "/api/v1/admin/cache") {
      const admin = await requirePermission(request, "cache.manage");
      success(
        response,
        await adminDeleteCache(
          admin,
          await readJson(request),
          clientIp(request),
        ),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/logs") {
      await requirePermission(request, "logs.view");
      success(response, await adminLogs(queryParams(url)));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/admin/settings") {
      await requirePermission(request, "settings.view");
      success(response, await adminSettings());
      return;
    }
    const adminSetting = url.pathname.match(
      /^\/api\/v1\/admin\/settings\/([a-zA-Z0-9_-]+)$/,
    );
    if (adminSetting && request.method === "PUT") {
      const admin = await requirePermission(request, "settings.manage");
      success(
        response,
        await adminSaveSetting(
          admin,
          adminSetting[1],
          await readJson(request),
          clientIp(request),
        ),
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/v1/home") {
      success(response, await getHomeData());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/search") {
      const params = queryParams(url),
        data = await searchCatalog(params),
        user = await authUser(request);
      if (user && params.query)
        await recordSearch(user.id, { query: params.query, type: params.type });
      success(response, data);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/discover") {
      const params = queryParams(url);
      success(
        response,
        await discoverCatalog({
          mediaType: params.media,
          page: params.page,
          sortBy: params.sort,
          genres: params.genres,
          year: params.year,
          yearFrom: params.yearFrom,
          yearTo: params.yearTo,
          minRating: params.rating,
          language: params.language,
          provider: params.provider,
          watchRegion: params.watchRegion,
        }),
      );
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/catalog/options"
    ) {
      success(response, await getCatalogOptions());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/browse") {
      success(
        response,
        await getBrowsePage(
          url.searchParams.get("preset"),
          url.searchParams.get("page"),
        ),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/people/popular") {
      success(
        response,
        await getPopularPeople(
          url.searchParams.get("page"),
          url.searchParams.get("department"),
        ),
      );
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/popular") {
      success(
        response,
        await getPopularBySource(
          url.searchParams.get("type"),
          url.searchParams.get("source") || "tmdb",
          url.searchParams.get("page") || 1,
        ),
      );
      return;
    }
    if (
      request.method === "GET" &&
      url.pathname === "/api/v1/watch-providers"
    ) {
      success(response, await getWatchProviders());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/v1/news") {
      success(response, await getIndustryNews());
      return;
    }
    const externalReviews = url.pathname.match(
      /^\/api\/v1\/titles\/(movie|tv)\/(\d+)\/external-reviews$/,
    );
    if (externalReviews && request.method === "GET") {
      success(
        response,
        await getExternalTitleReviews(
          externalReviews[1],
          Number(externalReviews[2]),
        ),
      );
      return;
    }
    const doubanReviewDetail = url.pathname.match(
      /^\/api\/v1\/douban\/reviews\/(\d+)$/,
    );
    if (doubanReviewDetail && request.method === "GET") {
      success(response, await getDoubanReviewDetail(doubanReviewDetail[1]));
      return;
    }
    const titleReviews = url.pathname.match(
      /^\/api\/v1\/titles\/(movie|tv)\/(\d+)\/reviews$/,
    );
    if (titleReviews && request.method === "GET") {
      const viewer = await authUser(request);
      success(
        response,
        await getCommunityReviews(
          titleReviews[1],
          Number(titleReviews[2]),
          viewer?.id,
        ),
      );
      return;
    }
    const reviewLike = url.pathname.match(/^\/api\/v1\/reviews\/(\d+)\/like$/);
    if (reviewLike && request.method === "POST") {
      const user = await requireUser(request);
      success(response, await toggleReviewLike(user.id, Number(reviewLike[1])));
      return;
    }
    const titleMatch = url.pathname.match(
      /^\/api\/v1\/titles\/(movie|tv)\/([a-zA-Z0-9]+)$/,
    );
    if (titleMatch && request.method === "GET") {
      const resolved = await resolveTitleId(titleMatch[1], titleMatch[2]),
        data = await getTitleDetails(resolved.mediaType, resolved.id),
        user = await authUser(request);
      if (user)
        await recordBrowse(user.id, {
          ...mediaPayload(data),
          sourceId: data.id,
          imageUrl: data.poster,
        });
      success(response, data);
      return;
    }
    const personMatch = url.pathname.match(/^\/api\/v1\/people\/(\d+)$/);
    if (personMatch && request.method === "GET") {
      const data = await getPersonDetails(personMatch[1]),
        user = await authUser(request);
      if (user)
        await recordBrowse(user.id, {
          mediaType: "person",
          sourceId: data.id,
          title: data.name,
          imageUrl: data.profile,
        });
      success(response, data);
      return;
    }
    sendJson(response, 404, {
      data: null,
      error: { code: "RESOURCE_NOT_FOUND", message: "接口不存在" },
    });
  } catch (error) {
    console.error("[api]", error instanceof Error ? error.message : error);
    const status = Number(error?.status) || 500;
    sendJson(response, status, {
      data: null,
      error: {
        code: error?.code || "SERVICE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "服务暂不可用",
      },
    });
  }
});
server.on("error", (error) => {
  if (error?.code === "EADDRINUSE")
    console.error(`MovieScope API 端口 ${port} 已被占用。`);
  else
    console.error(
      "MovieScope API 监听失败。",
      error instanceof Error ? error.message : error,
    );
  process.exitCode = 1;
});
try {
  await getDatabase();
  server.listen(port, host, () =>
    console.log(`MovieScope API: http://${host}:${port}`),
  );
} catch (error) {
  console.error("MovieScope API 启动失败。");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await new Promise((resolveClose) => server.close(resolveClose));
  const db = await getDatabase();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
