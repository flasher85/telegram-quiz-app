// Конфигурация игры
const QUESTIONS_URL = "https://opentdb.com/api.php?amount=10&type=multiple";
const YANDEX_TRANSLATE_API = "https://translate.api.cloud.yandex.net/translate/v2/translate";
const YANDEX_API_KEY = "ajeh484lteloc9jb44tl"; // Замените на свой!

let questions = [];
let currentQuestion = 0;
let score = 0;
let lives = 3;
let timer;
let timeLeft = 10;

// DOM элементы
const questionEl = document.getElementById("question");
const optionsEl = document.querySelectorAll(".btn");
const livesEl = document.getElementById("lives");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");
const gameContainer = document.getElementById("game");
const loader = document.getElementById("loader");
const leaderboardBtn = document.getElementById("leaderboard-btn");
const leaderboard = document.getElementById("leaderboard");
const scoresList = document.getElementById("scores-list");
const backBtn = document.getElementById("back-btn");

// Инициализация
document.addEventListener("DOMContentLoaded", async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
    await loadQuestions();
    setupEventListeners();
});

async function loadQuestions() {
    showLoader("Загружаем вопросы...");
    
    // Проверка кэша
    const cachedQuestions = getCachedQuestions("ru");
    if (cachedQuestions) {
        questions = cachedQuestions;
        hideLoader();
        return;
    }

    try {
        const response = await fetch(QUESTIONS_URL);
        const data = await response.json();
        
        // Переводим вопросы
        showLoader("Переводим на русский...");
        questions = await translateQuestions(data.results);
        
        cacheQuestions(questions, "ru");
        hideLoader();
    } catch (error) {
        console.error("Ошибка:", error);
        showError("Ошибка загрузки вопросов");
    }
}

async function translateQuestions(questions) {
    const translated = [];
    
    for (const q of questions) {
        try {
            const [question, correct, ...incorrect] = await Promise.all([
                translateText(q.question),
                translateText(q.correct_answer),
                ...q.incorrect_answers.map(translateText)
            ]);
            
            translated.push({
                question: decodeHTML(question),
                correct_answer: decodeHTML(correct),
                incorrect_answers: incorrect.map(decodeHTML)
            });
        } catch (e) {
            console.error("Ошибка перевода:", e);
            // Используем оригинал, если перевод не удался
            translated.push({
                question: decodeHTML(q.question),
                correct_answer: decodeHTML(q.correct_answer),
                incorrect_answers: q.incorrect_answers.map(decodeHTML)
            });
        }
    }
    
    return translated;
}

async function translateText(text, targetLang = "ru") {
    if (/[а-яА-Я]/.test(text)) return text;
    
    const response = await fetch(YANDEX_TRANSLATE_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Api-Key ${YANDEX_API_KEY}`
        },
        body: JSON.stringify({
            texts: [text],
            targetLanguageCode: targetLang
        })
    });
    
    const data = await response.json();
    return data.translations[0].text;
}

function decodeHTML(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
}

// Остальные функции (showQuestion, checkAnswer, и т.д.) остаются без изменений
// ... (взять из предыдущего примера, начиная с функции setupEventListeners())