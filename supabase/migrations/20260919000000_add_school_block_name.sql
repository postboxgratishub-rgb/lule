-- Add the administrative block used by the source enrolment directory.

alter table public.schools
  add column if not exists block_name text;

do $$
begin
  alter table public.schools
    add constraint schools_block_name_length
    check (
      block_name is null
      or char_length(block_name) between 1 and 150
    );
exception
  when duplicate_object then null;
end
$$;

create index if not exists schools_block_name_lower_idx
  on public.schools (lower(block_name), lower(name))
  where block_name is not null;

create or replace function private.normalize_school()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.code := upper(btrim(new.code));
  new.block_name := nullif(btrim(new.block_name), '');
  new.address := nullif(btrim(new.address), '');
  new.city := nullif(btrim(new.city), '');
  new.state := nullif(btrim(new.state), '');
  new.contact_name := nullif(btrim(new.contact_name), '');
  new.contact_phone := nullif(btrim(new.contact_phone), '');
  return new;
end;
$$;

-- Registration is available before sign-in, so the block is part of the same
-- directory-safe projection as the school name, code, city, and state.
grant select (block_name) on table public.schools to anon;

comment on column public.schools.block_name is
  'Normalized administrative block name used to group schools in enrollment pickers.';
