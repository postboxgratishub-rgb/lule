begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(12);

select extensions.has_column(
  'public',
  'schools',
  'block_name',
  'schools includes an administrative block name'
);
select extensions.col_type_is(
  'public',
  'schools',
  'block_name',
  'text',
  'school block names use text'
);
select extensions.ok(
  (
    select is_nullable = 'YES'
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schools'
      and column_name = 'block_name'
  ),
  'school block name is optional'
);
select extensions.ok(
  has_column_privilege('anon', 'public.schools', 'block_name', 'SELECT'),
  'anonymous registration clients can read school block names'
);
select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.schools'::regclass
      and conname = 'schools_block_name_length'
  ),
  'school block name has a length constraint'
);
select extensions.ok(
  to_regclass('public.schools_block_name_lower_idx') is not null,
  'school block grouping index exists'
);

insert into public.schools (id, name, code, block_name)
values
  (
    '94000000-0000-4000-8000-000000000001',
    'Block Test School One',
    'BLOCKTEST1',
    '  Parvathipuram Manyam  '
  ),
  (
    '94000000-0000-4000-8000-000000000002',
    'Block Test School Two',
    'BLOCKTEST2',
    '   '
  );

select extensions.is(
  (
    select block_name
    from public.schools
    where id = '94000000-0000-4000-8000-000000000001'
  ),
  'Parvathipuram Manyam',
  'school block names are trimmed'
);
select extensions.is(
  (
    select block_name
    from public.schools
    where id = '94000000-0000-4000-8000-000000000002'
  ),
  null,
  'blank school block names normalize to null'
);
select extensions.throws_ok(
  $$
    insert into public.schools (name, code, block_name)
    values ('Block Test School Three', 'BLOCKTEST3', repeat('x', 151))
  $$,
  '23514',
  null,
  'school block names longer than 150 characters are rejected'
);

create temporary table expected_school_blocks (
  code text primary key,
  block_name text not null
);

insert into expected_school_blocks (code, block_name)
values
  ('28111401513', 'BHAMINI'),
  ('28120209701', 'G.L.PURAM'),
  ('28120401701', 'JIYYAMMAVALASA'),
  ('28120103403', 'KOMARADA'),
  ('28120301404', 'KURUPAM'),
  ('28120700301', 'MAKKUVA'),
  ('28121200101', 'PACHIPENTA'),
  ('28111202102', 'PALAKONDA'),
  ('28120603116', 'PARVATHIPURAM'),
  ('28121107404', 'SALURU'),
  ('28117100602', 'SEETHAMPETA'),
  ('28110101804', 'VEERAGHATTAM');

select extensions.is(
  (
    select count(*)
    from expected_school_blocks as expected
    join public.schools as school
      on school.code = expected.code
      and school.block_name = expected.block_name
  ),
  12::bigint,
  'the imported directory includes a verified school from every source block'
);
select extensions.is(
  (
    select count(distinct school.block_name)
    from expected_school_blocks as expected
    join public.schools as school on school.code = expected.code
  ),
  12::bigint,
  'the verified source schools retain all 12 block names'
);

create temporary table imported_school_snapshot as
select name, code, block_name, updated_at
from public.schools
where code in (select code from expected_school_blocks);

insert into public.schools as target (name, code, block_name)
select source.name, source.code, source.block_name
from imported_school_snapshot as source
on conflict (code) do update
set name = excluded.name,
    block_name = excluded.block_name
where (target.name, target.block_name)
  is distinct from (excluded.name, excluded.block_name);

select extensions.is(
  (
    select count(*)
    from public.schools as school
    join imported_school_snapshot as snapshot using (code)
    where school.updated_at is distinct from snapshot.updated_at
  ),
  0::bigint,
  'rerunning the directory upsert does not churn updated_at values'
);

select * from extensions.finish();
rollback;
