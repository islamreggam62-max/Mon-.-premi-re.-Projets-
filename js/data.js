/* بيانات المتجر: التصنيفات والمنتجات.
   لا يوجد خادم — كل شيء يعمل في المتصفح. */

const CATEGORIES = [
  { id: 'all',    name: 'كل المنتجات' },
  { id: 'tech',   name: 'إلكترونيات' },
  { id: 'home',   name: 'المنزل' },
  { id: 'office', name: 'المكتب' }
];

const PRODUCTS = [
  {
    id: 'p-01',
    name: 'سماعات لاسلكية Aura',
    category: 'tech',
    price: 3700,
    oldPrice: 4800,
    rating: 4.8,
    reviews: 214,
    stock: 12,
    image: 'assets/img/headphones.svg',
    short: 'عزل ضوضاء نشط و30 ساعة استماع.',
    description:
      'سماعات فوق الأذن بعزل ضوضاء نشط، بطارية تدوم 30 ساعة، وشحن سريع يمنحك 4 ساعات في 10 دقائق. ' +
      'وسائد ذاكرة قابلة للتبديل واتصال بجهازين في الوقت نفسه.',
    features: ['عزل ضوضاء نشط', 'بطارية 30 ساعة', 'بلوتوث 5.3', 'اتصال مزدوج']
  },
  {
    id: 'p-02',
    name: 'ساعة ذكية Pulse',
    category: 'tech',
    price: 6000,
    oldPrice: null,
    rating: 4.5,
    reviews: 138,
    stock: 7,
    image: 'assets/img/watch.svg',
    short: 'تتبّع النوم ونبض القلب وGPS مدمج.',
    description:
      'ساعة رياضية بشاشة AMOLED مقاس 1.4 بوصة، مقاومة للماء حتى 50 مترًا، مع تتبّع النوم ومعدل النبض ' +
      'وأكثر من 100 نمط تمرين. البطارية تكفي أسبوعًا كاملًا.',
    features: ['شاشة AMOLED', 'GPS مدمج', 'مقاومة 5ATM', 'بطارية 7 أيام']
  },
  {
    id: 'p-03',
    name: 'لوحة مفاتيح ميكانيكية K2',
    category: 'office',
    price: 4300,
    oldPrice: 5200,
    rating: 4.7,
    reviews: 96,
    stock: 20,
    image: 'assets/img/keyboard.svg',
    short: 'مفاتيح قابلة للتبديل وإضاءة خلفية.',
    description:
      'لوحة مفاتيح بحجم 75% مع مفاتيح ساخنة قابلة للتبديل، هيكل ألمنيوم، وإضاءة خلفية بيضاء متدرجة. ' +
      'تعمل سلكيًا ولاسلكيًا مع ثلاثة أجهزة محفوظة.',
    features: ['هيكل ألمنيوم', 'مفاتيح قابلة للتبديل', 'اتصال بثلاثة أجهزة', 'USB-C']
  },
  {
    id: 'p-04',
    name: 'مكبّر صوت محمول Echo Mini',
    category: 'tech',
    price: 2700,
    oldPrice: null,
    rating: 4.3,
    reviews: 61,
    stock: 0,
    image: 'assets/img/speaker.svg',
    short: 'صوت 360° ومقاومة للماء IPX7.',
    description:
      'مكبّر صوت صغير بصوت محيطي 360 درجة ومقاومة كاملة للماء، يصلح للرحلات والشاطئ. ' +
      'يمكن ربط مكبّرين معًا للحصول على صوت ستيريو.',
    features: ['صوت 360°', 'IPX7', 'بطارية 16 ساعة', 'ربط ستيريو']
  },
  {
    id: 'p-05',
    name: 'مصباح مكتب Lumen',
    category: 'home',
    price: 2200,
    oldPrice: 3000,
    rating: 4.6,
    reviews: 172,
    stock: 15,
    image: 'assets/img/lamp.svg',
    short: 'إضاءة قابلة للتعديل بخمس درجات حرارة.',
    description:
      'مصباح LED بذراع متحرك، خمس درجات لحرارة اللون وعشر مستويات سطوع، مع منفذ شحن USB في القاعدة ' +
      'ومؤقّت نوم لمدة ساعة.',
    features: ['5 درجات حرارة لون', '10 مستويات سطوع', 'منفذ شحن USB', 'مؤقّت نوم']
  },
  {
    id: 'p-06',
    name: 'كوب حراري Terra',
    category: 'home',
    price: 1300,
    oldPrice: null,
    rating: 4.4,
    reviews: 340,
    stock: 48,
    image: 'assets/img/mug.svg',
    short: 'يحافظ على الحرارة 8 ساعات.',
    description:
      'كوب من الفولاذ المقاوم للصدأ بجدار مزدوج مفرّغ من الهواء، يحافظ على المشروب ساخنًا 8 ساعات ' +
      'وباردًا 12 ساعة. غطاء محكم مانع للتسرب.',
    features: ['فولاذ مقاوم للصدأ', 'جدار مزدوج', 'غطاء محكم', 'سعة 450 مل']
  },
  {
    id: 'p-07',
    name: 'نبتة زينة مع أصيص فخّاري',
    category: 'home',
    price: 1800,
    oldPrice: 2200,
    rating: 4.2,
    reviews: 54,
    stock: 9,
    image: 'assets/img/plant.svg',
    short: 'نبتة داخلية سهلة العناية.',
    description:
      'نبتة داخلية تتحمّل الإضاءة المنخفضة وتحتاج ريًّا مرة واحدة أسبوعيًا، تأتي في أصيص فخّاري ' +
      'مصنوع يدويًا مع صحن تصريف.',
    features: ['سهلة العناية', 'أصيص يدوي الصنع', 'ارتفاع ~40 سم', 'صحن تصريف']
  },
  {
    id: 'p-08',
    name: 'حقيبة ظهر Nomad',
    category: 'office',
    price: 3300,
    oldPrice: null,
    rating: 4.9,
    reviews: 187,
    stock: 22,
    image: 'assets/img/backpack.svg',
    short: 'جيب مبطّن للحاسوب حتى 16 بوصة.',
    description:
      'حقيبة بسعة 22 لترًا من قماش مقاوم للماء، بجيب مبطّن للحاسوب حتى 16 بوصة، وجيب خلفي سرّي ' +
      'للجواز والمحفظة، وأحزمة كتف مبطّنة.',
    features: ['سعة 22 لتر', 'مقاومة للماء', 'جيب لابتوب 16"', 'جيب خلفي سرّي']
  },
  {
    id: 'p-09',
    name: 'شمعة عطرية Amber',
    category: 'home',
    price: 1000,
    oldPrice: 1200,
    rating: 4.1,
    reviews: 88,
    stock: 60,
    image: 'assets/img/candle.svg',
    short: 'شمع صويا طبيعي يحترق 40 ساعة.',
    description:
      'شمعة من شمع الصويا الطبيعي بعطر العنبر وخشب الصندل، تحترق حتى 40 ساعة، في كوب زجاجي ' +
      'قابل لإعادة الاستخدام.',
    features: ['شمع صويا 100%', 'يحترق 40 ساعة', 'فتيل قطني', 'كوب قابل لإعادة الاستخدام']
  },
  {
    id: 'p-10',
    name: 'دفتر مسطّر A5',
    category: 'office',
    price: 700,
    oldPrice: null,
    rating: 4.0,
    reviews: 41,
    stock: 100,
    image: 'assets/img/notebook.svg',
    short: '192 صفحة ورق سميك لا ينفذ منه الحبر.',
    description:
      'دفتر بغلاف صلب و192 صفحة من ورق 100 غرام لا ينفذ منه الحبر، مع شريط علامة وجيب خلفي ' +
      'وحزام مطاطي للإغلاق.',
    features: ['ورق 100 غرام', '192 صفحة', 'غلاف صلب', 'جيب خلفي']
  },
  {
    id: 'p-11',
    name: 'كاميرا فورية Retro',
    category: 'tech',
    price: 6900,
    oldPrice: 7800,
    rating: 4.6,
    reviews: 73,
    stock: 5,
    image: 'assets/img/camera.svg',
    short: 'صور مطبوعة خلال ثوانٍ.',
    description:
      'كاميرا فورية بتصميم كلاسيكي، فلاش تلقائي وثلاثة أوضاع تصوير، تطبع صورك خلال ثوانٍ ' +
      'على ورق بحجم بطاقة.',
    features: ['طباعة فورية', 'فلاش تلقائي', '3 أوضاع تصوير', 'مرآة سيلفي']
  },
  {
    id: 'p-12',
    name: 'وسادة أريكة مخملية',
    category: 'home',
    price: 1200,
    oldPrice: null,
    rating: 4.3,
    reviews: 129,
    stock: 34,
    image: 'assets/img/cushion.svg',
    short: 'غطاء مخملي قابل للغسل 45×45 سم.',
    description:
      'وسادة بغطاء مخملي ناعم قابل للفك والغسل، حشوة ألياف مرنة تحافظ على شكلها، ' +
      'وسحّاب مخفي بالكامل.',
    features: ['45×45 سم', 'غطاء قابل للغسل', 'حشوة مرنة', 'سحّاب مخفي']
  }
];

/* أكواد خصم تجريبية */
const PROMO_CODES = {
  'WELCOME10': { type: 'percent', value: 10, label: 'خصم ترحيبي 10%' },
  'FREESHIP':  { type: 'shipping', value: 0, label: 'شحن مجاني' },
  'SAVE800':   { type: 'fixed', value: 800, label: 'خصم 800 دج' }
};

const SHIPPING_FEE = 400;      // رسوم الشحن الثابتة
const FREE_SHIPPING_FROM = 8000; // شحن مجاني ابتداءً من هذا المبلغ
