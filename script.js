// Конфигурация игры
const QUESTIONS_URL = "https://opentdb.com/api.php?amount=10&type=multiple";
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
    await loadQuestions();
    setupEventListeners();
});

async function loadQuestions() {
    showLoader("Загружаем вопросы...");
    
    // Проверка кэша
    const cachedQuestions = getCachedQuestions();
    if (cachedQuestions) {
        questions = cachedQuestions;
        hideLoader();
        return;
    }

    try {
        const response = await fetch(QUESTIONS_URL);
        const data = await response.json();
        questions = data.results.map(q => ({
            question: decodeHTML(q.question),
            correct_answer: decodeHTML(q.correct_answer),
            incorrect_answers: q.incorrect_answers.map(a => decodeHTML(a))
        }));
        
        cacheQuestions(questions);
        hideLoader();
    } catch (error) {
        showError("Ошибка загрузки вопросов");
    }
}

function setupEventListeners() {
    // Кнопки ответов
    optionsEl.forEach((btn, index) => {
        btn.addEventListener("click", () => checkAnswer(index));
    });

    // Лидерборд
    leaderboardBtn.addEventListener("click", showLeaderboard);
    backBtn.addEventListener("click", () => {
        leaderboard.style.display = "none";
        gameContainer.style.display = "block";
    });
}

// Основные функции игры
function showQuestion() {
    if (currentQuestion >= questions.length) {
        endGame();
        return;
    }

    const q = questions[currentQuestion];
    questionEl.textContent = q.question;

    // Перемешиваем варианты
    const options = [...q.incorrect_answers, q.correct_answer];
    shuffleArray(options);

    optionsEl.forEach((btn, i) => {
        btn.textContent = options[i];
    });

    startTimer();
}

function startTimer() {
    timeLeft = 10;
    timerEl.textContent = timeLeft;
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleWrongAnswer();
        }
    }, 1000);
}

function checkAnswer(selectedIndex) {
    clearInterval(timer);
    
    const selectedAnswer = optionsEl[selectedIndex].textContent;
    const correctAnswer = questions[currentQuestion].correct_answer;
    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
        const bonus = Math.floor(timeLeft * 2);
        score += bonus;
        scoreEl.textContent = `${score} очков`;
        resultEl.textContent = `✅ Верно! +${bonus} очков`;
        showConfetti();
    } else {
        handleWrongAnswer();
    }

    currentQuestion++;
    setTimeout(showQuestion, 1500);
}

function handleWrongAnswer() {
    lives--;
    livesEl.textContent = "❤️".repeat(lives);
    resultEl.textContent = `❌ Правильный ответ: ${questions[currentQuestion].correct_answer}`;

    if (lives <= 0) {
        endGame();
    }
}

function endGame() {
    questionEl.textContent = `Игра окончена! Ваш счет: ${score}`;
    document.querySelector(".options").style.display = "none";
    saveScore();
}

// Вспомогательные функции
function decodeHTML(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// Кэширование
function getCachedQuestions() {
    const cached = localStorage.getItem("quizQuestions");
    if (!cached) return null;
    
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > 6 * 60 * 60 * 1000) {
        localStorage.removeItem("quizQuestions");
        return null;
    }
    return data;
}

function cacheQuestions(data) {
    const cacheData = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem("quizQuestions", JSON.stringify(cacheData));
}

// Лидерборд
async function showLeaderboard() {
    gameContainer.style.display = "none";
    leaderboard.style.display = "block";
    scoresList.innerHTML = "<div class='loader-spinner'></div>";

    try {
        const topScores = await getTopScores();
        displayScores(topScores);
    } catch (error) {
        scoresList.innerHTML = "Ошибка загрузки рейтинга";
    }
}

function displayScores(scores) {
    scoresList.innerHTML = "";
    scores.slice(0, 10).forEach((score, index) => {
        const scoreEl = document.createElement("div");
        scoreEl.className = "score-item";
        scoreEl.innerHTML = `
            <span>${index + 1}. ${score.name || "Аноним"}</span>
            <span>${score.score} очков</span>
        `;
        scoresList.appendChild(scoreEl);
    });
}

// UI функции
function showLoader(text) {
    loader.style.display = "flex";
    loader.querySelector("p").textContent = text;
    gameContainer.style.display = "none";
}

function hideLoader() {
    loader.style.display = "none";
    gameContainer.style.display = "block";
    showQuestion();
}

function showError(message) {
    loader.querySelector("p").textContent = message;
    setTimeout(() => {
        loader.style.display = "none";
        gameContainer.style.display = "block";
    }, 2000);
}