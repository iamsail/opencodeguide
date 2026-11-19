-- 登录方式从「邮件 magic link」改为 Google OAuth（2026-11-19）。
-- 这两张表不再被任何代码读写：留着只会让后来的人以为还有邮件登录。
drop table if exists magic_links;
drop table if exists auth_attempts;
