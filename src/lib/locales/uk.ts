export const ukLocale = {
  // General
  title: "Оцінювання менеджерів: парні порівняння",
  loading: "Завантаження...",
  error: "Помилка",
  save: "Зберегти",
  cancel: "Скасувати",
  continue: "Продовжити",
  back: "Назад",
  next: "Далі",
  finish: "Завершити",
  
  // Instructions Screen
  intro: "Вам потрібно обрати сильнішого менеджера в кожній парі. Це займе приблизно {estPairs} порівнянь.",
  managersCount: "Менеджерів: {count}",
  estimatedComparisons: "Орієнтовно порівнянь: {count}",
  enterName: "Введіть ваше ім'я та прізвище",
  enterNamePlaceholder: "Прізвище Ім'я По батькові",
  nameRequired: "Будь ласка, введіть ваше повне ім'я (мінімум 2 слова)",
  start: "Почати",
  
  // Comparison Screen
  question: "Хто з цих менеджерів більш сильний?",
  skip: "Пропустити (S)",
  leftHint: "Натисніть ← для вибору",
  rightHint: "Натисніть → для вибору",
  leftCount: "Залишилось: {count} порівнянь",
  progress: "Прогрес: {done} з {target}",
  
  // Results Screen
  yourRanking: "Ваш рейтинг",
  personalResults: "Ваші результати оцінювання",
  place: "Місце",
  fullName: "ПІБ",
  position: "Посада", 
  rating: "Рейтинг",
  exportCsv: "Експортувати CSV",
  restart: "Почати спочатку",
  
  // Admin Dashboard
  companyRanking: "Зведений рейтинг компанії",
  adminDashboard: "Панель адміністратора",
  importCsv: "Імпортувати CSV",
  exportCompanyCsv: "Експорт зведеного CSV",
  recompute: "Перерахувати рейтинг",
  statistics: "Статистика",
  completedComparisons: "Завершено порівнянь",
  totalRaters: "Всього рецензентів",
  
  // CSV Import
  uploadFile: "Завантажити файл",
  fileFormat: "Формат файлу",
  csvFormatHint: "CSV файл з колонками: id, last_name, first_name, patronymic, position",
  alternativeFormat: "Також підтримується: ID, Прізвище, Ім'я, По батькові, Посада",
  preview: "Попередній перегляд",
  importData: "Імпортувати дані",
  validationErrors: "Помилки валідації",
  
  // Validation Messages
  validation: {
    required: "Обов'язкове поле",
    invalidId: "Невірний ID",
    duplicateId: "Дублікат ID",
    emptyName: "Порожнє ім'я не допускається",
    emptyPosition: "Порожня посада не допускається",
    invalidFormat: "Невірний формат файлу",
    noData: "Файл не містить даних"
  },
  
  // Status Messages
  status: {
    importing: "Імпортування...",
    imported: "Успішно імпортовано {count} записів",
    updated: "Оновлено {count} записів",
    noChanges: "Змін не виявлено",
    calculating: "Розрахунок рейтингу...",
    calculated: "Рейтинг успішно перераховано",
    sessionExpired: "Сесія закінчилась",
    insufficientData: "Недостатньо даних для порівняння"
  },
  
  // Errors
  errors: {
    generic: "Щось пішло не так",
    network: "Помилка мережі",
    serverError: "Помилка сервера",
    notFound: "Не знайдено",
    unauthorized: "Немає доступу",
    invalidData: "Невірні дані",
    fileUploadFailed: "Помилка завантаження файлу",
    csvParseFailed: "Помилка обробки CSV файлу"
  },
  
  // Keyboard Shortcuts
  shortcuts: {
    title: "Клавіатурні скорочення",
    leftArrow: "← - Вибрати лівого менеджера",
    rightArrow: "→ - Вибрати правого менеджера", 
    sKey: "S - Пропустити порівняння",
    help: "? - Показати довідку"
  },
  
  // Completion Messages
  completion: {
    allDone: "Всі порівняння завершено!",
    thankyou: "Дякуємо за участь в оцінюванні",
    viewResults: "Переглянути результати",
    minimumReached: "Досягнуто мінімум порівнянь для кожного менеджера"
  }
};

export type LocaleKeys = keyof typeof ukLocale;