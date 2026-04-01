const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Route voor dashboard (root)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Route voor remote controller
app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

// --- Quiz logica ---
let players = [];
let questions = [
    { question: "Wat is de hoofdstad van Nederland?", answers: ["Amsterdam", "Rotterdam", "Utrecht", "Den Haag"], correct: 0, colors: ["red", "blue", "green", "yellow"] },
    { question: "Welk dier zegt 'miauw'?", answers: ["Hond", "Kat", "Koe", "Paard"], correct: 1, colors: ["red", "blue", "green", "yellow"] }
];
let currentQuestionIndex = -1;

io.on('connection', (socket) => {
    console.log('Nieuwe speler verbonden:', socket.id);

    socket.on('join', (name) => {
        players.push({ id: socket.id, name, score: 0 });
        io.emit('updatePlayers', players);
    });

    socket.on('answer', (answerIndex) => {
        const player = players.find(p => p.id === socket.id);
        if (player && currentQuestionIndex >= 0) {
            if (answerIndex === questions[currentQuestionIndex].correct) player.score += 1;
        }
        io.emit('updatePlayers', players);
    });

    socket.on('startQuiz', () => {
        nextQuestion();
    });

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) {
            io.emit('endQuiz', players);
        } else {
            io.emit('newQuestion', questions[currentQuestionIndex]);
        }
    }
});

// Start server
const PORT = 3001; // verander van 3000 naar 3001
server.listen(PORT, () => console.log(`Server luistert op http://localhost:${PORT}`));