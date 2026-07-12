INSERT INTO api_provider_configs (
  provider_key, display_name, base_url, health_path, enabled,
  request_timeout_ms, daily_quota, documentation_url, notes, is_system,
  last_test_status, last_test_at, last_latency_ms, last_error, created_by, updated_by
)
SELECT
  'justone', 'Just One API', base_url, health_path, enabled,
  request_timeout_ms, daily_quota, documentation_url,
  'IMDb 评分、评论、奖项、票房、榜单、新闻，以及豆瓣评分、长评和近期热门',
  TRUE, last_test_status, last_test_at, last_latency_ms, last_error, created_by, updated_by
FROM api_provider_configs
WHERE provider_key = 'imdb'
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  base_url = VALUES(base_url),
  health_path = VALUES(health_path),
  enabled = VALUES(enabled),
  request_timeout_ms = VALUES(request_timeout_ms),
  daily_quota = VALUES(daily_quota),
  documentation_url = VALUES(documentation_url),
  notes = VALUES(notes),
  is_system = TRUE;

INSERT INTO api_provider_configs (
  provider_key, display_name, base_url, health_path, enabled,
  request_timeout_ms, documentation_url, notes, is_system
) VALUES (
  'justone', 'Just One API', 'https://api.justoneapi.com', '/', TRUE,
  25000, NULL,
  'IMDb 评分、评论、奖项、票房、榜单、新闻，以及豆瓣评分、长评和近期热门',
  TRUE
)
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  notes = VALUES(notes),
  is_system = TRUE;

UPDATE api_cache SET provider = 'justone' WHERE provider = 'imdb';
UPDATE provider_sync_logs SET provider = 'justone' WHERE provider = 'imdb';
DELETE FROM api_provider_configs WHERE provider_key IN ('imdb', 'imdbapi-dev');

UPDATE api_provider_configs
SET display_name = 'TMDB',
    notes = '免费主体数据源：搜索、发现、影视与影人详情、图片、视频、演职员、推荐、榜单和 TMDB 用户评论',
    is_system = TRUE
WHERE provider_key = 'tmdb';
