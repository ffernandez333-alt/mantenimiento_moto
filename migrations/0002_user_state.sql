CREATE TABLE IF NOT EXISTS app_user_state (
  user_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
