const socket = io();

// --- DASHBOARD ELEMENTS ---
const playerList = document.getElementById('playerList');
const scoreList = document.getElementById('scoreList');
const questionBox = document.getElementById('questionBox');
const lobby = document.getElementById('lobby');
const leaderboard = document.getElementById('leaderboard');
const questionText = document.getElementById('questionText');
const answerList = document.getElementById('answerList');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');

// --- REMOTE ELEMENTS ---
const joinBox = document.getElementById('joinBox');
const waitBox = document.getElementById('waitBox');
const answerBox = document.getElementById('answerBox');
const scoreOnlyBox = document.getElementById('scoreOnlyBox');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const resultText = document.getElementById('resultText');
const myScore = document.getElementById('myScore');

// --- SHARED SOCKET EVENTS ---

// Update player list in lobby
socket.on('updatePlayers', players => {
    console.log('Players updated:', players);
    if (playerList) {
        playerList.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.className = 'player-tag';
            li.innerHTML = `${p.name} <span class="kick-hint">✕</span>`;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                console.log('Requesting kick for:', p.id);
                socket.emit('kickPlayer', p.id);
            });
            playerList.appendChild(li);
        });
    }
});

// Load a new question
socket.on('loadQuestion', q => {
    // Dashboard logic
    if (questionBox) {
        if (lobby) lobby.style.display = 'none';
        if (leaderboard) leaderboard.style.display = 'none';
        questionBox.style.display = 'block';
        questionText.innerText = q.question;
        answerList.innerHTML = '';
        q.answers.forEach((a, i) => {
            const colors = ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--yellow)'];
            answerList.innerHTML += `<li style="background:${colors[i]}">${a}</li>`;
        });
        if (timerDisplay) timerDisplay.innerText = 30;
    }

    // Remote logic
    if (answerBox) {
        if (joinBox) joinBox.style.display = 'none';
        if (waitBox) waitBox.style.display = 'none';
        if (scoreOnlyBox) scoreOnlyBox.style.display = 'none';
        answerBox.style.display = 'block';
    }
});

// Update timer
socket.on('timer', t => {
    if (timerDisplay) timerDisplay.innerText = t;
});

// Show scores (Dashboard Leaderboard)
socket.on('showScore', players => {
    if (scoreList) {
        if (questionBox) questionBox.style.display = 'none';
        if (leaderboard) leaderboard.style.display = 'block';
        scoreList.innerHTML = '';
        players.sort((a, b) => b.score - a.score).forEach((p, i) => {
            const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
            scoreList.innerHTML += `<li class="score-item">${medal}${p.name}: ${p.score}</li>`;
        });
    }
});

// Show round result (Remote feedback)
socket.on('roundResult', data => {
    if (scoreOnlyBox) {
        if (answerBox) answerBox.style.display = 'none';
        scoreOnlyBox.style.display = 'block';
        if (resultText && myScore) {
            resultText.innerText = data.result === 'correct' ? 'GOED GEDAAN! 🎉' : 'HELAAS! 😢';
            resultText.style.color = data.result === 'correct' ? 'var(--green)' : 'var(--red)';
            myScore.innerText = `Jouw Score: ${data.score}`;
        }
    }
});

// Quiz ended (Dashboard logic)
socket.on('quizEnded', data => {
    if (leaderboard) {
        if (questionBox) questionBox.style.display = 'none';
        leaderboard.style.display = 'block';
        leaderboard.querySelector('h2').innerText = '🏆 De Winnaars! 🏆';
        scoreList.innerHTML = '';
        data.top3.forEach((p, i) => {
            const trophies = ['🏆 Goud', '🥈 Zilver', '🥉 Brons'];
            scoreList.innerHTML += `<li class="score-item winner-rank-${i+1}">
                <strong>${trophies[i]}</strong>: ${p.name} (${p.score} pts)
            </li>`;
        });
        if (nextBtn) nextBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'inline-block';
    }
});

// Final Result (Remote individual logic)
socket.on('finalResult', data => {
    if (scoreOnlyBox) {
        if (answerBox) answerBox.style.display = 'none';
        if (waitBox) waitBox.style.display = 'none';
        scoreOnlyBox.style.display = 'block';
        if (resultText && myScore) {
            resultText.innerText = `Je bent geëindigd op plek ${data.rank}!`;
            resultText.style.color = 'var(--accent)';
            myScore.innerText = `Eindscore: ${data.score}`;
        }
    }
});

// Reset UI for new game
socket.on('gameRestarted', () => {
    if (lobby) {
        lobby.style.display = 'block';
        if (leaderboard) leaderboard.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (restartBtn) restartBtn.style.display = 'none';
        leaderboard.querySelector('h2').innerText = 'Top Scores 🏆';
    }
    // Remote: Toon JoinBox weer
    if (joinBox) {
        resetToJoin();
    }
});

socket.on('kicked', () => {
    if (joinBox) {
        resetToJoin();
    }
});

function resetToJoin() {
    joinBox.style.display = 'block';
    if (waitBox) waitBox.style.display = 'none';
    if (answerBox) answerBox.style.display = 'none';
    if (scoreOnlyBox) scoreOnlyBox.style.display = 'none';
    nameInput.value = ''; // Leeg het naam veld
}

// --- BUTTON EVENT LISTENERS ---

// DASHBOARD: Start Quiz
if (startBtn) {
    startBtn.addEventListener('click', () => {
        socket.emit('startQuiz');
    });
}

// DASHBOARD: Restart Game
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        socket.emit('restartGame');
    });
}

// DASHBOARD: Next Question
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        socket.emit('nextQuestion');
    });
}

// REMOTE: Join Quiz
if (joinBtn) {
    joinBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name === '') return;
        socket.emit('join', name);
        joinBox.style.display = 'none';
        waitBox.style.display = 'block';
    });
}

// REMOTE: Answers
const btnIds = ['btnRed', 'btnBlue', 'btnGreen', 'btnYellow'];
btnIds.forEach((id, idx) => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => {
            socket.emit('answer', idx);
            // Even wachten tot de timer voorbij is
            answerBox.style.display = 'none';
            waitBox.style.display = 'block';
            waitBox.querySelector('h2').innerText = 'Ingevoerd! 🚀';
            waitBox.querySelector('p').innerText = 'Even kijken of het goed was...';
        });
    }
});