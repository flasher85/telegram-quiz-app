// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Инициализация
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Сохранение результата
function saveScore() {
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    if (!user) return;

    database.ref('scores/' + user.id).set({
        name: user.first_name || "Аноним",
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

// Получение топа игроков
async function getTopScores() {
    return new Promise((resolve) => {
        database.ref('scores').orderByChild('score').limitToLast(100).once('value', (snapshot) => {
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });
            resolve(scores.sort((a, b) => b.score - a.score));
        });
    });
}