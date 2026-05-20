export const CONTACTS = {
  phone: "+7 (495) 226-15-73",
  phoneRaw: "+74952261573",
  phoneAlt: "+7 (985) 226-15-73",
  phoneAltRaw: "+79852261573",
  whatsapp: "+79852261573",
  telegram: "@da_drycleaning",
  email: "da-drycleaning@mail.ru",
  address: "г. Москва, Ферганский проезд, 7, корп. 4, стр. 1",
  schedule: "Пн-Вс 09:00–21:00",
  yandexMaps:
    "https://yandex.com/maps/org/drycleaning_d_a/159613944902/",
} as const;

export const NAV_LINKS = [
  { label: "Услуги", href: "#services" },
  { label: "Организациям", href: "#b2b" },
  { label: "О компании", href: "#about" },
  { label: "Отзывы", href: "#reviews" },
  { label: "Контакты", href: "#cta-form" },
] as const;

export const SERVICES = [
  {
    id: 1,
    title: "Химчистка диванов",
    slug: "himchistka-divanov",
    description:
      "Профессиональная чистка диванов любых типов и размеров. Удаление пятен, запахов, восстановление цвета.",
    image: "/images/services/sofa.jpg",
  },
  {
    id: 2,
    title: "Химчистка ковров",
    slug: "himchistka-kovrov",
    description:
      "Глубокая чистка ковров с выездом на дом. Возвращаем первоначальный вид и свежесть.",
    image: "/images/services/carpet.jpg",
  },
  {
    id: 3,
    title: "Химчистка матрасов",
    slug: "himchistka-matrasov",
    description:
      "Дезинфекция и глубокая чистка матрасов. Удаление клещей, пятен, аллергенов.",
    image: "/images/services/mattress.jpg",
  },
  {
    id: 4,
    title: "Химчистка авто",
    slug: "himchistka-salona-avtomobilya",
    description:
      "Чистка салона автомобиля: сиденья, потолок, коврики. Как из автосалона.",
    image: "/images/services/car.jpg",
  },
  {
    id: 5,
    title: "Химчистка штор",
    slug: "himchistka-shtor",
    description:
      "Бережная чистка штор и тюлей без снятия с карниза. Сохраняем форму и цвет.",
    image: "/images/services/curtains.jpg",
  },
  {
    id: 6,
    title: "Химчистка ковролина",
    slug: "himchistka-kovrolina",
    description:
      "Промышленная чистка ковролина в квартирах, офисах и коммерческих помещениях.",
    image: "/images/services/carpet-floor.jpg",
  },
] as const;

export const B2B_CATEGORIES = [
  { title: "Офисы", slug: "khimchistka-mebeli-v-ofisakh" },
  { title: "Рестораны", slug: "khimchistka-mebeli-v-restoranakh-kafe" },
  { title: "Школы", slug: "khimchistka-mebeli-v-shkolakh" },
  { title: "Дет. сады", slug: "himchistka-kovrov-v-detskih-sadah" },
] as const;

export const REVIEWS = [
  {
    id: 1,
    author: "Ольга",
    service: "химчистка дивана",
    rating: 5,
    text: "Чистили угловой диван. Ребята просто спасли его. Не думала, что он будет когда-нибудь выглядеть как прежде. Спасибо!",
  },
  {
    id: 2,
    author: "Анна",
    service: "химчистка ковра",
    rating: 5,
    text: "Ковёр после чистки как новенький! Спасибо ещё раз за новую жизнь моему ковру!",
  },
  {
    id: 3,
    author: "Дмитрий",
    service: "химчистка матраса",
    rating: 5,
    text: "Мастер приехал вовремя, всё сделал быстро и качественно. Матрас стал пахнуть свежестью. Рекомендую!",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Сколько стоит химчистка дивана?",
    answer:
      "Стоимость зависит от размера и состояния дивана. Ориентировочно от 3 000 руб. Точную стоимость мастер озвучит после осмотра.",
  },
  {
    question: "Как быстро приедет мастер?",
    answer:
      "Срочный выезд — в течение 1-2 часов. Стандартный — в удобное для вас время, по записи.",
  },
  {
    question: "Нужна ли предоплата?",
    answer:
      "Нет, оплата только по факту выполнения работ и вашей приёмки результата.",
  },
  {
    question: "Безопасна ли химия для детей и животных?",
    answer:
      "Да, мы используем профессиональные гипоаллергенные средства, безопасные для детей и домашних животных.",
  },
  {
    question: "Что если результат не устроит?",
    answer:
      "Мы даём гарантию на все виды работ. Если результат вас не устроит — бесплатно переделаем или вернём деньги.",
  },
  {
    question: "Работаете по Московской области?",
    answer:
      "Да, выезжаем по всей Москве и Московской области. Стоимость выезда за МКАД уточняйте у менеджера.",
  },
] as const;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
