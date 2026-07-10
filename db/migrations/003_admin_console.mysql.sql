CREATE TABLE IF NOT EXISTS admin_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  color VARCHAR(16) NOT NULL DEFAULT '#f5c518',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_groups_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_permissions (
  permission_key VARCHAR(80) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(40) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  PRIMARY KEY (permission_key),
  KEY idx_admin_permissions_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_group_permissions (
  group_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(80) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (group_id, permission_key),
  CONSTRAINT fk_group_permissions_group FOREIGN KEY (group_id) REFERENCES admin_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_permissions_permission FOREIGN KEY (permission_key) REFERENCES admin_permissions(permission_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_admin_groups (
  user_id BIGINT UNSIGNED NOT NULL,
  group_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, group_id),
  KEY idx_user_admin_groups_group (group_id),
  CONSTRAINT fk_user_admin_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_admin_groups_group FOREIGN KEY (group_id) REFERENCES admin_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_admin_groups_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(80) NOT NULL,
  effect ENUM('allow','deny') NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, permission_key),
  CONSTRAINT fk_permission_overrides_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_permission_overrides_permission FOREIGN KEY (permission_key) REFERENCES admin_permissions(permission_key) ON DELETE CASCADE,
  CONSTRAINT fk_permission_overrides_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_user_notes (
  user_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  risk_level ENUM('normal','watch','high') NOT NULL DEFAULT 'normal',
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_user_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_user_notes_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api_provider_configs (
  provider_key VARCHAR(64) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  health_path VARCHAR(500) NOT NULL DEFAULT '/',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  request_timeout_ms INT UNSIGNED NOT NULL DEFAULT 25000,
  daily_quota INT UNSIGNED NULL,
  documentation_url VARCHAR(500) NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  last_test_status ENUM('untested','success','error') NOT NULL DEFAULT 'untested',
  last_test_at DATETIME(3) NULL,
  last_latency_ms INT UNSIGNED NULL,
  last_error VARCHAR(1000) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (provider_key),
  CONSTRAINT fk_api_provider_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_api_provider_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(80) NOT NULL,
  value_json JSON NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_site_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO admin_permissions (permission_key,name,category,description) VALUES
('dashboard.view','查看后台概览','概览','查看后台基础指标与运行摘要'),
('analytics.view','查看统计分析','统计','查看用户增长、活跃度、内容与数据源统计'),
('users.view','查看用户','用户','检索用户并查看用户详情'),
('users.manage','管理用户','用户','修改用户角色、状态、备注并撤销会话'),
('users.permissions','管理分组与权限','权限','维护管理员分组、权限和用户覆盖规则'),
('reviews.view','查看短评','内容','查看和检索站内用户短评'),
('reviews.moderate','审核短评','内容','隐藏、恢复及批量审核短评'),
('providers.view','查看 API','接口','查看 API Provider 配置、状态和调用统计'),
('providers.manage','管理 API','接口','添加和修改 Provider 配置与启用状态'),
('providers.test','测试 API','接口','从服务器发起 Provider 连通性测试'),
('cache.view','查看缓存','缓存','查看缓存记录、过期状态和响应摘要'),
('cache.manage','管理缓存','缓存','删除单条缓存或按条件清理缓存'),
('logs.view','查看日志','日志','查看管理员审计、登录与数据源日志'),
('settings.view','查看站点设置','设置','查看站点运行开关和公开设置'),
('settings.manage','管理站点设置','设置','修改注册、维护和公告设置');

INSERT IGNORE INTO admin_groups (slug,name,description,color,is_system) VALUES
('super-admin','超级管理员','拥有全部后台权限，系统内置且不可删除','#f5c518',TRUE),
('moderator','内容审核员','负责用户查询和短评审核','#60a5fa',TRUE),
('operator','接口运维员','负责 API、缓存与运行日志','#34d399',TRUE),
('analyst','数据分析员','只读查看概览、用户和统计数据','#c084fc',TRUE);

INSERT IGNORE INTO admin_group_permissions (group_id,permission_key)
SELECT g.id,p.permission_key FROM admin_groups g CROSS JOIN admin_permissions p WHERE g.slug='super-admin';

INSERT IGNORE INTO admin_group_permissions (group_id,permission_key)
SELECT g.id,p.permission_key FROM admin_groups g JOIN admin_permissions p ON p.permission_key IN ('dashboard.view','users.view','reviews.view','reviews.moderate','logs.view') WHERE g.slug='moderator';

INSERT IGNORE INTO admin_group_permissions (group_id,permission_key)
SELECT g.id,p.permission_key FROM admin_groups g JOIN admin_permissions p ON p.permission_key IN ('dashboard.view','providers.view','providers.manage','providers.test','cache.view','cache.manage','logs.view','settings.view') WHERE g.slug='operator';

INSERT IGNORE INTO admin_group_permissions (group_id,permission_key)
SELECT g.id,p.permission_key FROM admin_groups g JOIN admin_permissions p ON p.permission_key IN ('dashboard.view','analytics.view','users.view','reviews.view','providers.view','cache.view','logs.view','settings.view') WHERE g.slug='analyst';

INSERT IGNORE INTO user_admin_groups (user_id,group_id)
SELECT u.id,g.id FROM users u JOIN admin_groups g ON g.slug='super-admin' WHERE u.role='admin';

INSERT INTO api_provider_configs (provider_key,display_name,base_url,health_path,enabled,request_timeout_ms,documentation_url,notes,is_system) VALUES
('tmdb','TMDB','https://api.themoviedb.org/3','/configuration',TRUE,25000,'https://developer.themoviedb.org/','影视资料、图片、演职员、发现和观看平台',TRUE),
('imdbapi-dev','imdbapi.dev','https://api.imdbapi.dev','/',TRUE,25000,'https://imdbapi.dev/','普通 IMDb 影片、剧集与评分数据',TRUE),
('imdb','Just One API','https://api.justoneapi.com','/',TRUE,25000,NULL,'仅保留 IMDb Top 250 与影视新闻',TRUE)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),documentation_url=VALUES(documentation_url),is_system=TRUE;

INSERT INTO site_settings (setting_key,value_json,description,is_public) VALUES
('registration_enabled',CAST('true' AS JSON),'是否允许新用户注册',TRUE),
('maintenance_mode',CAST('false' AS JSON),'维护模式开关；开启后仅管理员可访问业务接口',TRUE),
('site_announcement',JSON_OBJECT('enabled',FALSE,'text',''),'主站公告内容',TRUE),
('review_auto_publish',CAST('true' AS JSON),'新短评是否默认公开',FALSE)
ON DUPLICATE KEY UPDATE description=VALUES(description),is_public=VALUES(is_public);
