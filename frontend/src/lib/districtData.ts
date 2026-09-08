export type District = {
  name: string;
  namePrepositional: string;
  slug: string;
  okrug: string;
  metro: string[];
};

export const OKRUGS = [
  "ЦАО",
  "САО",
  "СВАО",
  "ВАО",
  "ЮВАО",
  "ЮАО",
  "ЮЗАО",
  "ЗАО",
  "СЗАО",
  "ЗелАО",
] as const;

export const DISTRICTS: District[] = [
  { name: "Арбат", namePrepositional: "на Арбате", slug: "arbat", okrug: "ЦАО", metro: ["Арбатская", "Смоленская"] },
  { name: "Басманный", namePrepositional: "в Басманном", slug: "basmanny", okrug: "ЦАО", metro: ["Курская", "Бауманская"] },
  { name: "Замоскворечье", namePrepositional: "в Замоскворечье", slug: "zamoskvorechye", okrug: "ЦАО", metro: ["Новокузнецкая", "Павелецкая"] },
  { name: "Красносельский", namePrepositional: "в Красносельском", slug: "krasnoselsky", okrug: "ЦАО", metro: ["Красносельская", "Комсомольская"] },
  { name: "Мещанский", namePrepositional: "в Мещанском", slug: "meshchansky", okrug: "ЦАО", metro: ["Проспект Мира", "Сухаревская"] },
  { name: "Пресненский", namePrepositional: "в Пресненском", slug: "presnensky", okrug: "ЦАО", metro: ["Улица 1905 года", "Деловой центр"] },
  { name: "Таганский", namePrepositional: "в Таганском", slug: "tagansky", okrug: "ЦАО", metro: ["Таганская", "Марксистская"] },
  { name: "Тверской", namePrepositional: "в Тверском", slug: "tverskoy", okrug: "ЦАО", metro: ["Маяковская", "Пушкинская"] },
  { name: "Хамовники", namePrepositional: "в Хамовниках", slug: "khamovniki", okrug: "ЦАО", metro: ["Спортивная", "Фрунзенская"] },
  { name: "Якиманка", namePrepositional: "на Якиманке", slug: "yakimanka", okrug: "ЦАО", metro: ["Полянка", "Третьяковская"] },

  { name: "Аэропорт", namePrepositional: "в Аэропорту", slug: "aeroport", okrug: "САО", metro: ["Аэропорт", "Динамо"] },
  { name: "Беговой", namePrepositional: "в Беговом", slug: "begovoy", okrug: "САО", metro: ["Беговая", "Полежаевская"] },
  { name: "Бескудниковский", namePrepositional: "в Бескудниковском", slug: "beskudnikovsky", okrug: "САО", metro: ["Бескудниково"] },
  { name: "Войковский", namePrepositional: "в Войковском", slug: "voikovsky", okrug: "САО", metro: ["Водный стадион", "Войковская"] },
  { name: "Восточное Дегунино", namePrepositional: "в Восточном Дегунине", slug: "vostochnoe-degunino", okrug: "САО", metro: ["Селигерская"] },
  { name: "Головинский", namePrepositional: "в Головинском", slug: "golovinsky", okrug: "САО", metro: ["Водный стадион", "Головинская"] },
  { name: "Дмитровский", namePrepositional: "в Дмитровском", slug: "dmitrovsky", okrug: "САО", metro: ["Яхромская", "Физтех"] },
  { name: "Западное Дегунино", namePrepositional: "в Западном Дегунине", slug: "zapadnoe-degunino", okrug: "САО", metro: ["Селигерская", "Верхние Лихоборы"] },
  { name: "Коптево", namePrepositional: "в Коптеве", slug: "koptevo", okrug: "САО", metro: ["Верхние Лихоборы", "МЦК Коптево"] },
  { name: "Левобережный", namePrepositional: "в Левобережном", slug: "levoberezhny", okrug: "САО", metro: ["Речной вокзал", "Беломорская"] },
  { name: "Молжаниновский", namePrepositional: "в Молжаниновском", slug: "molzhaninovsky", okrug: "САО", metro: ["МЦД Ховрино"] },
  { name: "Савёловский", namePrepositional: "в Савёловском", slug: "savelevsky", okrug: "САО", metro: ["Савёловская"] },
  { name: "Сокол", namePrepositional: "в Соколе", slug: "sokol", okrug: "САО", metro: ["Сокол", "Аэропорт"] },
  { name: "Тимирязевский", namePrepositional: "в Тимирязевском", slug: "timiryazevsky", okrug: "САО", metro: ["Тимирязевская", "Петровско-Разумовская"] },
  { name: "Ховрино", namePrepositional: "в Ховрино", slug: "hovrino", okrug: "САО", metro: ["Ховрино", "Беломорская"] },
  { name: "Хорошёвский", namePrepositional: "в Хорошёвском", slug: "khoroshevsky", okrug: "САО", metro: ["Полежаевская", "Хорошёво"] },

  { name: "Алексеевский", namePrepositional: "в Алексеевском", slug: "alekseevsky", okrug: "СВАО", metro: ["ВДНХ", "Алексеевская"] },
  { name: "Алтуфьевский", namePrepositional: "в Алтуфьевском", slug: "altufyevsky", okrug: "СВАО", metro: ["Алтуфьево", "Бибирево"] },
  { name: "Бабушкинский", namePrepositional: "в Бабушкинском", slug: "babushkinsky", okrug: "СВАО", metro: ["Бабушкинская", "Свиблово"] },
  { name: "Бибирево", namePrepositional: "в Бибиреве", slug: "bibirevo", okrug: "СВАО", metro: ["Бибирево"] },
  { name: "Бутырский", namePrepositional: "в Бутырском", slug: "butyrsky", okrug: "СВАО", metro: ["Фонвизинская", "Бутырская"] },
  { name: "Лианозово", namePrepositional: "в Лианозове", slug: "lianozovo", okrug: "СВАО", metro: ["Алтуфьево", "МЦД Лианозово"] },
  { name: "Лосиноостровский", namePrepositional: "в Лосиноостровском", slug: "losinoostrovsky", okrug: "СВАО", metro: ["Бабушкинская", "МЦД Лосиноостровская"] },
  { name: "Марфино", namePrepositional: "в Марфине", slug: "marfino", okrug: "СВАО", metro: ["МЦД Останкино", "Ботанический сад"] },
  { name: "Марьина роща", namePrepositional: "в Марьиной роще", slug: "marina-roscha", okrug: "СВАО", metro: ["Марьина Роща", "Достоевская"] },
  { name: "Останкинский", namePrepositional: "в Останкинском", slug: "ostankinsky", okrug: "СВАО", metro: ["ВДНХ", "МЦД Останкино"] },
  { name: "Отрадное", namePrepositional: "в Отрадном", slug: "otradnoe", okrug: "СВАО", metro: ["Отрадное", "Владыкино"] },
  { name: "Ростокино", namePrepositional: "в Ростокине", slug: "rostokino", okrug: "СВАО", metro: ["МЦД Ростокино", "Ботанический сад"] },
  { name: "Свиблово", namePrepositional: "в Свиблове", slug: "sviblovo", okrug: "СВАО", metro: ["Свиблово"] },
  { name: "Северное Медведково", namePrepositional: "в Северном Медведкове", slug: "severnoe-medvedkovo", okrug: "СВАО", metro: ["Медведково"] },
  { name: "Северный", namePrepositional: "в Северном", slug: "severny", okrug: "СВАО", metro: ["МЦД Челобитьево"] },
  { name: "Южное Медведково", namePrepositional: "в Южном Медведкове", slug: "yuzhnoe-medvedkovo", okrug: "СВАО", metro: ["Бабушкинская", "Свиблово"] },
  { name: "Ярославский", namePrepositional: "в Ярославском", slug: "yaroslavsky", okrug: "СВАО", metro: ["Свиблово", "МЦД Лосиноостровская"] },

  { name: "Богородское", namePrepositional: "в Богородском", slug: "bogorodskoe", okrug: "ВАО", metro: ["Преображенская площадь", "Бульвар Рокоссовского"] },
  { name: "Вешняки", namePrepositional: "в Вешняках", slug: "veshnyaki", okrug: "ВАО", metro: ["Вешняки", "Рязанский проспект"] },
  { name: "Восточное Измайлово", namePrepositional: "в Восточном Измайлове", slug: "vostochnoe-izmailovo", okrug: "ВАО", metro: ["Первомайская", "Щёлковская"] },
  { name: "Восточный", namePrepositional: "в Восточном", slug: "vostochny", okrug: "ВАО", metro: ["МЦД Восточный"] },
  { name: "Гольяново", namePrepositional: "в Гольянове", slug: "golyanovo", okrug: "ВАО", metro: ["Щёлковская", "Первомайская"] },
  { name: "Ивановское", namePrepositional: "в Ивановском", slug: "ivanovskoe", okrug: "ВАО", metro: ["Новогиреево", "Новокосино"] },
  { name: "Измайлово", namePrepositional: "в Измайлове", slug: "izmailovo", okrug: "ВАО", metro: ["Партизанская", "Измайловская"] },
  { name: "Косино-Ухтомский", namePrepositional: "в Косино-Ухтомском", slug: "kosino-uhtomsky", okrug: "ВАО", metro: ["Лухмановская", "Некрасовка"] },
  { name: "Метрогородок", namePrepositional: "в Метрогородке", slug: "metrogorodok", okrug: "ВАО", metro: ["Бульвар Рокоссовского", "Черкизовская"] },
  { name: "Новогиреево", namePrepositional: "в Новогирееве", slug: "novogireevo", okrug: "ВАО", metro: ["Новогиреево", "Перово"] },
  { name: "Новокосино", namePrepositional: "в Новокосине", slug: "novokosino", okrug: "ВАО", metro: ["Новокосино"] },
  { name: "Перово", namePrepositional: "в Перове", slug: "perovo", okrug: "ВАО", metro: ["Перово", "Шоссе Энтузиастов"] },
  { name: "Преображенское", namePrepositional: "в Преображенском", slug: "preobrazhenskoe", okrug: "ВАО", metro: ["Преображенская площадь", "Бульвар Рокоссовского"] },
  { name: "Северное Измайлово", namePrepositional: "в Северном Измайлове", slug: "severnoe-izmailovo", okrug: "ВАО", metro: ["Щёлковская", "Первомайская"] },
  { name: "Соколиная Гора", namePrepositional: "на Соколиной Горе", slug: "sokolinaya-gora", okrug: "ВАО", metro: ["Семёновская", "Электрозаводская"] },
  { name: "Сокольники", namePrepositional: "в Сокольниках", slug: "sokolniki", okrug: "ВАО", metro: ["Сокольники", "Красносельская"] },

  { name: "Выхино-Жулебино", namePrepositional: "в Выхино-Жулебине", slug: "vyhino-zhulebino", okrug: "ЮВАО", metro: ["Выхино", "Лермонтовский проспект"] },
  { name: "Капотня", namePrepositional: "в Капотне", slug: "kapotnya", okrug: "ЮВАО", metro: ["МЦК ЗИЛ"] },
  { name: "Кузьминки", namePrepositional: "в Кузьминках", slug: "kuzminki", okrug: "ЮВАО", metro: ["Кузьминки", "Волжская"] },
  { name: "Лефортово", namePrepositional: "в Лефортове", slug: "lefortovo", okrug: "ЮВАО", metro: ["Авиамоторная", "Площадь Ильича"] },
  { name: "Люблино", namePrepositional: "в Люблине", slug: "lyublino", okrug: "ЮВАО", metro: ["Люблино", "Волжская"] },
  { name: "Марьино", namePrepositional: "в Марьине", slug: "marino", okrug: "ЮВАО", metro: ["Марьино", "Братиславская"] },
  { name: "Некрасовка", namePrepositional: "в Некрасовке", slug: "nekrasovka", okrug: "ЮВАО", metro: ["Некрасовка", "Лухмановская"] },
  { name: "Нижегородский", namePrepositional: "в Нижегородском", slug: "nizhegorodsky", okrug: "ЮВАО", metro: ["Нижегородская", "МЦК Нижегородская"] },
  { name: "Печатники", namePrepositional: "в Печатниках", slug: "pechatniki", okrug: "ЮВАО", metro: ["Печатники", "Волжская"] },
  { name: "Рязанский", namePrepositional: "в Рязанском", slug: "ryazansky", okrug: "ЮВАО", metro: ["Рязанский проспект", "Выхино"] },
  { name: "Текстильщики", namePrepositional: "в Текстильщиках", slug: "tekstilshiki", okrug: "ЮВАО", metro: ["Текстильщики", "Волжская"] },
  { name: "Южнопортовый", namePrepositional: "в Южнопортовом", slug: "yuzhnoportovy", okrug: "ЮВАО", metro: ["Кожуховская", "Дубровка"] },

  { name: "Бирюлёво Восточное", namePrepositional: "в Восточном Бирюлёве", slug: "biryulevo-vostochnoe", okrug: "ЮАО", metro: ["МЦД Бирюлёво-Пассажирская", "Царицыно"] },
  { name: "Бирюлёво Западное", namePrepositional: "в Западном Бирюлёве", slug: "biryulevo-zapadnoe", okrug: "ЮАО", metro: ["МЦД Бирюлёво-Товарная"] },
  { name: "Братеево", namePrepositional: "в Братееве", slug: "brateevo", okrug: "ЮАО", metro: ["Борисово", "Алма-Атинская"] },
  { name: "Даниловский", namePrepositional: "в Даниловском", slug: "danilovsky", okrug: "ЮАО", metro: ["Тульская", "МЦК Верхние Котлы"] },
  { name: "Донской", namePrepositional: "в Донском", slug: "donskoy", okrug: "ЮАО", metro: ["Шаболовская", "МЦК Крымская"] },
  { name: "Зябликово", namePrepositional: "в Зябликове", slug: "zyablikovo", okrug: "ЮАО", metro: ["Красногвардейская", "Зябликово"] },
  { name: "Москворечье-Сабурово", namePrepositional: "в Москворечье-Сабурове", slug: "moskvoreche-saburovo", okrug: "ЮАО", metro: ["Варшавская", "Каширская"] },
  { name: "Нагатино-Садовники", namePrepositional: "в Нагатино-Садовниках", slug: "nagatino-sadovniki", okrug: "ЮАО", metro: ["Нагатинская", "МЦК Верхние Котлы"] },
  { name: "Нагатинский Затон", namePrepositional: "в Нагатинском Затоне", slug: "nagatinsky-zaton", okrug: "ЮАО", metro: ["Коломенская", "МЦК ЗИЛ"] },
  { name: "Нагорный", namePrepositional: "в Нагорном", slug: "nagorny", okrug: "ЮАО", metro: ["Нагорная", "Нахимовский проспект"] },
  { name: "Орехово-Борисово Северное", namePrepositional: "в Северном Орехове-Борисове", slug: "orehovo-borisovo-severnoe", okrug: "ЮАО", metro: ["Орехово", "Царицыно"] },
  { name: "Орехово-Борисово Южное", namePrepositional: "в Южном Орехове-Борисове", slug: "orehovo-borisovo-yuzhnoe", okrug: "ЮАО", metro: ["Красногвардейская", "Домодедовская"] },
  { name: "Царицыно", namePrepositional: "в Царицыне", slug: "tsaritsyno", okrug: "ЮАО", metro: ["Царицыно", "Орехово"] },
  { name: "Чертаново Северное", namePrepositional: "в Северном Чертанове", slug: "chertanovo-severnoe", okrug: "ЮАО", metro: ["Севастопольская", "Нахимовский проспект"] },
  { name: "Чертаново Центральное", namePrepositional: "в Центральном Чертанове", slug: "chertanovo-tsentralnoe", okrug: "ЮАО", metro: ["Чертановская", "Пражская"] },
  { name: "Чертаново Южное", namePrepositional: "в Южном Чертанове", slug: "chertanovo-yuzhnoe", okrug: "ЮАО", metro: ["Улица Академика Янгеля", "Аннино"] },

  { name: "Академический", namePrepositional: "в Академическом", slug: "akademichesky", okrug: "ЮЗАО", metro: ["Профсоюзная", "Академическая"] },
  { name: "Гагаринский", namePrepositional: "в Гагаринском", slug: "gagarinsky", okrug: "ЮЗАО", metro: ["Университет"] },
  { name: "Зюзино", namePrepositional: "в Зюзине", slug: "zyuzino", okrug: "ЮЗАО", metro: ["Севастопольский проспект", "Каховская"] },
  { name: "Коньково", namePrepositional: "в Конькове", slug: "konkovo", okrug: "ЮЗАО", metro: ["Коньково", "Беляево"] },
  { name: "Котловка", namePrepositional: "в Котловке", slug: "kotlovka", okrug: "ЮЗАО", metro: ["МЦК Площадь Гагарина", "Ленинский проспект"] },
  { name: "Ломоносовский", namePrepositional: "в Ломоносовском", slug: "lomonosovsky", okrug: "ЮЗАО", metro: ["Университет", "Проспект Вернадского"] },
  { name: "Обручевский", namePrepositional: "в Обручевском", slug: "obruchevsky", okrug: "ЮЗАО", metro: ["Калужская", "Битцевский парк"] },
  { name: "Северное Бутово", namePrepositional: "в Северном Бутове", slug: "severnoe-butovo", okrug: "ЮЗАО", metro: ["Бульвар Дмитрия Донского"] },
  { name: "Тёплый Стан", namePrepositional: "в Тёплом Стане", slug: "teply-stan", okrug: "ЮЗАО", metro: ["Тёплый Стан", "Коньково"] },
  { name: "Черёмушки", namePrepositional: "в Черёмушках", slug: "cheremushki", okrug: "ЮЗАО", metro: ["Новые Черёмушки", "Профсоюзная"] },
  { name: "Южное Бутово", namePrepositional: "в Южном Бутове", slug: "yuzhnoe-butovo", okrug: "ЮЗАО", metro: ["Улица Скобелевская", "Бульвар адмирала Ушакова"] },
  { name: "Ясенево", namePrepositional: "в Ясеневе", slug: "yasenevo", okrug: "ЮЗАО", metro: ["Ясенево", "Новоясеневская"] },

  { name: "Дорогомилово", namePrepositional: "в Дорогомилове", slug: "dorogomilovo", okrug: "ЗАО", metro: ["Кутузовская", "Киевская"] },
  { name: "Крылатское", namePrepositional: "в Крылатском", slug: "krylatskoe", okrug: "ЗАО", metro: ["Крылатское", "Молодёжная"] },
  { name: "Кунцево", namePrepositional: "в Кунцеве", slug: "kuncevo", okrug: "ЗАО", metro: ["Кунцевская", "Молодёжная"] },
  { name: "Можайский", namePrepositional: "в Можайском", slug: "mozhaysky", okrug: "ЗАО", metro: ["Кунцевская", "Славянский бульвар"] },
  { name: "Ново-Переделкино", namePrepositional: "в Ново-Переделкине", slug: "novo-peredelkino", okrug: "ЗАО", metro: ["Новопеределкино", "Солнцево"] },
  { name: "Очаково-Матвеевское", namePrepositional: "в Очаково-Матвеевском", slug: "ochakovo-matveevskoe", okrug: "ЗАО", metro: ["Мичуринский проспект", "Озёрная"] },
  { name: "Раменки", namePrepositional: "в Раменках", slug: "ramenki", okrug: "ЗАО", metro: ["Раменки", "Ломоносовский проспект"] },
  { name: "Солнцево", namePrepositional: "в Солнцеве", slug: "solncevo", okrug: "ЗАО", metro: ["Солнцево", "Новопеределкино"] },
  { name: "Тропарёво-Никулино", namePrepositional: "в Тропарёво-Никулино", slug: "troparevo-nikulino", okrug: "ЗАО", metro: ["Тропарёво", "Юго-Западная"] },
  { name: "Фили-Давыдково", namePrepositional: "в Фили-Давыдково", slug: "fili-davydkovo", okrug: "ЗАО", metro: ["Давыдково", "Фили"] },
  { name: "Филёвский Парк", namePrepositional: "в Филёвском Парке", slug: "filevsky-park", okrug: "ЗАО", metro: ["Фили", "Филёвский парк"] },
  { name: "Внуково", namePrepositional: "во Внукове", slug: "vnukovo", okrug: "ЗАО", metro: ["Аэропорт Внуково"] },

  { name: "Куркино", namePrepositional: "в Куркине", slug: "kurkino", okrug: "СЗАО", metro: ["Пятницкое шоссе"] },
  { name: "Митино", namePrepositional: "в Митине", slug: "mitino", okrug: "СЗАО", metro: ["Митино", "Пятницкое шоссе"] },
  { name: "Покровское-Стрешнево", namePrepositional: "в Покровском-Стрешневе", slug: "pokrovskoe-streshnevo", okrug: "СЗАО", metro: ["МЦД Покровское-Стрешнево", "Тушинская"] },
  { name: "Северное Тушино", namePrepositional: "в Северном Тушино", slug: "severnoe-tushino", okrug: "СЗАО", metro: ["Планерная", "Сходненская"] },
  { name: "Строгино", namePrepositional: "в Строгине", slug: "strogino", okrug: "СЗАО", metro: ["Строгино", "Щукинская"] },
  { name: "Хорошёво-Мнёвники", namePrepositional: "в Хорошёве-Мнёвниках", slug: "khoroshevo-mnevniki", okrug: "СЗАО", metro: ["МЦК Хорошёво", "Народное Ополчение"] },
  { name: "Щукино", namePrepositional: "в Щукине", slug: "shukino", okrug: "СЗАО", metro: ["Щукинская", "Октябрьское поле"] },
  { name: "Южное Тушино", namePrepositional: "в Южном Тушино", slug: "yuzhnoe-tushino", okrug: "СЗАО", metro: ["Тушинская", "Сходненская"] },

  { name: "Крюково", namePrepositional: "в Крюкове", slug: "kryukovo", okrug: "ЗелАО", metro: ["МЦД Крюково"] },
  { name: "Матушкино", namePrepositional: "в Матушкине", slug: "matushkino", okrug: "ЗелАО", metro: ["МЦД Крюково"] },
  { name: "Савёлки", namePrepositional: "в Савёлках", slug: "savyolki", okrug: "ЗелАО", metro: ["МЦД Крюково"] },
  { name: "Силино", namePrepositional: "в Силине", slug: "silino", okrug: "ЗелАО", metro: ["МЦД Крюково"] },
  { name: "Старое Крюково", namePrepositional: "в Старом Крюкове", slug: "staroe-kryukovo", okrug: "ЗелАО", metro: ["МЦД Крюково"] },
];

export function getDistrictBySlug(slug: string): District | undefined {
  return DISTRICTS.find((d) => d.slug === slug);
}

export function getAllDistrictSlugs(): string[] {
  return DISTRICTS.map((d) => d.slug);
}

export function getDistrictsByOkrug(okrug: string): District[] {
  return DISTRICTS.filter((d) => d.okrug === okrug);
}

export function getOtherDistricts(slug: string, count = 6): District[] {
  const district = getDistrictBySlug(slug);
  if (!district) return [];
  return getDistrictsByOkrug(district.okrug)
    .filter((d) => d.slug !== slug)
    .slice(0, count);
}
