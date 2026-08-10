/* Словари RU / UA. Ключи идентичны. Тексты - дословно из ТЗ. */
const I18N = {
  ru: {
    lang_code: 'ru',
    hero_label: 'INNA.TRI',
    hero_h1: 'Успеешь ли ты подготовиться к своему марафону?',
    hero_sub: 'Диагностика из 9 вопросов. 90 секунд. Честный ответ - без мотивационных соплей: что у тебя уже есть и чего критически не хватает до старта.',
    hero_trust: 'Составила Инна - тренер по бегу и триатлону, 20 лет в спорте, 10 лет тренерской практики. Тренирую бегунов в США, Европе и Украине через TrainingPeaks.',
    hero_cta: 'Пройти диагностику',

    back: 'Назад',
    next: 'Дальше',

    q_distance: 'Куда готовишься?',
    q_distance_5k: '5 км',
    q_distance_10k: '10 км',
    q_distance_half: 'Полумарафон (21.1 км)',
    q_distance_marathon: 'Марафон (42.2 км)',

    q_race_date: 'Когда старт?',
    q_race_date_undecided: 'Когда ориентировочно планируешь стартовать?',
    q_race_date_error: 'Проверь дату - она уже прошла',

    q_volume: 'Твой средний недельный объём за последние 4 недели?',
    q_volume_v0: 'Меньше 20 км',
    q_volume_v1: '20–40 км',
    q_volume_v2: '40–60 км',
    q_volume_v3: 'Больше 60 км',

    q_long_run: 'Самая длинная пробежка за последний месяц?',
    q_long_run_l0: 'До 10 км',
    q_long_run_l1: '10–15 км',
    q_long_run_l2: '16–21 км',
    q_long_run_l3: '22–28 км',
    q_long_run_l4: '29 км и больше',

    q_experience: 'Твой опыт на этой дистанции?',
    q_experience_e0: 'Это будет первый раз',
    q_experience_e1: 'Бегал(а) один раз',
    q_experience_e2: 'Несколько стартов за плечами',

    q_injuries: 'Боли или травмы за последние 6 месяцев?',
    q_injuries_i0: 'Не было',
    q_injuries_i1: 'Было, но прошло',
    q_injuries_i2: 'Периодически побаливает',
    q_injuries_i3: 'Болит сейчас',

    q_days: 'Сколько дней в неделю ты реально можешь тренироваться?',
    q_days_d0: '2–3',
    q_days_d1: '4–5',
    q_days_d2: '6–7',

    q_current_training: 'Как ты тренируешься сейчас?',
    q_current_training_t0: 'По плану из интернета / приложения',
    q_current_training_t1: 'Сам(а), без чёткого плана',
    q_current_training_t2: 'С тренером',
    q_current_training_t3: 'Нерегулярно, как получается',

    q_goal: 'Какая цель на этот старт?',
    q_goal_g0: 'Добежать и финишировать',
    q_goal_g1: 'Личный рекорд',
    q_goal_g2: 'Конкретное время',
    q_goal_time_label: 'Какое?',

    diag_label: 'ДИАГНОСТИКА',
    zone_green: 'Зелёная зона · База есть',
    zone_yellow: 'Жёлтая зона · Успеваешь, но есть пробелы',
    zone_red: 'Красная зона · Нужна другая стратегия',
    zone_redpain: 'Красная зона · Сначала здоровье',
    strengths_label: 'Что у тебя уже есть:',
    st_volume: 'беговой объём в рабочей зоне',
    st_long: 'длительные уже в графике',
    st_weeks: '{weeks} недель до старта - время есть',
    st_days: '4+ дня в неделю на тренировки',
    st_clean: 'нет травм, которые мешают',
    st_exp: 'опыт стартов за плечами',

    race_marathon: 'марафону',
    race_half: 'полумарафону',
    race_10k: 'десятке',
    race_5k: 'пятёрке',

    verdict_green_title: 'База есть. Вопрос - в качестве подготовки.',
    verdict_green_text: 'До старта {weeks} недель, и по объёму и длинным ты в рабочей зоне. Твой риск сейчас не "не добегу", а "пробегу на том же уровне, что и мог(ла) бы без подготовки". Дальше решают структура интенсивности и подводка - именно там прячется твой результат.',

    verdict_yellow_title: 'Успеваешь. Но есть пробелы, которые решат всё.',
    verdict_yellow_text: '{weeks} недель до старта - рабочий срок, но не для ошибок. По твоим ответам есть 2–3 слабых места, и если закрывать их наугад, ты либо недоберёшь форму, либо переберёшь нагрузку и сломаешься на пике. Что именно закрывать в первую очередь - расскажу в полном разборе.',

    verdict_risk_title: 'Ты побежишь - я это понимаю. Поэтому говорим не "бежать ли", а "как добежать целым".',
    verdict_risk_text: 'Слот на руках, решение принято - отговаривать не буду, это твой старт. Но по твоим ответам между текущей базой и дистанцией есть разрыв, и если бежать по обычному плану "как все", этот разрыв заберёт своё на второй половине: судороги, пешие километры, недели восстановления вместо гордости на финише. Хорошая новость: для таких ситуаций есть другая стратегия подготовки и другая раскладка на гонку - не героическая, а умная. Три вещи, которые я бы поменяла в твоей подготовке уже на этой неделе - в полном разборе.',

    verdict_redpain_title: 'Сначала - разобраться с болью. Потом - план.',
    verdict_redpain_text: 'Ты отметил(а), что болит сейчас. Любой план подготовки поверх боли - это подготовка к травме, а не к старту. Первый шаг - понять, что это: перегрузка, техника или что-то, с чем нужно к врачу. В разборе скажу, как я бы действовала на твоём месте и что можно делать уже сейчас, не усугубляя.',

    review_title: 'Полный разбор - бесплатно',
    review_text: 'Пришлю лично: три главных пробела по твоим ответам, что делать с каждым и с чего начать на этой неделе. Не рассылка и не бот - пишу сама.',
    review_hot: 'И если пришлёшь 30 секунд видео своей пробежки - сделаю видео-разбор техники. Беру 5 таких разборов в неделю.',
    review_cta: 'Получить разбор',

    form_name: 'Имя',
    form_contact: 'Telegram @ или email',
    form_city: 'Город и страна',
    form_city_placeholder: 'Например: Чикаго, США',
    form_submit: 'Получить разбор',
    form_error_required: 'Заполни это поле',
    form_error_contact: 'Укажи Telegram @ или email',
    form_consent: 'Нажимая кнопку, ты соглашаешься на обработку своих данных.',
    form_consent_link: 'Политика конфиденциальности',

    thanks_text: 'Готово. Напишу тебе в течение 24 часов. А пока - держи разбор по твоей теме в блоге: без воды и мотивационных лозунгов.',
    thanks_cta: 'Читать разбор в блоге',
    title_tag: 'Успеешь ли ты подготовиться к своему марафону? - диагностика за 90 секунд',

    footer: '© innatri.com · Instagram @inna.tri'
  },

  ua: {
    lang_code: 'ua',
    hero_label: 'INNA.TRI',
    hero_h1: 'Чи встигнеш ти підготуватися до свого марафону?',
    hero_sub: 'Діагностика з 9 питань. 90 секунд. Чесна відповідь - без мотиваційних соплів: що в тебе вже є і чого критично бракує до старту.',
    hero_trust: 'Склала Інна - тренерка з бігу та триатлону, 20 років у спорті, 10 років тренерської практики. Треную бігунів у США, Європі та Україні через TrainingPeaks.',
    hero_cta: 'Пройти діагностику',

    back: 'Назад',
    next: 'Далі',

    q_distance: 'Куди готуєшся?',
    q_distance_5k: '5 км',
    q_distance_10k: '10 км',
    q_distance_half: 'Напівмарафон (21.1 км)',
    q_distance_marathon: 'Марафон (42.2 км)',

    q_race_date: 'Коли старт?',
    q_race_date_undecided: 'Коли орієнтовно плануєш стартувати?',
    q_race_date_error: 'Перевір дату - вона вже минула',

    q_volume: "Твій середній тижневий об'єм за останні 4 тижні?",
    q_volume_v0: 'Менше 20 км',
    q_volume_v1: '20–40 км',
    q_volume_v2: '40–60 км',
    q_volume_v3: 'Понад 60 км',

    q_long_run: 'Найдовша пробіжка за останній місяць?',
    q_long_run_l0: 'До 10 км',
    q_long_run_l1: '10–15 км',
    q_long_run_l2: '16–21 км',
    q_long_run_l3: '22–28 км',
    q_long_run_l4: '29 км і більше',

    q_experience: 'Твій досвід на цій дистанції?',
    q_experience_e0: 'Це буде вперше',
    q_experience_e1: 'Бігав (бігала) один раз',
    q_experience_e2: 'Кілька стартів за плечима',

    q_injuries: 'Болі або травми за останні 6 місяців?',
    q_injuries_i0: 'Не було',
    q_injuries_i1: 'Було, але минуло',
    q_injuries_i2: 'Періодично поболює',
    q_injuries_i3: 'Болить зараз',

    q_days: 'Скільки днів на тиждень ти реально можеш тренуватися?',
    q_days_d0: '2–3',
    q_days_d1: '4–5',
    q_days_d2: '6–7',

    q_current_training: 'Як ти тренуєшся зараз?',
    q_current_training_t0: 'За планом з інтернету / застосунку',
    q_current_training_t1: 'Сам (сама), без чіткого плану',
    q_current_training_t2: 'З тренером',
    q_current_training_t3: 'Нерегулярно, як виходить',

    q_goal: 'Яка мета на цей старт?',
    q_goal_g0: 'Добігти й фінішувати',
    q_goal_g1: 'Особистий рекорд',
    q_goal_g2: 'Конкретний час',
    q_goal_time_label: 'Яке?',

    diag_label: 'ДІАГНОСТИКА',
    zone_green: 'Зелена зона · База є',
    zone_yellow: 'Жовта зона · Встигаєш, але є прогалини',
    zone_red: 'Червона зона · Потрібна інша стратегія',
    zone_redpain: 'Червона зона · Спочатку здоров\'я',
    strengths_label: 'Що в тебе вже є:',
    st_volume: 'біговий об\'єм у робочій зоні',
    st_long: 'довготривалі вже у графіку',
    st_weeks: '{weeks} тижнів до старту - час є',
    st_days: '4+ дні на тиждень на тренування',
    st_clean: 'немає травм, які заважають',
    st_exp: 'досвід стартів за плечима',

    race_marathon: 'марафону',
    race_half: 'напівмарафону',
    race_10k: 'десятки',
    race_5k: "п'ятірки",

    verdict_green_title: 'База є. Питання - в якості підготовки.',
    verdict_green_text: 'До старту {weeks} тижнів, і за об\'ємом та довгими ти в робочій зоні. Твій ризик зараз не "не добіжу", а "пробіжу на тому ж рівні, що й міг (могла) би без підготовки". Далі вирішують структура інтенсивності та підводка - саме там ховається твій результат.',

    verdict_yellow_title: 'Встигаєш. Але є прогалини, які вирішать усе.',
    verdict_yellow_text: '{weeks} тижнів до старту - робочий термін, але не для помилок. За твоїми відповідями є 2–3 слабкі місця, і якщо закривати їх навмання, ти або недобереш форму, або перебереш навантаження і зламаєшся на піку. Що саме закривати в першу чергу - розповім у повному розборі.',

    verdict_risk_title: 'Ти побіжиш - я це розумію. Тому говоримо не "чи бігти", а "як добігти цілим".',
    verdict_risk_text: 'Слот на руках, рішення ухвалене - відмовляти не буду, це твій старт. Але за твоїми відповідями між поточною базою і дистанцією є розрив, і якщо бігти за звичайним планом "як усі", цей розрив забере своє на другій половині: судоми, піші кілометри, тижні відновлення замість гордості на фініші. Хороша новина: для таких ситуацій є інша стратегія підготовки та інша розкладка на гонку - не героїчна, а розумна. Три речі, які я б змінила у твоїй підготовці вже цього тижня - у повному розборі.',

    verdict_redpain_title: 'Спочатку - розібратися з болем. Потім - план.',
    verdict_redpain_text: 'Ти зазначив (зазначила), що болить зараз. Будь-який план підготовки поверх болю - це підготовка до травми, а не до старту. Перший крок - зрозуміти, що це: перевантаження, техніка чи щось, із чим треба до лікаря. У розборі скажу, як би я діяла на твоєму місці і що можна робити вже зараз, не погіршуючи.',

    review_title: 'Повний розбір - безкоштовно',
    review_text: 'Надішлю особисто: три головні прогалини за твоїми відповідями, що робити з кожною і з чого почати цього тижня. Не розсилка і не бот - пишу сама.',
    review_hot: 'І якщо надішлеш 30 секунд відео своєї пробіжки - зроблю відео-розбір техніки. Беру 5 таких розборів на тиждень.',
    review_cta: 'Отримати розбір',

    form_name: "Ім'я",
    form_contact: 'Telegram @ або email',
    form_city: 'Місто та країна',
    form_city_placeholder: 'Наприклад: Чикаго, США',
    form_submit: 'Отримати розбір',
    form_error_required: 'Заповни це поле',
    form_error_contact: 'Вкажи Telegram @ або email',
    form_consent: 'Натискаючи кнопку, ти погоджуєшся на обробку своїх даних.',
    form_consent_link: 'Політика конфіденційності',

    thanks_text: 'Готово. Напишу тобі протягом 24 годин. А поки - тримай розбір за твоєю темою в блозі: без води та мотиваційних гасел.',
    thanks_cta: 'Читати розбір у блозі',
    title_tag: 'Чи встигнеш ти підготуватися до свого марафону? - діагностика за 90 секунд',

    footer: '© innatri.com · Instagram @inna.tri'
  },

  en: {
    lang_code: 'en',
    hero_label: 'INNA.TRI',
    hero_h1: 'Will you be ready for your race?',
    hero_sub: 'A 9-question diagnostic. 90 seconds. An honest answer - no motivational fluff: what you already have, and what is critically missing before your marathon or half.',
    hero_trust: 'Built by Inna - running and triathlon coach. 20 years in sport, 10 years of coaching. I train runners in the US, Europe and Ukraine through TrainingPeaks.',
    hero_cta: 'Start the diagnostic',

    back: 'Back',
    next: 'Next',

    q_distance: 'What are you training for?',
    q_distance_5k: '5K',
    q_distance_10k: '10K',
    q_distance_half: 'Half marathon (21.1 km / 13.1 mi)',
    q_distance_marathon: 'Marathon (42.2 km / 26.2 mi)',

    q_race_date: 'When is your race?',
    q_race_date_undecided: 'When are you roughly planning to race?',
    q_race_date_error: 'Check the date - it has already passed',

    q_volume: 'Your average weekly volume over the last 4 weeks?',
    q_volume_v0: 'Under 20 km (12 mi)',
    q_volume_v1: '20-40 km (12-25 mi)',
    q_volume_v2: '40-60 km (25-37 mi)',
    q_volume_v3: 'Over 60 km (37 mi)',

    q_long_run: 'Longest run in the past month?',
    q_long_run_l0: 'Under 10 km (6 mi)',
    q_long_run_l1: '10-15 km (6-9 mi)',
    q_long_run_l2: '16-21 km (10-13 mi)',
    q_long_run_l3: '22-28 km (14-17 mi)',
    q_long_run_l4: '29 km (18 mi) or more',

    q_experience: 'Your experience at this distance?',
    q_experience_e0: 'This will be my first',
    q_experience_e1: 'Done it once',
    q_experience_e2: 'Several races behind me',

    q_injuries: 'Pain or injuries in the last 6 months?',
    q_injuries_i0: 'None',
    q_injuries_i1: 'Had some - it is gone',
    q_injuries_i2: 'Aches now and then',
    q_injuries_i3: 'Hurts right now',

    q_days: 'How many days a week can you realistically train?',
    q_days_d0: '2-3',
    q_days_d1: '4-5',
    q_days_d2: '6-7',

    q_current_training: 'How do you train now?',
    q_current_training_t0: 'A plan from the internet / an app',
    q_current_training_t1: 'On my own, no real plan',
    q_current_training_t2: 'With a coach',
    q_current_training_t3: 'Irregularly, whenever life allows',

    q_goal: 'What is the goal for this race?',
    q_goal_g0: 'Finish it',
    q_goal_g1: 'A personal record',
    q_goal_g2: 'A specific time',
    q_goal_time_label: 'Which?',

    diag_label: 'DIAGNOSTIC',
    zone_green: 'Green zone · The base is there',
    zone_yellow: 'Yellow zone · On track, with gaps',
    zone_red: 'Red zone · You need a different strategy',
    zone_redpain: 'Red zone · Health first',
    strengths_label: 'What you already have:',
    st_volume: 'weekly volume in the working range',
    st_long: 'long runs already in the schedule',
    st_weeks: '{weeks} weeks to race day - there is time',
    st_days: '4+ training days a week',
    st_clean: 'no injuries in the way',
    st_exp: 'race experience behind you',

    race_marathon: 'marathon',
    race_half: 'half marathon',
    race_10k: '10K',
    race_5k: '5K',

    verdict_green_title: 'The base is there. The question is the quality of your prep.',
    verdict_green_text: '{weeks} weeks to race day, and your volume and long runs are in the working range. Your risk is not "won\'t finish" - it is "finish at the same level you would hit without any plan". From here, the structure of intensity and the taper decide - that is where your result is hiding.',

    verdict_yellow_title: 'You are on track. But the gaps will decide everything.',
    verdict_yellow_text: '{weeks} weeks out is a workable window - but not one that forgives mistakes. Your answers show 2-3 weak spots, and if you patch them blindly, you will either come up short on fitness or overload and break down right at the peak. Which ones to close first - I will tell you in the full review.',

    verdict_risk_title: 'You are going to run it - I get that. So the question is not "whether", it is "how to finish in one piece".',
    verdict_risk_text: 'The slot is booked, the decision is made - I will not talk you out of it, it is your race. But your answers show a gap between your current base and the distance, and on a standard one-size-fits-all plan that gap collects its dues in the second half: cramps, walking kilometres, weeks of recovery instead of pride at the finish. The good news: for exactly this situation there is a different training strategy and a different race plan - not heroic, smart. The three things I would change in your training this week - in the full review.',

    verdict_redpain_title: 'First - deal with the pain. Then - the plan.',
    verdict_redpain_text: 'You marked that something hurts right now. Any training plan on top of pain is training for an injury, not for a race. Step one is understanding what it is: overload, technique, or something for a doctor. In the review I will tell you what I would do in your place and what you can already do - without making it worse.',

    review_title: 'The full review - free',
    review_text: 'I will send it personally: the three main gaps in your answers, what to do about each one, and where to start this week. Not a newsletter, not a bot - I write myself.',
    review_hot: 'And if you send 30 seconds of video of your run - I will do a video review of your technique. I take 5 of these a week.',
    review_cta: 'Get my review',

    form_name: 'Name',
    form_contact: 'Telegram @ or email',
    form_city: 'City and country',
    form_city_placeholder: 'e.g.: Chicago, USA',
    form_submit: 'Get my review',
    form_error_required: 'This field is required',
    form_error_contact: 'Enter a Telegram @ or an email',
    form_consent: 'By tapping the button you agree to the processing of your data.',
    form_consent_link: 'Privacy Policy',

    thanks_text: 'Done. I will write to you within 24 hours. Meanwhile - here is a deep dive on your topic: no fluff, no slogans.',
    thanks_cta: 'Read it on the blog',
    title_tag: 'Will you be ready for your race? - a 90-second diagnostic',

    footer: '© innatri.com · Instagram @inna.tri'
  }
};
