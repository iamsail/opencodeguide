-- P2.1 · 权益表（entitlements）
-- 应用方式：npx wrangler d1 migrations apply course-delivery --remote
--
-- 为什么要有这张表：orders 是「钱发生了什么」的流水，entitlements 是
-- 「现在谁能读哪门课」的授权。两者分开的三个理由：
--   1. 查权限不必扫订单表、不必解释退款/拒付状态；
--   2. 全站通一次购买要展开成多门课，订单行只有一条；
--   3. 撤销用 revoked_at 标记（不删行），保留「谁在什么时候被回收」的审计痕迹。
--
-- 与 orders 的关系：entitlements.order_id 指向产生它的订单；全额退款时
-- 按 order_id 批量撤销。unique(email, course_slug) 保证同一邮箱同一门课只有
-- 一条记录——重复购买是「复活」同一条，而不是堆出两条。

create table if not exists entitlements (
  id          text primary key,
  email       text not null,          -- 统一小写去空格（写入前 normalize）
  course_slug text not null,          -- 含 'all-access'（bundle 自身也留一条，便于新课程批量补授）
  plan_id     text not null,
  order_id    text,                   -- 产生权益的订单
  granted_at  text not null,
  revoked_at  text,                   -- 非空 = 已回收（全额退款/拒付）
  unique (email, course_slug)
);

create index if not exists entitlements_email_idx on entitlements (email);
create index if not exists entitlements_order_idx on entitlements (order_id);
create index if not exists entitlements_course_idx on entitlements (course_slug);

-- 下面两张表属于 P2.2（magic link 登录），先建好避免二次迁移；
-- P2.1 的代码不读写它们。

-- 登录令牌：只存 sha256(token)，明文只在邮件里出现一次
create table if not exists magic_links (
  token_hash text primary key,
  email      text not null,
  expires_at text not null,
  used_at    text,
  created_at text not null,
  ip         text
);

create index if not exists magic_links_email_idx on magic_links (email, created_at);

-- 限流计数：key = 'email:<email>:<分钟序号>' 或 'ip:<ip>:<小时序号>'
-- updated_at 用于清理（24 小时前的窗口直接删掉，避免表无限增长）
create table if not exists auth_attempts (
  key        text not null primary key,
  count      integer not null default 1,
  updated_at text not null
);

-- 常用对账查询（手工执行）：
--   某邮箱有哪些有效权益：
--     select course_slug, granted_at from entitlements
--     where email = 'buyer@example.com' and revoked_at is null;
--   按课程统计有效学员数：
--     select course_slug, count(*) from entitlements
--     where revoked_at is null group by 1 order by 2 desc;
--   已付款但没有权益的订单（应为 0，历史订单用 scripts/courses/backfill-entitlements.mjs 回填）：
--     select o.id, o.email, o.course_slug from orders o
--     where o.email <> '' and o.course_slug <> ''
--       and o.status in ('paid', 'partially_refunded')
--       and not exists (select 1 from entitlements e where e.order_id = o.id);
