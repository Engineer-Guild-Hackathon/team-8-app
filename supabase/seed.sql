-- =========================
-- web-dev
-- =========================
insert into public.topics (slug, title, description)
values ('web-dev', 'Web開発', 'Web開発の基礎から応用')
on conflict (slug) do nothing;

insert into public.resources (type, title, url, difficulty, duration_min, cost_amount, description)
values
  ('video',  '基礎教材', 'https://example.com/r1', 1, 180, 0, 'HTML/CSS/JSの超入門'),
  ('book',   '中級教材', 'https://example.com/r2', 3, 240, 1500, 'フロントエンド中級'),
  ('course', '応用教材A','https://example.com/r3', 4, 360, 3000, '実践React'),
  ('repo',   '応用教材B','https://example.com/r4', 5, 480, 0, 'サンプル実装集')
on conflict (url) do nothing;

-- Topic -> Resource 関連（このトピックの教材）
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'topic', t.id, 'resource', r.id, 1.0, true
from public.topics t
join public.resources r on r.title in ('基礎教材','中級教材','応用教材A','応用教材B')
where t.slug = 'web-dev'
on conflict (from_type, from_id, to_type, to_id) do nothing;

-- 学習順序（Resource -> Resource）
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', (select id from public.resources where title='基礎教材'),
       'resource', (select id from public.resources where title='中級教材'),
       1.0, true
on conflict (from_type, from_id, to_type, to_id) do nothing;

insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', (select id from public.resources where title='基礎教材'),
       'resource', (select id from public.resources where title='応用教材A'),
       1.0, true
on conflict (from_type, from_id, to_type, to_id) do nothing;

insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', (select id from public.resources where title='中級教材'),
       'resource', (select id from public.resources where title='応用教材B'),
       1.0, true
on conflict (from_type, from_id, to_type, to_id) do nothing;

insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', (select id from public.resources where title='応用教材A'),
       'resource', (select id from public.resources where title='応用教材B'),
       1.0, true
on conflict (from_type, from_id, to_type, to_id) do nothing;


-- =========================
-- ai-ml 学習順序（Resource -> Resource）
-- =========================

-- Python入門 -> 機械学習基礎
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select
  'resource',
  r1.id,
  'resource',
  r2.id,
  5,
  true
from public.resources r1, public.resources r2
where r1.url = 'https://docs.python.org/ja/3/tutorial/'
  and r2.url = 'https://www.coursera.org/learn/machine-learning'
on conflict (from_type, from_id, to_type, to_id) do nothing;

-- 機械学習基礎 -> scikit-learnガイド
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', r1.id, 'resource', r2.id, 4, true
from public.resources r1, public.resources r2
where r1.url = 'https://www.coursera.org/learn/machine-learning'
  and r2.url = 'https://scikit-learn.org/stable/'
on conflict (from_type, from_id, to_type, to_id) do nothing;

-- 直感で学ぶ線形代数 -> 機械学習基礎
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', r1.id, 'resource', r2.id, 3, true
from public.resources r1, public.resources r2
where r1.url = 'https://www.youtube.com/@3blue1brown'
  and r2.url = 'https://www.coursera.org/learn/machine-learning'
on conflict (from_type, from_id, to_type, to_id) do nothing;

-- scikit-learnガイド -> Hands-on ML サンプル
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'resource', r1.id, 'resource', r2.id, 3, true
from public.resources r1, public.resources r2
where r1.url = 'https://scikit-learn.org/stable/'
  and r2.url = 'https://github.com/ageron/handson-ml3'
on conflict (from_type, from_id, to_type, to_id) do nothing;