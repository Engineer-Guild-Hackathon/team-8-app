-- Topic
insert into public.topics (slug, title, description)
values ('web-dev', 'Web開発', 'Web開発の基礎から応用')
on conflict (slug) do nothing;

-- Resources
insert into public.resources (type, title, url, difficulty, description)
values
  ('video',  '基礎教材', 'https://example.com/r1', 1, 'HTML/CSS/JSの超入門'),
  ('book',   '中級教材', 'https://example.com/r2', 3, 'フロントエンド中級'),
  ('course', '応用教材A','https://example.com/r3', 4, '実践React'),
  ('repo',   '応用教材B','https://example.com/r4', 5, 'サンプル実装集')
on conflict (url) do nothing;

-- Topic -> Resource edges（このトピックに属する教材）
insert into public.edges (from_type, from_id, to_type, to_id, weight, is_active)
select 'topic', t.id, 'resource', r.id, 1.0, true
from public.topics t, public.resources r
where t.slug = 'web-dev' and r.title in ('基礎教材','中級教材','応用教材A','応用教材B')
on conflict (from_type, from_id, to_type, to_id) do nothing;

-- Resource -> Resource edges（学習順序）
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


