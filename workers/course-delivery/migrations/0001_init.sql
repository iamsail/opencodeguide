-- 课程交付 Worker 的 D1 schema
-- 应用方式：npx wrangler d1 migrations apply course-delivery --remote
--
-- 字段与 docs/courses/02-feature-design.md 第 5.2 节的 orders 定义对齐，
-- 额外增加 email_status / delivery_note，用于「付款成功但没收到邮件」的排查。

create table if not exists orders (
  id                    text primary key,
  stripe_session_id     text not null unique,
  stripe_payment_intent text,
  email                 text not null,
  locale                text not null default 'en',
  course_slug           text not null,
  plan_id               text not null,
  amount_cents          integer not null,
  currency              text not null default 'usd',
  status                text not null default 'paid',      -- paid | refunded | partially_refunded | disputed
  email_status          text not null default 'pending',   -- pending | sent | failed | resent | needs_manual_delivery
  delivery_note         text,
  created_at            text not null,
  updated_at            text not null,
  refunded_at           text,
  revoked_at            text
);

create index if not exists orders_email_idx on orders (email);
create index if not exists orders_payment_intent_idx on orders (stripe_payment_intent);
create index if not exists orders_status_idx on orders (status);

-- Stripe 事件幂等表：同一 event.id 只处理一次
create table if not exists processed_events (
  event_id    text primary key,
  type        text not null,
  received_at text not null
);

-- 常见对账查询（手工在 wrangler d1 execute 里用）：
--   按课程统计成交：
--     select course_slug, plan_id, count(*) as orders, sum(amount_cents)/100.0 as usd
--     from orders where status = 'paid' group by 1, 2 order by orders desc;
--   找出没发出去的开通信：
--     select id, email, course_slug, plan_id, email_status, delivery_note
--     from orders where email_status in ('failed', 'needs_manual_delivery');
