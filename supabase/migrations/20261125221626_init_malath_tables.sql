-- 1. جدول دفتر التأمل
create table reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  best_event text,
  trait_1 text,
  trait_2 text,
  trait_3 text,
  venting_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. جدول عدّادات المسبحة
create table tasbih_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  dhikr_type text not null,
  count integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول سجل المشاعر والآيات
create table mood_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  user_feeling text,
  verse_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل الحماية لخصوصية كل مستخدم
alter table reflections enable row level security;
alter table tasbih_logs enable row level security;
alter table mood_history enable row level security;

create policy "Users manage own reflections" on reflections for all using (auth.uid() = user_id);
create policy "Users manage own tasbih" on tasbih_logs for all using (auth.uid() = user_id);
create policy "Users manage own mood" on mood_history for all using (auth.uid() = user_id);
