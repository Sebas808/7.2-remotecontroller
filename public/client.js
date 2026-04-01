const socket = io();

// === DASHBOARD LOGICA ===
const playerList = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const questionBox = document.getElementById('questionBox');
const questionText = document.getElementById('questionText');
const answerList = document.getElementById('answerList');

if (playerList && startBtn) { // check of we op dashboard zijn
    socket.on('updatePlayers', players => {
        playerList.innerHTML = '';
        players.forEach(p => {
            playerList.innerHTML += `<li>${p.name} - ${p.score}</li>`;
        });
    });

    startBtn.addEventListener('click', () => {
        socket.emit('startQuiz');
    });

    socket.on('newQuestion', q => {
        questionBox.style.display = 'block';
        questionText.innerText = q.question;
        answerList.innerHTML = '';
        q.answers.forEach((a, i) => {
            answerList.innerHTML += `<li style="color:${q.colors[i]}">${a}</li>`;
        });
    });

    socket.on('endQuiz', players => {
        questionBox.style.display = 'none';
        playerList.innerHTML = '';
        players.sort((a, b) => b.score - a.score);
        players.forEach((p, i) => {
            const crown = i === 0 ? ' 🏆' : '';
            playerList.innerHTML += `<li>${p.name} - ${p.score}${crown}</li>`;
        });
    });
}

// === REMOTE LOGICA ===
const joinBox = document.getElementById('joinBox');
const answerBox = document.getElementById('answerBox');
const nameInput = document.getElementById('nameInput');

if (joinBox && answerBox) { // check of we op remote zijn
    document.getElementById('joinBtn').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name === '') return;
        socket.emit('join', name);
        joinBox.style.display = 'none';
        answerBox.style.display = 'block';
    });

    document.getElementById('btnRed').addEventListener('click', () => socket.emit('answer', 0));
    document.getElementById('btnBlue').addEventListener('click', () => socket.emit('answer', 1));
    document.getElementById('btnGreen').addEventListener('click', () => socket.emit('answer', 2));
    document.getElementById('btnYellow').addEventListener('click', () => socket.emit('answer', 3));
}