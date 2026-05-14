-- Supabase fish-feeding site schema
-- Run this script in the Supabase SQL editor before switching the app over

create extension if not exists "pgcrypto";

-- Fish type metadata
create table if not exists fish_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  accent_from text not null,
  accent_to text not null,
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_fish_types_display_order on fish_types(display_order asc);

-- Fish catalog
create table if not exists fish (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  fish_type_id uuid not null references fish_types(id) on delete cascade,
  name text not null,
  description text not null,
  favorite_food_slug text not null,
  merit_bonus integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_fish_display_order on fish(display_order asc);
create index if not exists idx_fish_type_id on fish(fish_type_id);

-- Feeding activity log
create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  fish_id uuid not null references fish(id) on delete cascade,
  food_slug text not null,
  food_label text not null,
  wish_description text not null,
  feeder_name text,
  merit_earned integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_wishes_created_at on wishes(created_at desc);
create index if not exists idx_wishes_fish_id on wishes(fish_id);

-- Enable RLS
alter table fish_types enable row level security;
alter table fish enable row level security;
alter table wishes enable row level security;

-- Public read access
create policy "Anyone can read fish types"
  on fish_types
  for select
  using (true);

create policy "Anyone can read fish"
  on fish
  for select
  using (true);

create policy "Anyone can read wishes"
  on wishes
  for select
  using (true);

-- Public insert for feed actions only
create policy "Anyone can insert wishes"
  on wishes
  for insert
  with check (true);

-- Seed sample fish types
insert into fish_types (slug, name, description, accent_from, accent_to, image_url, display_order)
values
  ('goldfish', '金鱼', '温和常见，适合新手投喂。', '#f59e0b', '#f97316', null, 1),
  ('koi', '锦鲤', '传统好运代表，投喂后功德更稳。', '#ef4444', '#fb7185', null, 2),
  ('blue-tang', '蓝吊', '海洋系人气鱼，活力十足。', '#0ea5e9', '#3b82f6', null, 3),
  ('angelfish', '神仙鱼', '优雅慢游，适合仪式感喂养。', '#8b5cf6', '#a855f7', null, 4),
  ('clownfish', '小丑鱼', '喜欢热闹，会在水草间穿梭。', '#fb7185', '#f59e0b', null, 5),
  ('pufferfish', '河豚', '气鼓鼓但很好哄，认真投喂就放松。', '#22c55e', '#14b8a6', null, 6)
on conflict (slug) do nothing;

-- Seed sample fish rows
insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'golden-little',
  ft.id,
  '小金',
  '喜欢轻盈鱼粮，吃完会慢慢绕场一圈。',
  'floating-pellet',
  2,
  1
from fish_types ft where ft.slug = 'goldfish'
on conflict (slug) do nothing;

insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'red-koi',
  ft.id,
  '红锦',
  '每次被喂到都会多带一点好运。',
  'shrimp-strip',
  3,
  2
from fish_types ft where ft.slug = 'koi'
on conflict (slug) do nothing;

insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'azure-fin',
  ft.id,
  '蓝鳍',
  '偏爱鲜味，吃到喜欢的会发光一样转身。',
  'brine-shrimp',
  4,
  3
from fish_types ft where ft.slug = 'blue-tang'
on conflict (slug) do nothing;

insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'sacred-glide',
  ft.id,
  '神游',
  '最喜欢安静地接受认真投喂。',
  'algae-bite',
  2,
  4
from fish_types ft where ft.slug = 'angelfish'
on conflict (slug) do nothing;

insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'sunny-clown',
  ft.id,
  '小橙',
  '喜欢穿梭在珊瑚旁，热闹又灵动。',
  'floating-pellet',
  3,
  5
from fish_types ft where ft.slug = 'clownfish'
on conflict (slug) do nothing;

insert into fish (slug, fish_type_id, name, description, favorite_food_slug, merit_bonus, display_order)
select
  'round-puff',
  ft.id,
  '泡泡',
  '被认真投喂后就会慢慢放松下来。',
  'algae-bite',
  5,
  6
from fish_types ft where ft.slug = 'pufferfish'
on conflict (slug) do nothing;
