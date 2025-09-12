BEGIN;

INSERT INTO public.topics (slug, title, description)
VALUES
  ('web-dev',    'web-dev',    'seed topic'),
  ('ai-ml',      'ai-ml',      'seed topic'),
  ('basic-math', 'basic-math', 'seed topic')
ON CONFLICT (slug) DO NOTHING;

WITH target AS (
  SELECT id, slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
),
old_res AS (
  SELECT DISTINCT r.id
  FROM target t
  JOIN public.edges e
    ON e.from_type = 'topic'::public.node_type
   AND e.from_id   = t.id
   AND e.to_type   = 'resource'::public.node_type
  JOIN public.resources r ON r.id = e.to_id
)

DELETE FROM public.edges e
USING old_res o
WHERE e.from_type = 'resource'::public.node_type
  AND e.to_type   = 'resource'::public.node_type
  AND (e.from_id = o.id OR e.to_id = o.id);

WITH target AS (
  SELECT id, slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
)
DELETE FROM public.edges e
USING target t
WHERE e.from_type = 'topic'::public.node_type
  AND e.from_id   = t.id
  AND e.to_type   = 'resource'::public.node_type;

WITH target AS (
  SELECT id, slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
),
old_res AS (
  SELECT DISTINCT r.id
  FROM target t
  JOIN public.edges e
    ON e.from_type = 'topic'::public.node_type
   AND e.from_id   = t.id
   AND e.to_type   = 'resource'::public.node_type
  RIGHT JOIN public.resources r ON r.id = e.to_id
  WHERE e.to_id IS NOT NULL
)
DELETE FROM public.resources r
USING old_res o
WHERE r.id = o.id;

WITH target AS (
  SELECT id AS topic_id, slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
),
gen AS (
  SELECT t.topic_id, t.slug, g AS n
  FROM target t
  CROSS JOIN generate_series(1,50) AS g
)
INSERT INTO public.resources
  (id, type, url, title, difficulty, duration_min, cost_amount, cost_currency, description)
SELECT
  gen_random_uuid(),
  (ARRAY[
    'doc'::public.resource_type,
    'video'::public.resource_type,
    'course'::public.resource_type,
    'book'::public.resource_type,
    'article'::public.resource_type,
    'repo'::public.resource_type
  ])[1 + (n % 6)],
  'https://example.com/'||slug||'/seed/'||n,
  upper(slug)||' 教材 '||n,
  1 + (n % 5),
  30 + n * 5,
  0, 'JPY',
  'seed-'||slug
FROM gen
ON CONFLICT (url) DO NOTHING;

WITH target AS (
  SELECT id AS topic_id, slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
),
res AS (
  SELECT t.topic_id, r.id
  FROM target t
  JOIN public.resources r
    ON r.url LIKE 'https://example.com/'||t.slug||'/seed/%'
)
INSERT INTO public.edges (from_type, from_id, to_type, to_id, weight, is_active)
SELECT 'topic'::public.node_type, topic_id, 'resource'::public.node_type, id, 1.0, true
FROM res
ON CONFLICT (from_type, from_id, to_type, to_id) DO NOTHING;

WITH target AS (
  SELECT slug
  FROM public.topics
  WHERE slug IN ('web-dev','ai-ml','basic-math')
),
res AS (
  SELECT t.slug, r.id,
         row_number() OVER (PARTITION BY t.slug ORDER BY r.title) AS rn
  FROM target t
  JOIN public.resources r
    ON r.url LIKE 'https://example.com/'||t.slug||'/seed/%'
)
INSERT INTO public.edges (from_type, from_id, to_type, to_id, weight, is_active)
SELECT 'resource'::public.node_type, r1.id, 'resource'::public.node_type, r2.id, 1.0, true
FROM res r1
JOIN res r2 ON r2.slug = r1.slug AND r2.rn = r1.rn + 1
ON CONFLICT (from_type, from_id, to_type, to_id) DO NOTHING;

COMMIT;

WITH target AS (
  SELECT id, slug FROM public.topics WHERE slug IN ('web-dev','ai-ml','basic-math')
),
res AS (
  SELECT t.slug, r.id
  FROM target t
  JOIN public.resources r ON r.url LIKE 'https://example.com/'||t.slug||'/seed/%'
),
tr AS (
  SELECT t.slug, COUNT(*) AS topic_links
  FROM target t
  JOIN public.edges e
    ON e.from_type='topic'::public.node_type AND e.from_id=t.id AND e.to_type='resource'::public.node_type
  JOIN res r ON r.id = e.to_id
  GROUP BY t.slug
)
SELECT
  r.slug,
  COUNT(r.id) AS resources,
  COALESCE(tr.topic_links,0) AS topic_links
FROM res r
LEFT JOIN tr ON tr.slug = r.slug
GROUP BY r.slug, tr.topic_links
ORDER BY r.slug;
