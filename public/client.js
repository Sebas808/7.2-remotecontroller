const socket = io();

// --- Dashboard ---
const playerList = document.getElementById('playerList');
const questionBox = document.getElementById('questionBox');
const questionText = document.getElementById('questionText');
const answerList = document.getElementById('answerList');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');

if (playerList && startBtn) {
    socket.on('updatePlayers', players => {
        playerList.innerHTML = '';
        players.forEach(p => {
            playerList.innerHTML += `<li>${p.name} - ${p.score}</li>`;
        });
    });

    startBtn.addEventListener('click', () => {
        socket.emit('startQuiz');
    });
}

// --- Question page ---
socket.on('loadQuestion', q => {
    if (questionText) {
        questionBox.style.display = 'block';
        questionText.innerText = q.question;
        answerList.innerHTML = '';
        q.answers.forEach((a, i) => {
            answerList.innerHTML += `<li style="color:${q.colors[i]}">${a}</li>`;
        });
        if (timerDisplay) timerDisplay.innerText = 30;
    }
});

socket.on('timer', t => {
    if (timerDisplay) timerDisplay.innerText = t;
});

// --- Score page ---
const scoreList = document.getElementById('scoreList');
const nextBtn = document.getElementById('nextBtn');

socket.on('showScore', players => {
    if (scoreList) { // dashboard
        questionBox.style.display = 'none';
        playerList.innerHTML = '';
        players.sort((a, b) => b.score - b.score).forEach((p, i) => {
            const crown = i === 0 ? ' 🏆' : '';
            playerList.innerHTML += `<li>${p.name} - ${p.score}${crown}</li>`;
        });
    } else { // remote
        const scoreBox = document.getElementById('scoreOnlyBox');
        const myScore = document.getElementById('myScore');
        if (scoreBox && myScore) {
            scoreBox.style.display = 'block';
            myScore.innerText = players[0].score;
        }
    }
});

if (nextBtn) {
    nextBtn.addEventListener('click', () => socket.emit('nextQuestion'));
}

// --- Remote logic ---
const joinBox = document.getElementById('joinBox');
const answerBox = document.getElementById('answerBox');
const scoreOnlyBox = document.getElementById('scoreOnlyBox');
const nameInput = document.getElementById('nameInput');

if (joinBox && answerBox) {
    document.getElementById('joinBtn').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name === '') return;
        socket.emit('join', name);
        joinBox.style.display = 'none';
        answerBox.style.display = 'none'; // wacht tot quiz start
    });

    socket.on('loadQuestion', q => {
        if (answerBox && scoreOnlyBox) {
            scoreOnlyBox.style.display = 'none';
            answerBox.style.display = 'block';
        }
    });

    document.getElementById('btnRed').addEventListener('click', () => socket.emit('answer', 0));
    document.getElementById('btnBlue').addEventListener('click', () => socket.emit('answer', 1));
    document.getElementById('btnGreen').addEventListener('click', () => socket.emit('answer', 2));
    document.getElementById('btnYellow').addEventListener('click', () => socket.emit('answer', 3));
}