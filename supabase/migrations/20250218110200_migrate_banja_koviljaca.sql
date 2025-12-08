begin;

with loznica as (
  select id from cities where name = 'Лозница' limit 1
), banja_city as (
  select id
  from cities
  where name ilike '%баня кови%'
     or name ilike '%баниа кови%'
     or name ilike '%banja kovi%'
  limit 1
), banja_district as (
  select id
  from districts
  where name = 'Бања Ковиљача'
    and city_id = (select id from loznica)
  limit 1
)
update properties p
set city_id = (select id from loznica),
    district_id = (select id from banja_district)
where p.city_id = (select id from banja_city)
  and (select id from loznica) is not null
  and (select id from banja_district) is not null;

with banja_city as (
  select id
  from cities
  where name ilike '%баня кови%'
     or name ilike '%баниа кови%'
     or name ilike '%banja kovi%'
  limit 1
)
update cities
set name = '[ARCHIVED] ' || name
where id in (select id from banja_city)
  and name not like '[ARCHIVED]%';

commit;

-- Откат: вернуть названия города и city_id в properties из бэкапа или отменить транзакцию (rollback).
