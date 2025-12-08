begin;

-- Районы для Лозницы и городов-спутников
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Центар', c.id, true, 1, '44.5333', '19.2256'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Центар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Лозничко поље', c.id, true, 2, '44.5400', '19.2300'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Лозничко поље' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Клупци', c.id, true, 3, '44.5200', '19.2100'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Клупци' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Тршић', c.id, true, 4, '44.4667', '19.1667'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Тршић' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Коренита', c.id, true, 5, '44.5100', '19.2400'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Коренита' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Јадар', c.id, true, 6, '44.4800', '19.2800'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Јадар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Бања Ковиљача', c.id, true, 10, '44.5147', '19.1433'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Бања Ковиљача' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Ковиљача Бања', c.id, true, 11, '44.5147', '19.1433'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Ковиљача Бања' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Мали Зворник', c.id, true, 12, '44.3964', '19.1122'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Мали Зворник' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Љубовија', c.id, true, 13, '44.1875', '19.3781'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Љубовија' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Крупањ', c.id, true, 14, '44.3667', '19.3667'
from cities c
where c.name = 'Лозница'
  and not exists (select 1 from districts d where d.name = 'Крупањ' and d.city_id = c.id);

-- Районы Белграда
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Стари Град', c.id, true, 1, '44.8184', '20.4586'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Стари Град' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Врачар', c.id, true, 2, '44.7969', '20.4822'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Врачар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Савски Венац', c.id, true, 3, '44.7903', '20.4467'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Савски Венац' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Палилула', c.id, true, 4, '44.8200', '20.4800'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Палилула' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Звездара', c.id, true, 5, '44.7833', '20.5167'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Звездара' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Вождовац', c.id, true, 6, '44.7500', '20.4833'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Вождовац' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Нови Београд', c.id, true, 7, '44.8058', '20.4097'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Нови Београд' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Земун', c.id, true, 8, '44.8439', '20.4011'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Земун' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Чукарица', c.id, true, 9, '44.7500', '20.3667'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Чукарица' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Раковица', c.id, true, 10, '44.7333', '20.4167'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Раковица' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Сурчин', c.id, true, 11, '44.7906', '20.2833'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Сурчин' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Барајево', c.id, true, 12, '44.6000', '20.4167'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Барајево' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Гроцка', c.id, true, 13, '44.6667', '20.7167'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Гроцка' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Лазаревац', c.id, true, 14, '44.3833', '20.2500'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Лазаревац' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Младеновац', c.id, true, 15, '44.4333', '20.7000'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Младеновац' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Обреновац', c.id, true, 16, '44.6500', '20.2000'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Обреновац' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Сопот', c.id, true, 17, '44.5167', '20.5833'
from cities c
where c.name = 'Белград'
  and not exists (select 1 from districts d where d.name = 'Сопот' and d.city_id = c.id);

-- Районы Нови-Сада
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Центар', c.id, true, 1, '45.2517', '19.8369'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Центар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Детелинара', c.id, true, 2, '45.2600', '19.8100'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Детелинара' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Лиман', c.id, true, 3, '45.2400', '19.8300'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Лиман' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Ново Насеље', c.id, true, 4, '45.2600', '19.7900'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Ново Насеље' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Подбара', c.id, true, 5, '45.2550', '19.8450'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Подбара' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Роткварија', c.id, true, 6, '45.2500', '19.8500'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Роткварија' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Салајка', c.id, true, 7, '45.2650', '19.8200'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Салајка' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Телеп', c.id, true, 8, '45.2350', '19.8100'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Телеп' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Футог', c.id, true, 9, '45.2397', '19.7217'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Футог' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Петроварадин', c.id, true, 10, '45.2483', '19.8614'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Петроварадин' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Сремска Каменица', c.id, true, 11, '45.2217', '19.8383'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Сремска Каменица' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Ветерник', c.id, true, 12, '45.2536', '19.7683'
from cities c
where c.name = 'Нови-Сад'
  and not exists (select 1 from districts d where d.name = 'Ветерник' and d.city_id = c.id);

-- Районы Ниша
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Центар', c.id, true, 1, '43.3209', '21.8958'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Центар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Медијана', c.id, true, 2, '43.3150', '21.8850'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Медијана' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Палилула', c.id, true, 3, '43.3350', '21.9150'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Палилула' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Пантелеј', c.id, true, 4, '43.3100', '21.9200'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Пантелеј' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Црвени Крст', c.id, true, 5, '43.3050', '21.8700'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Црвени Крст' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Нишка Бања', c.id, true, 6, '43.2850', '21.9550'
from cities c
where c.name = 'Ниш'
  and not exists (select 1 from districts d where d.name = 'Нишка Бања' and d.city_id = c.id);

-- Районы Крагуевца
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Центар', c.id, true, 1, '44.0128', '20.9114'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Центар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Аеродром', c.id, true, 2, '44.0200', '20.9300'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Аеродром' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Станово', c.id, true, 3, '44.0050', '20.9000'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Станово' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Сушица', c.id, true, 4, '44.0250', '20.9050'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Сушица' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Ердеч', c.id, true, 5, '44.0000', '20.9200'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Ердеч' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Бресница', c.id, true, 6, '43.9950', '20.8900'
from cities c
where c.name = 'Крагуевац'
  and not exists (select 1 from districts d where d.name = 'Бресница' and d.city_id = c.id);

-- Районы Суботицы
insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Центар', c.id, true, 1, '46.1000', '19.6650'
from cities c
where c.name = 'Суботица'
  and not exists (select 1 from districts d where d.name = 'Центар' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Мали Бајмок', c.id, true, 2, '46.0900', '19.6500'
from cities c
where c.name = 'Суботица'
  and not exists (select 1 from districts d where d.name = 'Мали Бајмок' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Нови Град', c.id, true, 3, '46.1050', '19.6750'
from cities c
where c.name = 'Суботица'
  and not exists (select 1 from districts d where d.name = 'Нови Град' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Палић', c.id, true, 4, '46.1017', '19.7550'
from cities c
where c.name = 'Суботица'
  and not exists (select 1 from districts d where d.name = 'Палић' and d.city_id = c.id);

insert into districts (name, city_id, is_active, sort_order, latitude, longitude)
select 'Бајмок', c.id, true, 5, '45.9667', '19.3833'
from cities c
where c.name = 'Суботица'
  and not exists (select 1 from districts d where d.name = 'Бајмок' and d.city_id = c.id);

commit;

-- Откат: удалить добавленные районы вручную или выполнить truncate с нужными условиями.
