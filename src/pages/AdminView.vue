<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import GlobalHeader from "../components/global/GlobalHeader.vue";
import GlobalFooter from "../components/global/GlobalFooter.vue";
import { useAuth } from "../composables/useAuth";
import { adminApi } from "../services/user-api";
const router = useRouter(),
  auth = useAuth(),
  loading = ref(true),
  busy = ref(false),
  error = ref(""),
  notice = ref(""),
  tab = ref("overview");
const access = ref<any>({ permissions: [], groups: [] }),
  overview = ref<any>({}),
  analytics = ref<any>({}),
  users = ref<any>({ results: [], page: 1, totalPages: 1 }),
  groups = ref<any>({ groups: [], permissions: [] }),
  reviews = ref<any>({ results: [], page: 1, totalPages: 1 }),
  providers = ref<any[]>([]),
  cache = ref<any>({ results: [], summary: [], page: 1, totalPages: 1 }),
  logs = ref<any>({ audit: [], sync: [], login: [] }),
  settings = ref<any[]>([]),
  selectedUser = ref<any>(null);
const userFilters = reactive({
    query: "",
    role: "",
    status: "",
    risk: "",
    group: "",
    sort: "created",
    page: 1,
  }),
  reviewFilters = reactive({ query: "", status: "", mediaType: "", page: 1 }),
  cacheFilters = reactive({ query: "", provider: "", state: "", page: 1 }),
  logFilters = reactive({ type: "all", query: "", provider: "", status: "" });
const selectedUsers = ref<number[]>([]),
  selectedReviews = ref<number[]>([]),
  groupForm = reactive<any>({
    id: null,
    slug: "",
    name: "",
    description: "",
    color: "#f5c518",
    permissions: [],
  }),
  providerForm = reactive<any>({
    providerKey: "",
    displayName: "",
    baseUrl: "",
    healthPath: "/",
    enabled: true,
    requestTimeoutMs: 25000,
    dailyQuota: "",
    documentationUrl: "",
    notes: "",
  }),
  cacheForm = reactive<any>({
    cacheKey: "",
    provider: "custom",
    ttlMinutes: 60,
    payload: "{}",
  });
const nav = [
  ["overview", "总览", "dashboard", "dashboard.view"],
  ["analytics", "统计分析", "analytics", "analytics.view"],
  ["users", "用户管理", "group", "users.view"],
  ["groups", "分组与权限", "admin_panel_settings", "users.permissions"],
  ["reviews", "内容审核", "rate_review", "reviews.view"],
  ["providers", "API 管理", "api", "providers.view"],
  ["cache", "缓存管理", "database", "cache.view"],
  ["logs", "日志中心", "monitor_heart", "logs.view"],
  ["settings", "站点设置", "settings", "settings.view"],
];
const visibleNav = computed(() =>
    nav.filter((item) => access.value.permissions.includes(item[3])),
  ),
  can = (key: string) => access.value.permissions.includes(key);
const formatNumber = (v: any) =>
    new Intl.NumberFormat("zh-CN").format(Number(v) || 0),
  formatBytes = (v: any) => {
    let s = Number(v) || 0;
    for (const u of ["B", "KB", "MB", "GB"]) {
      if (s < 1024 || u === "GB") return s.toFixed(u === "B" ? 0 : 1) + " " + u;
      s /= 1024;
    }
    return "0 B";
  },
  formatDate = (v: any) => (v ? new Date(v).toLocaleString("zh-CN") : "暂无"),
  percent = (a: any, b: any) =>
    Number(b) ? Math.round((Number(a) / Number(b)) * 100) : 0;
function flash(message: string) {
  notice.value = message;
  setTimeout(() => {
    if (notice.value === message) notice.value = "";
  }, 3500);
}
async function safe(task: () => Promise<void>) {
  busy.value = true;
  error.value = "";
  try {
    await task();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "操作失败";
  } finally {
    busy.value = false;
  }
}
async function loadTab(name = tab.value) {
  if (name === "overview") overview.value = await adminApi.overview();
  else if (name === "analytics") analytics.value = await adminApi.analytics();
  else if (name === "users") users.value = await adminApi.users(userFilters);
  else if (name === "groups") groups.value = await adminApi.groups();
  else if (name === "reviews")
    reviews.value = await adminApi.reviews(reviewFilters);
  else if (name === "providers") providers.value = await adminApi.providers();
  else if (name === "cache") cache.value = await adminApi.cache(cacheFilters);
  else if (name === "logs") logs.value = await adminApi.logs(logFilters);
  else if (name === "settings") settings.value = await adminApi.settings();
}
async function selectTab(name: string) {
  tab.value = name;
  await safe(() => loadTab(name));
}
async function initial() {
  loading.value = true;
  try {
    if (!auth.ready.value) await auth.refresh();
    if (auth.user.value?.role !== "admin") {
      router.replace("/");
      return;
    }
    access.value = await adminApi.access();
    tab.value = visibleNav.value[0]?.[0] || "overview";
    await loadTab();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "后台加载失败";
  } finally {
    loading.value = false;
  }
}
async function searchUsers(page = 1) {
  userFilters.page = page;
  selectedUsers.value = [];
  await safe(async () => {
    users.value = await adminApi.users(userFilters);
  });
}
async function openUser(id: number) {
  await safe(async () => {
    selectedUser.value = await adminApi.user(id);
    if (can("users.permissions") && !groups.value.permissions.length)
      groups.value = await adminApi.groups();
  });
}
async function saveUser() {
  if (!selectedUser.value) return;
  await safe(async () => {
    selectedUser.value = await adminApi.updateUser(selectedUser.value.user.id, {
      displayName: selectedUser.value.user.displayName,
      role: selectedUser.value.user.role,
      status: selectedUser.value.user.status,
      profileVisibility: selectedUser.value.user.profileVisibility,
      note: selectedUser.value.user.note,
      riskLevel: selectedUser.value.user.riskLevel,
    });
    await searchUsers(users.value.page);
    flash("用户资料与管理备注已更新");
  });
}
async function revokeUserSessions() {
  if (!selectedUser.value) return;
  await safe(async () => {
    selectedUser.value = await adminApi.updateUser(selectedUser.value.user.id, {
      revokeSessions: true,
    });
    flash("该用户的有效会话已撤销");
  });
}
async function quickChangeRole(user: any) {
  const promote = user.role !== "admin";
  const message = promote
    ? `确认将“${user.displayName}”提升为超级管理员？该用户将获得完整后台权限。`
    : `确认将“${user.displayName}”降级为普通用户？其管理员分组和权限覆盖将被清除。`;
  if (!confirm(message)) return;
  await safe(async () => {
    await adminApi.updateUser(user.id, {
      role: promote ? "admin" : "user",
      assignSuperAdmin: promote,
    });
    await searchUsers(users.value.page);
    if (selectedUser.value?.user?.id === user.id)
      selectedUser.value = await adminApi.user(user.id);
    flash(promote ? "已提升为超级管理员" : "已降级为普通用户");
  });
}
async function saveUserAccess() {
  const groupIds = selectedUser.value.access.groups.map((g: any) => g.id),
    overrides = Object.fromEntries(
      selectedUser.value.access.overrides.map((o: any) => [
        o.permissionKey,
        o.effect,
      ]),
    );
  await safe(async () => {
    selectedUser.value.access = await adminApi.setUserAccess(
      selectedUser.value.user.id,
      { groupIds, overrides },
    );
    await searchUsers(users.value.page);
    flash("管理员权限已更新");
  });
}
function toggleUserGroup(group: any) {
  const list = selectedUser.value.access.groups,
    index = list.findIndex((g: any) => g.id === group.id);
  index >= 0 ? list.splice(index, 1) : list.push(group);
}
function permissionEffect(key: string) {
  return (
    selectedUser.value?.access?.overrides?.find(
      (o: any) => o.permissionKey === key,
    )?.effect || ""
  );
}
function setPermissionEffect(key: string, effect: string) {
  const list = selectedUser.value.access.overrides,
    index = list.findIndex((o: any) => o.permissionKey === key);
  if (index >= 0) list.splice(index, 1);
  if (effect) list.push({ permissionKey: key, effect });
}
async function bulkUsers(action: string) {
  if (!selectedUsers.value.length) return;
  await safe(async () => {
    await adminApi.bulkUsers({ userIds: selectedUsers.value, action });
    await searchUsers(users.value.page);
    flash("批量用户操作已完成");
  });
}
function editGroup(group?: any) {
  Object.assign(
    groupForm,
    group
      ? { ...group, permissions: [...group.permissions] }
      : {
          id: null,
          slug: "",
          name: "",
          description: "",
          color: "#f5c518",
          permissions: [],
        },
  );
}
async function saveGroup() {
  await safe(async () => {
    groups.value = groupForm.id
      ? await adminApi.updateGroup(groupForm.id, groupForm)
      : await adminApi.createGroup(groupForm);
    editGroup();
    flash("权限分组已保存");
  });
}
async function deleteGroup(group: any) {
  if (confirm("确认删除分组“" + group.name + "”？"))
    await safe(async () => {
      await adminApi.deleteGroup(group.id);
      groups.value = await adminApi.groups();
      flash("分组已删除");
    });
}
async function searchReviews(page = 1) {
  reviewFilters.page = page;
  selectedReviews.value = [];
  await safe(async () => {
    reviews.value = await adminApi.reviews(reviewFilters);
  });
}
async function moderate(ids: number | number[], status: string) {
  await safe(async () => {
    await adminApi.moderate(ids, status);
    await searchReviews(reviews.value.page);
    flash(status === "hidden" ? "短评已隐藏" : "短评已恢复");
  });
}
function editProvider(item?: any) {
  Object.assign(
    providerForm,
    item
      ? { ...item }
      : {
          providerKey: "",
          displayName: "",
          baseUrl: "",
          healthPath: "/",
          enabled: true,
          requestTimeoutMs: 25000,
          dailyQuota: "",
          documentationUrl: "",
          notes: "",
        },
  );
}
async function saveProvider() {
  await safe(async () => {
    providers.value = providers.value.some(
      (p) => p.providerKey === providerForm.providerKey,
    )
      ? await adminApi.updateProvider(providerForm.providerKey, providerForm)
      : await adminApi.createProvider(providerForm);
    editProvider();
    flash("Provider 已保存");
  });
}
async function testProvider(item: any) {
  await safe(async () => {
    const result = await adminApi.testProvider(item.providerKey);
    providers.value = await adminApi.providers();
    flash(
      result.status === "success"
        ? "接口测试成功"
        : "接口测试失败：" + (result.error || "未知错误"),
    );
  });
}
async function deleteProvider(item: any) {
  if (confirm("确认删除 Provider？"))
    await safe(async () => {
      await adminApi.deleteProvider(item.providerKey);
      providers.value = await adminApi.providers();
    });
}
async function searchCache(page = 1) {
  cacheFilters.page = page;
  await safe(async () => {
    cache.value = await adminApi.cache(cacheFilters);
  });
}
async function saveCache() {
  await safe(async () => {
    await adminApi.putCache(cacheForm);
    cache.value = await adminApi.cache(cacheFilters);
    flash("缓存已写入 MySQL");
  });
}
async function clearCache(input: any) {
  if (confirm("确认清理缓存？后续请求将重新访问上游。"))
    await safe(async () => {
      const result = await adminApi.deleteCache(input);
      cache.value = await adminApi.cache(cacheFilters);
      flash("已删除 " + result.deleted + " 条缓存");
    });
}
async function searchLogs() {
  await safe(async () => {
    logs.value = await adminApi.logs(logFilters);
  });
}
async function updateSetting(item: any) {
  await safe(async () => {
    settings.value = await adminApi.updateSetting(item.settingKey, item.value);
    flash("站点设置已更新");
  });
}
const maxActivity = computed(() =>
  Math.max(
    1,
    ...(overview.value.activity || []).map(
      (i: any) =>
        Number(i.registrations) + Number(i.interactions) + Number(i.searches),
    ),
  ),
);
const behaviorItems = computed(() => [
  {
    label: "想看",
    icon: "bookmark_add",
    value: overview.value.entries?.wantCount,
  },
  {
    label: "在看",
    icon: "visibility",
    value: overview.value.entries?.watchingCount,
  },
  {
    label: "看过",
    icon: "done_all",
    value: overview.value.entries?.watchedCount,
  },
  { label: "收藏", icon: "favorite", value: overview.value.entries?.favorites },
  { label: "评分", icon: "star", value: overview.value.entries?.ratings },
  { label: "短评", icon: "rate_review", value: overview.value.reviews?.total },
]);
const registrationTrend = computed(() => {
  const source = new Map<string, number>(
    (analytics.value.registrations || []).map((item: any) => [
      String(item.date).slice(0, 10),
      Number(item.count) || 0,
    ]),
  );
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (29 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { date: key, count: source.get(key) || 0 };
  });
});
const maxRegistrations = computed(() =>
  Math.max(1, ...registrationTrend.value.map((item) => item.count)),
);
const totalRegistrations = computed(() =>
  registrationTrend.value.reduce((sum, item) => sum + item.count, 0),
);
const breakdownTotal = (items: any[]) =>
  (items || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
const avatarFallback =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="100%" height="100%" fill="#2a2d33"/><circle cx="48" cy="38" r="18" fill="#777b84"/><path d="M17 91c3-22 15-34 31-34s28 12 31 34" fill="#777b84"/><circle cx="76" cy="20" r="8" fill="#f5c518"/></svg>`,
  );
function handleAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.dataset.fallback === "true") return;
  image.dataset.fallback = "true";
  image.src = avatarFallback;
}
onMounted(initial);
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <main class="mx-auto max-w-[1540px] px-4 pb-20 pt-[76px] md:px-7">
      <header class="admin-header">
        <div>
          <p class="admin-kicker">MOVIESCOPE CONTROL CENTER</p>
          <h1>管理控制台</h1>
          <p>用户、权限、内容、接口、缓存与站点运行数据的统一管理中心。</p>
        </div>
        <div class="header-status">
          <span :class="busy ? 'working' : ''"></span
          >{{ busy ? "正在执行操作" : "控制台在线"
          }}<b v-if="notice">{{ notice }}</b>
        </div>
      </header>
      <div v-if="loading" class="admin-empty">后台权限与运行数据加载中…</div>
      <div v-else-if="error && !visibleNav.length" class="admin-error">
        {{ error }}
      </div>
      <div v-else class="admin-shell">
        <aside class="admin-sidebar">
          <div class="access-card">
            <span class="material-symbols-outlined">verified_user</span>
            <div>
              <b>{{ auth.user.value?.displayName }}</b
              ><small>{{
                access.groups.map((g: any) => g.name).join(" · ") ||
                "未分配权限组"
              }}</small>
            </div>
          </div>
          <nav>
            <button
              v-for="item in visibleNav"
              :key="item[0]"
              class="admin-nav"
              :class="tab === item[0] ? 'active' : ''"
              @click="selectTab(item[0])"
            >
              <span class="material-symbols-outlined">{{ item[2] }}</span
              >{{ item[1] }}
            </button>
          </nav>
          <div class="permission-count">
            <b>{{ access.permissions.length }}</b
            ><span>项有效权限</span>
          </div>
        </aside>
        <section class="admin-content">
          <div v-if="error" class="admin-error">
            <span>{{ error }}</span
            ><button @click="error = ''">关闭</button>
          </div>
          <template v-if="tab === 'overview'"
            ><div class="section-heading">
              <div>
                <h2>运行总览</h2>
                <p>核心业务、会话、内容和数据源的实时状态。</p>
              </div>
              <button class="ghost-button" @click="loadTab()">刷新</button>
            </div>
            <div class="metric-grid">
              <article class="metric-card">
                <span>注册用户</span
                ><strong>{{ formatNumber(overview.users?.total) }}</strong>
                <p>
                  近 7 天 +{{ formatNumber(overview.users?.new7d) }} · 30 天活跃
                  {{ formatNumber(overview.users?.active30d) }}
                </p>
              </article>
              <article class="metric-card">
                <span>用户影视记录</span
                ><strong>{{ formatNumber(overview.entries?.total) }}</strong>
                <p>
                  {{ formatNumber(overview.entries?.ratings) }} 条评分 · 均分
                  {{ overview.entries?.averageRating || 0 }}
                </p>
              </article>
              <article class="metric-card">
                <span>站内短评</span
                ><strong>{{ formatNumber(overview.reviews?.total) }}</strong>
                <p>
                  {{ formatNumber(overview.reviews?.hidden) }} 条隐藏 · 今日 +{{
                    formatNumber(overview.reviews?.new24h)
                  }}
                </p>
              </article>
              <article class="metric-card">
                <span>有效会话</span
                ><strong>{{ formatNumber(overview.sessions?.active) }}</strong>
                <p>
                  {{ formatNumber(overview.sessions?.activeUsers) }} 位在线用户
                </p>
              </article>
              <article class="metric-card">
                <span>SQL 缓存</span
                ><strong>{{ formatNumber(overview.cache?.active) }}</strong>
                <p>
                  {{ formatBytes(overview.cache?.bytes) }} ·
                  {{ formatNumber(overview.cache?.expired) }} 条过期
                </p>
              </article>
              <article class="metric-card">
                <span>24 小时接口</span
                ><strong>{{ formatNumber(overview.provider?.calls) }}</strong>
                <p>
                  成功率
                  {{
                    percent(
                      overview.provider?.successes,
                      overview.provider?.calls,
                    )
                  }}% · {{ overview.provider?.averageLatency || 0 }} ms
                </p>
              </article>
            </div>
            <div class="dashboard-grid">
              <article class="admin-panel span-2">
                <h3>14 天站点活动</h3>
                <div class="activity-chart">
                  <div
                    v-for="item in overview.activity || []"
                    :key="item.date"
                    class="activity-day"
                  >
                    <div class="bars">
                      <i
                        class="registration"
                        :style="{
                          height:
                            (Number(item.registrations) / maxActivity) * 100 +
                            '%',
                        }"
                      ></i
                      ><i
                        class="interaction"
                        :style="{
                          height:
                            (Number(item.interactions) / maxActivity) * 100 +
                            '%',
                        }"
                      ></i
                      ><i
                        class="search"
                        :style="{
                          height:
                            (Number(item.searches) / maxActivity) * 100 + '%',
                        }"
                      ></i>
                    </div>
                    <small>{{ new Date(item.date).getDate() }}日</small>
                  </div>
                </div>
                <div class="chart-legend">
                  <span><i class="registration"></i>注册</span
                  ><span><i class="interaction"></i>互动</span
                  ><span><i class="search"></i>搜索</span>
                </div>
              </article>
              <article class="admin-panel">
                <h3>用户行为构成</h3>
                <div class="behavior-grid">
                  <div v-for="item in behaviorItems" :key="item.label">
                    <span class="material-symbols-outlined">{{
                      item.icon
                    }}</span>
                    <p>
                      <b>{{ formatNumber(item.value) }}</b
                      ><small>{{ item.label }}</small>
                    </p>
                  </div>
                </div>
                <p class="panel-note">
                  同一条影视记录可同时包含观影状态、收藏、评分和短评，因此各项会有重叠。
                </p>
              </article>
              <article class="admin-panel">
                <h3>热门站内作品</h3>
                <button
                  v-for="item in overview.topTitles || []"
                  :key="item.mediaType + item.tmdbId"
                  class="rank-row"
                  @click="
                    router.push({
                      name: 'title',
                      params: { type: item.mediaType, id: item.tmdbId },
                    })
                  "
                >
                  <span>{{ item.title }}</span
                  ><b>{{ item.interactions }}</b>
                </button>
                <p v-if="!overview.topTitles?.length" class="muted">
                  暂无用户互动数据
                </p>
              </article>
              <article class="admin-panel">
                <h3>热门搜索</h3>
                <div class="tag-cloud">
                  <span
                    v-for="item in overview.topSearches || []"
                    :key="item.queryText"
                    >{{ item.queryText }} <b>{{ item.count }}</b></span
                  >
                </div>
              </article>
            </div></template
          >
          <template v-else-if="tab === 'analytics'"
            ><div class="section-heading">
              <div>
                <h2>统计分析</h2>
                <p>用户增长、内容行为、搜索偏好与数据源质量。</p>
              </div>
            </div>
            <div class="dashboard-grid">
              <article class="admin-panel span-2">
                <div class="panel-title-row">
                  <div>
                    <h3>近 30 天用户增长</h3>
                    <p>共新增 {{ formatNumber(totalRegistrations) }} 位用户</p>
                  </div>
                  <b>日均 {{ (totalRegistrations / 30).toFixed(1) }}</b>
                </div>
                <div class="line-bars">
                  <div
                    v-for="(item, index) in registrationTrend"
                    :key="item.date"
                    :title="item.date + ' · ' + item.count + ' 位新用户'"
                  >
                    <i
                      :style="{
                        height:
                          Math.max(
                            5,
                            (Number(item.count) / maxRegistrations) * 118,
                          ) + 'px',
                      }"
                    ></i
                    ><small>{{
                      index % 5 === 0 || index === 29
                        ? new Date(item.date).getDate()
                        : ""
                    }}</small>
                  </div>
                </div>
              </article>
              <article class="admin-panel">
                <h3>用户结构</h3>
                <div class="breakdown-list progress-list">
                  <div
                    v-for="item in analytics.userBreakdown || []"
                    :key="item.role + item.status"
                  >
                    <span
                      >{{ item.role === "admin" ? "管理员" : "普通用户" }} ·
                      {{ item.status === "active" ? "正常" : "停用" }}</span
                    >
                    <div>
                      <i
                        :style="{
                          width:
                            percent(
                              item.count,
                              breakdownTotal(analytics.userBreakdown),
                            ) + '%',
                        }"
                      ></i>
                    </div>
                    <b>{{ item.count }}</b>
                  </div>
                </div>
              </article>
              <article class="admin-panel">
                <h3>搜索类型</h3>
                <div class="breakdown-list progress-list">
                  <div
                    v-for="item in analytics.searchTypes || []"
                    :key="item.searchType"
                  >
                    <span>{{ item.searchType }}</span>
                    <div>
                      <i
                        :style="{
                          width:
                            percent(
                              item.count,
                              breakdownTotal(analytics.searchTypes),
                            ) + '%',
                        }"
                      ></i>
                    </div>
                    <b>{{ item.count }}</b>
                  </div>
                </div>
              </article>
              <article class="admin-panel span-2">
                <h3>Provider 七日质量</h3>
                <div class="table-wrap">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>数据源</th>
                        <th>调用</th>
                        <th>成功</th>
                        <th>错误</th>
                        <th>成功率</th>
                        <th>平均/最大延迟</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in analytics.providers || []"
                        :key="item.provider"
                      >
                        <td>
                          <b>{{ item.provider }}</b>
                        </td>
                        <td>{{ item.calls }}</td>
                        <td class="success-text">{{ item.successes }}</td>
                        <td class="danger-text">{{ item.errors }}</td>
                        <td>{{ percent(item.successes, item.calls) }}%</td>
                        <td>
                          {{ item.averageLatency || 0 }} /
                          {{ item.maxLatency || 0 }} ms
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
              <article class="admin-panel">
                <h3>影视状态分布</h3>
                <div class="breakdown-list progress-list">
                  <div
                    v-for="item in analytics.mediaBreakdown || []"
                    :key="item.mediaType + item.watchStatus"
                  >
                    <span
                      >{{ item.mediaType === "movie" ? "电影" : "剧集" }} ·
                      {{ item.watchStatus || "仅互动" }}</span
                    >
                    <div>
                      <i
                        :style="{
                          width:
                            percent(
                              item.count,
                              breakdownTotal(analytics.mediaBreakdown),
                            ) + '%',
                        }"
                      ></i>
                    </div>
                    <b>{{ item.count }}</b>
                  </div>
                </div>
              </article>
            </div></template
          >
          <template v-else-if="tab === 'users'"
            ><div class="section-heading">
              <div>
                <h2>用户管理</h2>
                <p>检索、筛选、批量处置并查看用户会话和互动数据。</p>
              </div>
              <b>{{ formatNumber(users.totalResults) }} 位用户</b>
            </div>
            <div class="filter-bar">
              <input
                v-model="userFilters.query"
                class="admin-input wide"
                placeholder="用户名、邮箱或显示名称"
                @keydown.enter="searchUsers()"
              /><select v-model="userFilters.role" class="admin-input">
                <option value="">全部角色</option>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option></select
              ><select v-model="userFilters.status" class="admin-input">
                <option value="">全部状态</option>
                <option value="active">正常</option>
                <option value="suspended">停用</option></select
              ><select v-model="userFilters.risk" class="admin-input">
                <option value="">全部风险</option>
                <option value="normal">普通</option>
                <option value="watch">关注</option>
                <option value="high">高风险</option></select
              ><select v-model="userFilters.sort" class="admin-input">
                <option value="created">注册时间</option>
                <option value="login">最近登录</option>
                <option value="activity">互动数量</option></select
              ><button class="primary-button" @click="searchUsers()">
                查询
              </button>
            </div>
            <div
              v-if="selectedUsers.length && can('users.manage')"
              class="bulk-bar"
            >
              <b>已选 {{ selectedUsers.length }} 人</b
              ><button @click="bulkUsers('activate')">恢复</button
              ><button @click="bulkUsers('suspend')">停用</button
              ><button @click="bulkUsers('revoke_sessions')">撤销会话</button
              ><button @click="bulkUsers('set_user')">设为用户</button>
            </div>
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        @change="
                          selectedUsers = ($event.target as HTMLInputElement)
                            .checked
                            ? users.results.map((u: any) => u.id)
                            : []
                        "
                      />
                    </th>
                    <th>用户</th>
                    <th>角色与分组</th>
                    <th>风险</th>
                    <th>行为记录</th>
                    <th>会话</th>
                    <th>最近登录</th>
                    <th>快捷操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users.results" :key="user.id">
                    <td>
                      <input
                        v-model="selectedUsers"
                        type="checkbox"
                        :value="user.id"
                      />
                    </td>
                    <td>
                      <div class="user-cell">
                        <img
                          :src="user.avatarUrl || avatarFallback"
                          @error="handleAvatarError"
                        />
                        <div>
                          <b>{{ user.displayName }}</b
                          ><small
                            >@{{ user.username }} · {{ user.email }}</small
                          >
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="status-pill" :class="user.role">{{
                        user.role === "admin" ? "管理员" : "用户"
                      }}</span
                      ><span
                        v-for="group in user.groups"
                        :key="group.id"
                        class="mini-group"
                        :style="{
                          borderColor: group.color,
                          color: group.color,
                        }"
                        >{{ group.name }}</span
                      >
                    </td>
                    <td>
                      <span class="risk-pill" :class="user.riskLevel">{{
                        user.riskLevel === "high"
                          ? "高风险"
                          : user.riskLevel === "watch"
                            ? "关注"
                            : "普通"
                      }}</span>
                    </td>
                    <td>
                      {{ user.entryCount }} 条<br /><small
                        >{{ user.ratingCount }} 评分 ·
                        {{ user.reviewCount }} 短评</small
                      >
                    </td>
                    <td>{{ user.activeSessions }}</td>
                    <td>{{ formatDate(user.lastLoginAt) }}</td>
                    <td>
                      <div class="quick-actions">
                        <button class="text-button" @click="openUser(user.id)">
                          详情</button
                        ><button
                          v-if="
                            can('users.manage') &&
                            user.id !== auth.user.value?.id
                          "
                          :class="
                            user.role === 'admin'
                              ? 'danger-text'
                              : 'success-text'
                          "
                          @click="quickChangeRole(user)"
                        >
                          {{
                            user.role === "admin" ? "降级为用户" : "提升管理员"
                          }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pager">
              <button
                :disabled="users.page <= 1"
                @click="searchUsers(users.page - 1)"
              >
                上一页</button
              ><span>{{ users.page }} / {{ users.totalPages || 1 }}</span
              ><button
                :disabled="users.page >= users.totalPages"
                @click="searchUsers(users.page + 1)"
              >
                下一页
              </button>
            </div></template
          >
          <template v-else-if="tab === 'groups'"
            ><div class="section-heading">
              <div>
                <h2>分组与权限</h2>
                <p>分组继承与用户级允许/拒绝覆盖的后台 RBAC。</p>
              </div>
            </div>
            <div class="group-layout">
              <div class="group-list">
                <article
                  v-for="group in groups.groups"
                  :key="group.id"
                  class="group-card"
                >
                  <i :style="{ background: group.color }"></i>
                  <div>
                    <h3>
                      {{ group.name }} <span v-if="group.isSystem">系统</span>
                    </h3>
                    <p>{{ group.description || "暂无说明" }}</p>
                    <small
                      >{{ group.userCount }} 位成员 ·
                      {{ group.permissions.length }} 项权限</small
                    >
                    <div>
                      <button @click="editGroup(group)">编辑</button
                      ><button
                        v-if="!group.isSystem"
                        class="danger-text"
                        @click="deleteGroup(group)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </article>
              </div>
              <form class="admin-panel sticky-form" @submit.prevent="saveGroup">
                <h3>{{ groupForm.id ? "编辑权限组" : "新建权限组" }}</h3>
                <label
                  >分组名称<input
                    v-model="groupForm.name"
                    class="admin-input"
                    required /></label
                ><label v-if="!groupForm.id"
                  >唯一标识<input
                    v-model="groupForm.slug"
                    class="admin-input"
                    required /></label
                ><label
                  >说明<textarea
                    v-model="groupForm.description"
                    class="admin-input"
                    rows="3"
                  ></textarea></label
                ><label
                  >颜色<input
                    v-model="groupForm.color"
                    type="color"
                    class="color-input"
                /></label>
                <div class="permission-groups">
                  <section
                    v-for="category in Array.from(
                      new Set<string>(
                        groups.permissions.map((p: any) => String(p.category)),
                      ),
                    )"
                    :key="category"
                  >
                    <h4>{{ category }}</h4>
                    <label
                      v-for="permission in groups.permissions.filter(
                        (p: any) => p.category === category,
                      )"
                      :key="permission.permissionKey"
                      class="permission-option"
                      ><input
                        v-model="groupForm.permissions"
                        type="checkbox"
                        :value="permission.permissionKey"
                      /><span
                        ><b>{{ permission.name }}</b
                        ><small>{{ permission.description }}</small></span
                      ></label
                    >
                  </section>
                </div>
                <div class="form-actions">
                  <button
                    type="button"
                    class="ghost-button"
                    @click="editGroup()"
                  >
                    重置</button
                  ><button class="primary-button">保存分组</button>
                </div>
              </form>
            </div></template
          >
          <template v-else-if="tab === 'reviews'"
            ><div class="section-heading">
              <div>
                <h2>内容审核</h2>
                <p>检索短评并进行单条或批量审核。</p>
              </div>
              <b>{{ formatNumber(reviews.totalResults) }} 条</b>
            </div>
            <div class="filter-bar">
              <input
                v-model="reviewFilters.query"
                class="admin-input wide"
                placeholder="短评、作品或用户名"
              /><select v-model="reviewFilters.status" class="admin-input">
                <option value="">全部状态</option>
                <option value="published">公开</option>
                <option value="hidden">隐藏</option></select
              ><select v-model="reviewFilters.mediaType" class="admin-input">
                <option value="">电影与剧集</option>
                <option value="movie">电影</option>
                <option value="tv">剧集</option></select
              ><button class="primary-button" @click="searchReviews()">
                筛选
              </button>
            </div>
            <div
              v-if="selectedReviews.length && can('reviews.moderate')"
              class="bulk-bar"
            >
              <b>已选 {{ selectedReviews.length }} 条</b
              ><button @click="moderate(selectedReviews, 'published')">
                恢复</button
              ><button @click="moderate(selectedReviews, 'hidden')">
                隐藏
              </button>
            </div>
            <div class="review-grid">
              <article
                v-for="entry in reviews.results"
                :key="entry.id"
                class="review-card"
              >
                <input
                  v-model="selectedReviews"
                  type="checkbox"
                  :value="entry.id"
                /><img :src="entry.posterUrl || ''" />
                <div>
                  <div class="review-meta">
                    <b>{{ entry.title }}</b
                    ><span :class="entry.reviewStatus">{{
                      entry.reviewStatus === "published" ? "公开" : "隐藏"
                    }}</span>
                  </div>
                  <p>{{ entry.reviewText }}</p>
                  <small
                    >@{{ entry.user.username }} ·
                    {{ entry.rating ? entry.rating + " / 10 · " : ""
                    }}{{ formatDate(entry.updatedAt) }}</small
                  >
                  <div>
                    <button @click="moderate(entry.id, 'published')">
                      恢复</button
                    ><button
                      class="danger-text"
                      @click="moderate(entry.id, 'hidden')"
                    >
                      隐藏
                    </button>
                  </div>
                </div>
              </article>
            </div>
            <div class="pager">
              <button
                :disabled="reviews.page <= 1"
                @click="searchReviews(reviews.page - 1)"
              >
                上一页</button
              ><span>{{ reviews.page }} / {{ reviews.totalPages || 1 }}</span
              ><button
                :disabled="reviews.page >= reviews.totalPages"
                @click="searchReviews(reviews.page + 1)"
              >
                下一页
              </button>
            </div></template
          >

          <template v-else-if="tab === 'providers'"
            ><div class="section-heading">
              <div>
                <h2>API Provider 管理</h2>
                <p>
                  查看配置、凭据状态和调用质量，执行服务器连通性测试并添加
                  Provider。
                </p>
              </div>
            </div>
            <div class="provider-grid">
              <article
                v-for="item in providers"
                :key="item.providerKey"
                class="provider-card"
              >
                <div class="provider-head">
                  <div>
                    <span
                      :class="[
                        'provider-dot',
                        item.enabled ? 'online' : 'offline',
                      ]"
                    ></span>
                    <h3>{{ item.displayName }}</h3>
                    <small>{{ item.providerKey }}</small>
                  </div>
                  <span
                    :class="[
                      'credential',
                      item.credentialConfigured ? 'ok' : 'missing',
                    ]"
                    >{{
                      item.credentialConfigured ? "凭据已配置" : "缺少凭据"
                    }}</span
                  >
                </div>
                <p class="provider-url">
                  {{ item.baseUrl }}{{ item.healthPath }}
                </p>
                <div class="provider-stats">
                  <div>
                    <b>{{ item.stats.calls || 0 }}</b
                    ><span>七日调用</span>
                  </div>
                  <div>
                    <b>{{ percent(item.stats.successes, item.stats.calls) }}%</b
                    ><span>成功率</span>
                  </div>
                  <div>
                    <b>{{ item.stats.averageLatency || 0 }}</b
                    ><span>平均 ms</span>
                  </div>
                  <div>
                    <b>{{ item.lastLatencyMs || "—" }}</b
                    ><span>测试 ms</span>
                  </div>
                </div>
                <p v-if="item.lastError" class="danger-text">
                  {{ item.lastError }}
                </p>
                <div class="provider-actions">
                  <button
                    v-if="can('providers.test')"
                    @click="testProvider(item)"
                  >
                    测试</button
                  ><button
                    v-if="can('providers.manage')"
                    @click="editProvider(item)"
                  >
                    编辑</button
                  ><button
                    v-if="can('providers.manage') && !item.isSystem"
                    class="danger-text"
                    @click="deleteProvider(item)"
                  >
                    删除
                  </button>
                </div>
              </article>
            </div>
            <form
              v-if="can('providers.manage')"
              class="admin-panel provider-form"
              @submit.prevent="saveProvider"
            >
              <div class="section-heading">
                <div>
                  <h3>
                    {{
                      providers.some(
                        (p) => p.providerKey === providerForm.providerKey,
                      )
                        ? "编辑 Provider"
                        : "添加 Provider"
                    }}
                  </h3>
                  <p>API 密钥仍由安全环境变量维护，后台不会保存或回显。</p>
                </div>
                <button
                  type="button"
                  class="ghost-button"
                  @click="editProvider()"
                >
                  新建
                </button>
              </div>
              <div class="form-grid">
                <label
                  >唯一标识<input
                    v-model="providerForm.providerKey"
                    class="admin-input"
                    required /></label
                ><label
                  >显示名称<input
                    v-model="providerForm.displayName"
                    class="admin-input"
                    required /></label
                ><label class="span-2"
                  >基础地址<input
                    v-model="providerForm.baseUrl"
                    class="admin-input"
                    required /></label
                ><label
                  >健康路径<input
                    v-model="providerForm.healthPath"
                    class="admin-input" /></label
                ><label
                  >超时毫秒<input
                    v-model.number="providerForm.requestTimeoutMs"
                    type="number"
                    class="admin-input" /></label
                ><label
                  >每日额度<input
                    v-model="providerForm.dailyQuota"
                    type="number"
                    class="admin-input" /></label
                ><label
                  >文档地址<input
                    v-model="providerForm.documentationUrl"
                    class="admin-input" /></label
                ><label class="span-2"
                  >说明<textarea
                    v-model="providerForm.notes"
                    class="admin-input"
                    rows="3"
                  ></textarea></label
                ><label
                  ><input v-model="providerForm.enabled" type="checkbox" /> 启用
                  Provider</label
                >
              </div>
              <button class="primary-button">保存 Provider</button>
            </form></template
          >
          <template v-else-if="tab === 'cache'"
            ><div class="section-heading">
              <div>
                <h2>SQL 缓存管理</h2>
                <p>
                  核查 MySQL 缓存占用、有效期，支持精确和批量清理及手动写入。
                </p>
              </div>
              <button
                v-if="can('cache.manage')"
                class="danger-button"
                @click="clearCache({ expired: true })"
              >
                清理过期缓存
              </button>
            </div>
            <div class="cache-summary">
              <article v-for="item in cache.summary" :key="item.provider">
                <b>{{ item.provider }}</b
                ><strong>{{ formatNumber(item.total) }}</strong>
                <p>
                  {{ formatNumber(item.active) }} 有效 ·
                  {{ formatNumber(item.expired) }} 过期
                </p>
                <small>{{ formatBytes(item.bytes) }}</small
                ><button
                  v-if="can('cache.manage')"
                  @click="clearCache({ provider: item.provider })"
                >
                  清空该来源
                </button>
              </article>
            </div>
            <div class="filter-bar">
              <input
                v-model="cacheFilters.query"
                class="admin-input wide"
                placeholder="缓存键或 Provider"
              /><select v-model="cacheFilters.provider" class="admin-input">
                <option value="">全部 Provider</option>
                <option
                  v-for="item in cache.summary"
                  :key="item.provider"
                  :value="item.provider"
                >
                  {{ item.provider }}
                </option></select
              ><select v-model="cacheFilters.state" class="admin-input">
                <option value="">全部状态</option>
                <option value="active">有效</option>
                <option value="expired">过期</option></select
              ><button class="primary-button" @click="searchCache()">
                查询
              </button>
            </div>
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>缓存键</th>
                    <th>大小</th>
                    <th>抓取</th>
                    <th>过期</th>
                    <th>状态</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in cache.results" :key="item.cacheKey">
                    <td>
                      <b>{{ item.provider }}</b>
                    </td>
                    <td class="cache-key">{{ item.cacheKey }}</td>
                    <td>{{ formatBytes(item.sizeBytes) }}</td>
                    <td>{{ formatDate(item.fetchedAt) }}</td>
                    <td>{{ formatDate(item.expiresAt) }}</td>
                    <td>
                      <span
                        :class="[
                          'status-pill',
                          new Date(item.expiresAt) > new Date()
                            ? 'active'
                            : 'suspended',
                        ]"
                        >{{
                          new Date(item.expiresAt) > new Date()
                            ? "有效"
                            : "过期"
                        }}</span
                      >
                    </td>
                    <td>
                      <button
                        v-if="can('cache.manage')"
                        class="danger-text"
                        @click="clearCache({ cacheKey: item.cacheKey })"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pager">
              <button
                :disabled="cache.page <= 1"
                @click="searchCache(cache.page - 1)"
              >
                上一页</button
              ><span>{{ cache.page }} / {{ cache.totalPages || 1 }}</span
              ><button
                :disabled="cache.page >= cache.totalPages"
                @click="searchCache(cache.page + 1)"
              >
                下一页
              </button>
            </div>
            <form
              v-if="can('cache.manage')"
              class="admin-panel cache-form"
              @submit.prevent="saveCache"
            >
              <h3>添加或覆盖缓存</h3>
              <div class="form-grid">
                <label class="span-2"
                  >缓存键<input
                    v-model="cacheForm.cacheKey"
                    class="admin-input"
                    required /></label
                ><label
                  >Provider<input
                    v-model="cacheForm.provider"
                    class="admin-input"
                    required /></label
                ><label
                  >有效分钟<input
                    v-model.number="cacheForm.ttlMinutes"
                    type="number"
                    class="admin-input" /></label
                ><label class="span-2"
                  >JSON 内容<textarea
                    v-model="cacheForm.payload"
                    class="admin-input code-input"
                    rows="7"
                  ></textarea>
                </label>
              </div>
              <button class="primary-button">写入 MySQL 缓存</button>
            </form></template
          >
          <template v-else-if="tab === 'logs'"
            ><div class="section-heading">
              <div>
                <h2>日志中心</h2>
                <p>管理员审计、Provider 同步和登录安全记录。</p>
              </div>
            </div>
            <div class="filter-bar">
              <select v-model="logFilters.type" class="admin-input">
                <option value="all">全部日志</option>
                <option value="audit">管理员审计</option>
                <option value="sync">数据源同步</option>
                <option value="login">登录安全</option></select
              ><input
                v-model="logFilters.query"
                class="admin-input wide"
                placeholder="动作、目标或错误"
              /><input
                v-model="logFilters.provider"
                class="admin-input"
                placeholder="Provider"
              /><select v-model="logFilters.status" class="admin-input">
                <option value="">全部状态</option>
                <option value="success">成功</option>
                <option value="error">错误</option></select
              ><button class="primary-button" @click="searchLogs">查询</button>
            </div>
            <div class="log-columns">
              <section
                v-if="logFilters.type === 'all' || logFilters.type === 'audit'"
                class="admin-panel"
              >
                <h3>管理员审计</h3>
                <div v-for="item in logs.audit" :key="item.id" class="log-item">
                  <i class="audit">盾</i>
                  <div>
                    <b>{{ item.adminUsername }} · {{ item.action }}</b>
                    <p>
                      {{ item.targetType }} {{ item.targetId || "" }} ·
                      {{ item.ipAddress || "IP 未记录" }}
                    </p>
                    <small>{{ formatDate(item.createdAt) }}</small>
                  </div>
                </div>
              </section>
              <section
                v-if="logFilters.type === 'all' || logFilters.type === 'sync'"
                class="admin-panel"
              >
                <h3>Provider 同步</h3>
                <div v-for="item in logs.sync" :key="item.id" class="log-item">
                  <i :class="item.status">{{
                    item.status === "success" ? "✓" : "!"
                  }}</i>
                  <div>
                    <b>{{ item.provider }} · {{ item.operation }}</b>
                    <p>
                      {{ item.durationMs }} ms<span v-if="item.errorMessage">
                        · {{ item.errorMessage }}</span
                      >
                    </p>
                    <small>{{ formatDate(item.createdAt) }}</small>
                  </div>
                </div>
              </section>
              <section
                v-if="logFilters.type === 'all' || logFilters.type === 'login'"
                class="admin-panel"
              >
                <h3>登录安全</h3>
                <div v-for="item in logs.login" :key="item.id" class="log-item">
                  <i :class="item.success ? 'success' : 'error'">{{
                    item.success ? "✓" : "!"
                  }}</i>
                  <div>
                    <b
                      >{{ item.success ? "登录成功" : "登录失败" }} ·
                      {{ item.ipAddress }}</b
                    >
                    <p>账号指纹 {{ item.identifierHash }}</p>
                    <small>{{ formatDate(item.attemptedAt) }}</small>
                  </div>
                </div>
              </section>
            </div></template
          >
          <template v-else-if="tab === 'settings'"
            ><div class="section-heading">
              <div>
                <h2>站点设置</h2>
                <p>管理注册、维护状态、公告和短评默认策略。</p>
              </div>
            </div>
            <div class="settings-grid">
              <article
                v-for="item in settings"
                :key="item.settingKey"
                class="setting-card"
              >
                <div>
                  <h3>
                    {{
                      item.settingKey === "registration_enabled"
                        ? "开放注册"
                        : item.settingKey === "maintenance_mode"
                          ? "维护模式"
                          : item.settingKey === "site_announcement"
                            ? "站点公告"
                            : "短评自动公开"
                    }}
                  </h3>
                  <p>{{ item.description }}</p>
                  <small
                    >{{ item.settingKey }} ·
                    {{ formatDate(item.updatedAt) }}</small
                  >
                </div>
                <template v-if="typeof item.value === 'boolean'"
                  ><input
                    v-model="item.value"
                    type="checkbox"
                    :disabled="!can('settings.manage')"
                  /><button
                    v-if="can('settings.manage')"
                    class="primary-button"
                    @click="updateSetting(item)"
                  >
                    保存
                  </button></template
                ><template v-else
                  ><label
                    ><input v-model="item.value.enabled" type="checkbox" />
                    启用公告</label
                  ><textarea
                    v-model="item.value.text"
                    class="admin-input"
                    rows="4"
                  ></textarea
                  ><button
                    v-if="can('settings.manage')"
                    class="primary-button"
                    @click="updateSetting(item)"
                  >
                    保存公告
                  </button></template
                >
              </article>
            </div></template
          >
        </section>
      </div>
    </main>
    <GlobalFooter />
    <div
      v-if="selectedUser"
      class="modal-backdrop"
      @click.self="selectedUser = null"
    >
      <section class="user-drawer">
        <header>
          <div class="user-cell">
            <img
              :src="selectedUser.user.avatarUrl || avatarFallback"
              @error="handleAvatarError"
            />
            <div>
              <h2>{{ selectedUser.user.displayName }}</h2>
              <small
                >@{{ selectedUser.user.username }} ·
                {{ selectedUser.user.email }}</small
              >
            </div>
          </div>
          <button @click="selectedUser = null">关闭</button>
        </header>
        <div class="drawer-content">
          <div class="user-stat-grid">
            <div
              v-for="item in [
                ['记录', selectedUser.stats.entries],
                ['想看', selectedUser.stats.wantCount],
                ['在看', selectedUser.stats.watchingCount],
                ['看过', selectedUser.stats.watchedCount],
                ['收藏', selectedUser.stats.favorites],
                ['评分', selectedUser.stats.ratings],
                ['短评', selectedUser.stats.reviews],
              ]"
              :key="item[0]"
            >
              <b>{{ item[1] || 0 }}</b
              ><span>{{ item[0] }}</span>
            </div>
          </div>
          <section class="drawer-section">
            <h3>账号管理</h3>
            <div class="form-grid">
              <label
                >显示名称<input
                  v-model="selectedUser.user.displayName"
                  class="admin-input" /></label
              ><label
                >角色<select
                  v-model="selectedUser.user.role"
                  class="admin-input"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select></label
              ><label
                >状态<select
                  v-model="selectedUser.user.status"
                  class="admin-input"
                >
                  <option value="active">正常</option>
                  <option value="suspended">停用</option>
                </select></label
              ><label
                >主页<select
                  v-model="selectedUser.user.profileVisibility"
                  class="admin-input"
                >
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                </select></label
              ><label
                >风险<select
                  v-model="selectedUser.user.riskLevel"
                  class="admin-input"
                >
                  <option value="normal">普通</option>
                  <option value="watch">关注</option>
                  <option value="high">高风险</option>
                </select></label
              ><label class="span-2"
                >管理员备注<textarea
                  v-model="selectedUser.user.note"
                  class="admin-input"
                  rows="4"
                ></textarea>
              </label>
            </div>
            <div class="form-actions">
              <div class="session-action">
                <button class="ghost-button" @click="revokeUserSessions">
                  强制退出全部设备</button
                ><small
                  >立即使该用户在所有浏览器和设备上的登录状态失效，不会删除账号或观影数据。</small
                >
              </div>
              <button
                v-if="
                  can('users.manage') &&
                  selectedUser.user.id !== auth.user.value?.id
                "
                :class="
                  selectedUser.user.role === 'admin'
                    ? 'danger-button'
                    : 'ghost-button'
                "
                @click="quickChangeRole(selectedUser.user)"
              >
                {{
                  selectedUser.user.role === "admin"
                    ? "降级为普通用户"
                    : "提升为超级管理员"
                }}</button
              ><button class="primary-button" @click="saveUser">
                保存用户
              </button>
            </div>
          </section>
          <section v-if="can('users.permissions')" class="drawer-section">
            <h3>管理员分组</h3>
            <div class="group-checks">
              <button
                v-for="group in groups.groups"
                :key="group.id"
                :class="
                  selectedUser.access.groups.some((g: any) => g.id === group.id)
                    ? 'selected'
                    : ''
                "
                @click="toggleUserGroup(group)"
              >
                {{ group.name }}
              </button>
            </div>
            <h3>用户级权限覆盖</h3>
            <div class="override-list">
              <label
                v-for="permission in groups.permissions"
                :key="permission.permissionKey"
                ><span
                  ><b>{{ permission.name }}</b
                  ><small>{{ permission.permissionKey }}</small></span
                ><select
                  :value="permissionEffect(permission.permissionKey)"
                  class="admin-input"
                  @change="
                    setPermissionEffect(
                      permission.permissionKey,
                      ($event.target as HTMLSelectElement).value,
                    )
                  "
                >
                  <option value="">继承分组</option>
                  <option value="allow">单独允许</option>
                  <option value="deny">明确拒绝</option>
                </select></label
              >
            </div>
            <button class="primary-button" @click="saveUserAccess">
              保存权限
            </button>
          </section>
          <section class="drawer-section">
            <h3>登录会话</h3>
            <div
              v-for="session in selectedUser.sessions"
              :key="session.id"
              class="session-row"
            >
              <div>
                <b>{{ session.ipAddress || "未知 IP" }}</b>
                <p>{{ session.userAgent || "未知设备" }}</p>
              </div>
              <span>{{
                session.revokedAt
                  ? "已撤销"
                  : new Date(session.expiresAt) > new Date()
                    ? "有效"
                    : "过期"
              }}</span>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-header,
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}
.admin-header {
  border-bottom: 1px solid #ffffff12;
  padding: 25px 2px;
}
.admin-header h1 {
  margin: 5px 0;
  font-size: 34px;
  font-weight: 850;
}
.admin-header p,
.section-heading p {
  color: #8f939d;
  font-size: 11px;
}
.admin-kicker {
  color: #f5c518 !important;
  font: 9px JetBrains Mono;
  letter-spacing: 0.2em;
}
.header-status {
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #ffffff12;
  border-radius: 999px;
  background: #1d2025;
  padding: 9px 13px;
  font-size: 10px;
}
.header-status > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
}
.header-status .working {
  background: #f5c518;
}
.header-status b {
  color: #f5c518;
}
.admin-shell {
  display: grid;
  grid-template-columns: 205px minmax(0, 1fr);
  gap: 22px;
  padding-top: 22px;
}
.admin-sidebar {
  position: sticky;
  top: 70px;
  align-self: start;
}
.access-card {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #ffffff10;
  border-radius: 9px;
  background: #1d2025;
  padding: 12px;
}
.access-card > span {
  color: #f5c518;
}
.access-card b,
.access-card small {
  display: block;
}
.access-card small {
  color: #777b84;
  font-size: 8px;
}
.admin-sidebar nav {
  margin-top: 11px;
}
.admin-nav {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border-radius: 7px;
  padding: 10px 12px;
  color: #aeb1ba;
  font-size: 11px;
}
.admin-nav:hover {
  background: #24272d;
}
.admin-nav.active {
  background: #f5c518;
  color: #111;
  font-weight: 800;
}
.admin-nav .material-symbols-outlined {
  font-size: 18px;
}
.permission-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 13px;
  padding-top: 12px;
  border-top: 1px solid #ffffff0d;
  color: #777b84;
  font-size: 9px;
}
.permission-count b {
  color: #e2e2e8;
  font-size: 19px;
}
.admin-content {
  min-width: 0;
  font-size: 13px;
}
.section-heading {
  margin-bottom: 16px;
}
.section-heading h2 {
  font-size: 23px;
  font-weight: 800;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.metric-card,
.admin-panel,
.provider-card,
.setting-card,
.review-card,
.group-card {
  border: 1px solid #ffffff0f;
  border-radius: 9px;
  background: #1d2025;
}
.metric-card {
  min-height: 118px;
  padding: 15px;
}
.metric-card span {
  color: #aeb1ba;
  font-size: 10px;
}
.metric-card strong {
  display: block;
  margin: 11px 0 6px;
  color: #f5c518;
  font-size: 27px;
}
.metric-card p {
  color: #727681;
  font-size: 9px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}
.span-2 {
  grid-column: span 2;
}
.admin-panel {
  padding: 17px;
}
.admin-panel h3 {
  font-size: 14px;
  font-weight: 750;
}
.activity-chart,
.line-bars {
  display: flex;
  height: 165px;
  align-items: flex-end;
  gap: 7px;
  margin-top: 18px;
}
.activity-day,
.line-bars > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.bars {
  display: flex;
  height: 140px;
  align-items: flex-end;
  gap: 2px;
}
.bars i {
  width: 4px;
  min-height: 2px;
}
.registration {
  background: #60a5fa !important;
}
.interaction {
  background: #f5c518 !important;
}
.search {
  background: #34d399 !important;
}
.activity-day small,
.line-bars small {
  color: #6f737d;
  font-size: 7px;
}
.chart-legend {
  display: flex;
  gap: 15px;
  color: #8d919b;
  font-size: 9px;
}
.chart-legend i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
}
.line-bars i {
  display: block;
  width: 70%;
  max-width: 13px;
  border-radius: 3px 3px 0 0;
  background: #f5c518;
}
.panel-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.panel-title-row p,
.panel-title-row > b {
  margin-top: 4px;
  color: #8f939d;
  font-size: 12px;
}
.panel-title-row > b {
  color: #f5c518;
}
.behavior-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.behavior-grid > div {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #ffffff0d;
  border-radius: 8px;
  background: #24272d;
  padding: 10px;
}
.behavior-grid > div > span {
  color: #f5c518;
  font-size: 20px;
}
.behavior-grid p,
.behavior-grid b,
.behavior-grid small {
  display: block;
}
.behavior-grid b {
  font-size: 17px;
}
.behavior-grid small {
  color: #8f939d;
  font-size: 11px;
}
.panel-note {
  margin-top: 11px;
  color: #777b84;
  font-size: 11px;
  line-height: 1.6;
}
.progress-list > div {
  display: grid;
  grid-template-columns: minmax(90px, 1fr) minmax(70px, 1.4fr) auto;
  align-items: center;
  gap: 10px;
}
.progress-list > div > div {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #30333a;
}
.progress-list > div > div > i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a48600, #f5c518);
}
.quick-actions {
  display: flex;
  min-width: 112px;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}
.quick-actions button {
  font-size: 11px;
}
.session-action {
  max-width: 280px;
  margin-right: auto;
}
.session-action small {
  display: block;
  margin-top: 6px;
  color: #777b84;
  font-size: 11px;
  line-height: 1.45;
}
.breakdown-list > div,
.rank-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  border-bottom: 1px solid #ffffff0c;
  padding: 9px 0;
  font-size: 10px;
}
.breakdown-list span,
.rank-row span {
  color: #aeb1ba;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.tag-cloud span {
  border-radius: 999px;
  background: #282a30;
  padding: 6px 9px;
  font-size: 9px;
}
.tag-cloud b {
  color: #f5c518;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 11px;
}
.admin-input {
  min-width: 110px;
  border: 1px solid #ffffff17;
  border-radius: 6px;
  background: #24272d;
  padding: 9px 10px;
  color: #e2e2e8;
  font-size: 10px;
  outline: none;
}
.admin-input:focus {
  border-color: #f5c51899;
}
.admin-input.wide {
  min-width: 210px;
  flex: 1;
}
.primary-button,
.ghost-button,
.danger-button {
  border-radius: 6px;
  padding: 9px 13px;
  font-size: 10px;
  font-weight: 800;
}
.primary-button {
  background: #f5c518;
  color: #151515;
}
.ghost-button {
  border: 1px solid #ffffff18;
}
.danger-button {
  border: 1px solid #f8717140;
  background: #f8717114;
  color: #fca5a5;
}
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f5c51833;
  border-radius: 7px;
  background: #f5c51810;
  padding: 9px 12px;
  margin-bottom: 9px;
  font-size: 10px;
}
.bulk-bar button,
.text-button {
  color: #f5c518;
}
.table-wrap {
  overflow: auto;
  border: 1px solid #ffffff0f;
  border-radius: 9px;
  scrollbar-width: thin;
  scrollbar-color: #6d6250 #24272d;
}
.table-wrap::-webkit-scrollbar,
.permission-groups::-webkit-scrollbar,
.override-list::-webkit-scrollbar,
.user-drawer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-wrap::-webkit-scrollbar-track,
.permission-groups::-webkit-scrollbar-track,
.override-list::-webkit-scrollbar-track,
.user-drawer::-webkit-scrollbar-track {
  border-radius: 999px;
  background: #24272d;
}
.table-wrap::-webkit-scrollbar-thumb,
.permission-groups::-webkit-scrollbar-thumb,
.override-list::-webkit-scrollbar-thumb,
.user-drawer::-webkit-scrollbar-thumb {
  border: 2px solid #24272d;
  border-radius: 999px;
  background: #6d6250;
}
.table-wrap::-webkit-scrollbar-thumb:hover,
.permission-groups::-webkit-scrollbar-thumb:hover,
.override-list::-webkit-scrollbar-thumb:hover,
.user-drawer::-webkit-scrollbar-thumb:hover {
  background: #f5c518;
}
.admin-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
  background: #1d2025;
}
.admin-table th,
.admin-table td {
  border-bottom: 1px solid #ffffff0d;
  padding: 11px;
  text-align: left;
  font-size: 9px;
}
.admin-table th {
  background: #24272d;
  color: #9da1aa;
}
.admin-table small {
  color: #6f737d;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 175px;
}
.user-cell img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.user-cell b,
.user-cell small {
  display: block;
}
.user-cell small {
  color: #777b84;
  font-size: 8px;
}
.status-pill,
.risk-pill,
.mini-group {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 7px;
}
.status-pill.admin {
  background: #f5c5181f;
  color: #f5c518;
}
.status-pill.user,
.status-pill.active {
  background: #34d3991a;
  color: #6ee7b7;
}
.status-pill.suspended {
  background: #f871711a;
  color: #fca5a5;
}
.mini-group {
  margin: 2px;
  border: 1px solid;
}
.risk-pill.normal {
  background: #282a30;
}
.risk-pill.watch {
  background: #fb923c1f;
  color: #fdba74;
}
.risk-pill.high {
  background: #f871711f;
  color: #fca5a5;
}
.success-text {
  color: #6ee7b7 !important;
}
.danger-text {
  color: #fca5a5 !important;
}
.muted {
  color: #777b84;
}
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 13px;
  color: #8d919b;
  font-size: 9px;
}
.pager button {
  border: 1px solid #ffffff15;
  border-radius: 6px;
  padding: 6px 11px;
}
.pager button:disabled {
  opacity: 0.35;
}
.group-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 13px;
}
.group-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
}
.group-card {
  display: grid;
  grid-template-columns: 4px 1fr;
  gap: 11px;
  padding: 13px;
}
.group-card > i {
  border-radius: 4px;
}
.group-card h3 span {
  border-radius: 999px;
  background: #282a30;
  padding: 3px 5px;
  color: #999;
  font-size: 7px;
}
.group-card p {
  margin: 6px 0;
  color: #888d98;
  font-size: 9px;
}
.group-card small {
  color: #666a74;
  font-size: 8px;
}
.group-card div div {
  display: flex;
  gap: 10px;
  margin-top: 9px;
  font-size: 9px;
}
.sticky-form {
  position: sticky;
  top: 73px;
  align-self: start;
}
.sticky-form > label,
.provider-form label,
.cache-form label,
.drawer-section label {
  display: block;
  margin-top: 10px;
  color: #aeb1ba;
  font-size: 9px;
}
.sticky-form .admin-input,
.provider-form .admin-input,
.cache-form .admin-input,
.drawer-section .admin-input {
  display: block;
  width: 100%;
  margin-top: 5px;
}
.color-input {
  width: 100%;
  height: 34px;
  margin-top: 5px;
}
.permission-groups {
  max-height: 390px;
  overflow: auto;
  margin-top: 12px;
}
.permission-groups h4 {
  margin: 10px 0 5px;
  color: #f5c518;
  font-size: 8px;
}
.permission-option {
  display: flex !important;
  gap: 7px;
  margin: 0 !important;
  padding: 6px;
  border-bottom: 1px solid #ffffff0a;
}
.permission-option b,
.permission-option small {
  display: block;
}
.permission-option small {
  color: #676b75;
  font-size: 7px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 13px;
}
.review-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
}
.review-card {
  display: grid;
  grid-template-columns: 16px 48px 1fr;
  gap: 9px;
  padding: 11px;
}
.review-card img {
  width: 48px;
  height: 70px;
  object-fit: cover;
}
.review-meta {
  display: flex;
  justify-content: space-between;
}
.review-meta span {
  font-size: 7px;
}
.review-meta .published {
  color: #6ee7b7;
}
.review-meta .hidden {
  color: #fca5a5;
}
.review-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 7px 0;
  color: #b5b8c1;
  font-size: 9px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.review-card small {
  color: #727681;
  font-size: 7px;
}
.review-card > div > div:last-child {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  font-size: 8px;
}
.provider-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.provider-card {
  padding: 14px;
}
.provider-head {
  display: flex;
  justify-content: space-between;
}
.provider-head > div {
  display: grid;
  grid-template-columns: 7px 1fr;
  column-gap: 6px;
}
.provider-head small {
  grid-column: 2;
  color: #6f737d;
  font-size: 7px;
}
.provider-dot {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 50%;
}
.provider-dot.online {
  background: #34d399;
}
.provider-dot.offline {
  background: #f87171;
}
.credential {
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 7px;
}
.credential.ok {
  background: #34d3991a;
  color: #6ee7b7;
}
.credential.missing {
  background: #f871711a;
  color: #fca5a5;
}
.provider-url {
  overflow: hidden;
  margin: 11px 0;
  color: #727681;
  font: 7px monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.provider-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.provider-stats div {
  border-radius: 5px;
  background: #24272d;
  padding: 7px 4px;
  text-align: center;
}
.provider-stats b,
.provider-stats span {
  display: block;
}
.provider-stats span {
  color: #6f737d;
  font-size: 6px;
}
.provider-actions {
  display: flex;
  gap: 10px;
  margin-top: 11px;
  font-size: 8px;
}
.provider-form,
.cache-form {
  margin-top: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 10px;
}
.cache-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
  margin-bottom: 11px;
}
.cache-summary article {
  border-radius: 8px;
  background: #1d2025;
  padding: 12px;
}
.cache-summary b,
.cache-summary strong,
.cache-summary p,
.cache-summary small {
  display: block;
}
.cache-summary strong {
  margin: 6px 0;
  color: #f5c518;
  font-size: 20px;
}
.cache-summary p,
.cache-summary small,
.cache-summary button {
  color: #777b84;
  font-size: 7px;
}
.cache-summary button {
  margin-top: 7px;
  color: #fca5a5;
}
.cache-key {
  max-width: 330px;
  overflow: hidden;
  font: 8px monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.code-input {
  font-family: monospace;
}
.log-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.log-item {
  display: grid;
  grid-template-columns: 27px 1fr;
  gap: 8px;
  border-bottom: 1px solid #ffffff0b;
  padding: 9px 0;
}
.log-item > i {
  display: flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #282a30;
  font-size: 8px;
}
.log-item > i.success {
  color: #6ee7b7;
}
.log-item > i.error {
  color: #fca5a5;
}
.log-item > i.audit {
  color: #f5c518;
}
.log-item b {
  font-size: 8px;
}
.log-item p {
  margin: 3px 0;
  color: #777b84;
  font-size: 7px;
}
.log-item small {
  color: #5f636d;
  font-size: 7px;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.setting-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 15px;
}
.setting-card p {
  margin: 4px 0;
  color: #888d98;
  font-size: 9px;
}
.setting-card small {
  color: #60646e;
  font-size: 7px;
}
.setting-card textarea {
  grid-column: 1/-1;
}
.admin-error {
  display: flex;
  justify-content: space-between;
  border: 1px solid #f8717138;
  border-radius: 7px;
  background: #f8717114;
  padding: 10px 12px;
  margin-bottom: 10px;
  color: #fecaca;
  font-size: 10px;
}
.admin-empty {
  padding: 90px;
  text-align: center;
  color: #888d98;
}
.modal-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: #000a;
}
.user-drawer {
  width: min(670px, 94vw);
  height: 100%;
  overflow: auto;
  background: #17191e;
}
.user-drawer > header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ffffff12;
  background: #17191ef5;
  padding: 16px;
}
.drawer-content {
  padding: 16px;
}
.user-stat-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.admin-header p,
.section-heading p {
  font-size: 13px;
}
.admin-kicker {
  font-size: 11px;
}
.header-status {
  font-size: 12px;
}
.access-card small {
  font-size: 10px;
}
.admin-nav {
  font-size: 13px;
}
.permission-count {
  font-size: 11px;
}
.metric-card span {
  font-size: 12px;
}
.metric-card p {
  font-size: 11px;
  line-height: 1.45;
}
.admin-panel h3 {
  font-size: 16px;
}
.activity-day small,
.line-bars small {
  font-size: 9px;
}
.chart-legend,
.breakdown-list > div,
.rank-row {
  font-size: 12px;
}
.tag-cloud span {
  font-size: 11px;
}
.admin-input {
  font-size: 12px;
}
.primary-button,
.ghost-button,
.danger-button {
  font-size: 12px;
}
.bulk-bar {
  font-size: 12px;
}
.admin-table th,
.admin-table td {
  font-size: 11px;
}
.user-cell small {
  font-size: 10px;
}
.status-pill,
.risk-pill,
.mini-group {
  font-size: 9px;
}
.pager {
  font-size: 11px;
}
.group-card p {
  font-size: 11px;
}
.group-card small,
.group-card div div {
  font-size: 10px;
}
.sticky-form > label,
.provider-form label,
.cache-form label,
.drawer-section label {
  font-size: 11px;
}
.permission-groups h4 {
  font-size: 10px;
}
.permission-option small {
  font-size: 9px;
}
.review-meta span,
.review-card small {
  font-size: 9px;
}
.review-card p {
  font-size: 11px;
}
.review-card > div > div:last-child {
  font-size: 10px;
}
.provider-head small,
.provider-stats span,
.provider-url,
.credential {
  font-size: 9px;
}
.provider-actions {
  font-size: 10px;
}
.cache-summary p,
.cache-summary small,
.cache-summary button {
  font-size: 9px;
}
.cache-key {
  font-size: 10px;
}
.log-item b {
  font-size: 11px;
}
.log-item p,
.log-item small {
  font-size: 9px;
}
.setting-card p {
  font-size: 11px;
}
.setting-card small {
  font-size: 9px;
}
.user-stat-grid span {
  font-size: 10px;
}
.drawer-section h3 {
  font-size: 14px;
}
.override-list small {
  font-size: 9px;
}
.session-row {
  font-size: 10px;
}
.user-stat-grid div {
  border-radius: 6px;
  background: #24272d;
  padding: 9px;
  text-align: center;
}
.user-stat-grid b,
.user-stat-grid span {
  display: block;
}
.user-stat-grid b {
  color: #f5c518;
  font-size: 16px;
}
.user-stat-grid span {
  color: #777b84;
  font-size: 7px;
}
.drawer-section {
  margin-top: 14px;
  border: 1px solid #ffffff0f;
  border-radius: 8px;
  background: #1d2025;
  padding: 14px;
}
.drawer-section h3 {
  margin-bottom: 9px;
  font-size: 12px;
}
.group-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.group-checks button {
  border: 1px solid #ffffff15;
  border-radius: 999px;
  padding: 6px 8px;
  color: #999;
  font-size: 8px;
}
.group-checks .selected {
  border-color: #f5c518;
  color: #f5c518;
}
.override-list {
  max-height: 260px;
  overflow: auto;
}
.override-list label {
  display: grid;
  grid-template-columns: 1fr 115px;
  align-items: center;
  border-bottom: 1px solid #ffffff0a;
  padding: 7px 0;
}
.override-list b,
.override-list small {
  display: block;
}
.override-list small {
  color: #646872;
  font-size: 7px;
}
.session-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #ffffff0a;
  padding: 8px 0;
  font-size: 8px;
}
.session-row p {
  color: #666a74;
}
.provider-form .span-2,
.cache-form .span-2,
.drawer-section .span-2 {
  grid-column: span 2;
}
@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .provider-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .log-columns {
    grid-template-columns: 1fr;
  }
  .cache-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 800px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    position: static;
  }
  .admin-sidebar nav {
    display: flex;
    overflow: auto;
  }
  .admin-nav {
    min-width: max-content;
  }
  .access-card,
  .permission-count {
    display: none;
  }
  .dashboard-grid,
  .group-layout,
  .review-grid,
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: auto;
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .provider-grid {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .user-stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
