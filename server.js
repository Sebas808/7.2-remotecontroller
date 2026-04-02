const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/question', (req, res) => res.sendFile(path.join(__dirname, 'public', 'question.html')));
app.get('/score', (req, res) => res.sendFile(path.join(__dirname, 'public', 'score.html')));
app.get('/remote', (req, res) => res.sendFile(path.join(__dirname, 'public', 'remote.html')));

let players = [];
let questions = [
    { question: "Wat is de hoofdstad van Nederland?", answers: ["Amsterdam", "Rotterdam", "Utrecht", "Den Haag"], correct: 0, colors: ["red", "blue", "green", "yellow"] },
    { question: "Welk dier zegt 'miauw'?", answers: ["Hond", "Kat", "Koe", "Paard"], correct: 1, colors: ["red", "blue", "green", "yellow"] },
    { question: "2 + 2 = ?", answers: ["3", "4", "5", "6"], correct: 1, colors: ["red", "blue", "green", "yellow"] }
];

let currentQuestionIndex = -1;
let timer;

io.on('connection', socket => {
    console.log('Nieuwe speler verbonden:', socket.id);

    socket.on('join', name => {
        players.push({ id: socket.id, name, score: 0 });
        io.emit('updatePlayers', players);
    });

    socket.on('answer', idx => {
        const player = players.find(p => p.id === socket.id);
        if (player && currentQuestionIndex >= 0) {
            if (idx === questions[currentQuestionIndex].correct) player.score++;
        }
        io.emit('updatePlayers', players);
    });

    socket.on('startQuiz', () => {
        currentQuestionIndex = 0;
        io.emit('loadQuestion', questions[currentQuestionIndex]);
        startTimer();
    });

    socket.on('nextQuestion', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) {
            io.emit('quizEnded', players);
        } else {
            io.emit('loadQuestion', questions[currentQuestionIndex]);
            startTimer();
        }
    });

    function startTimer() {
        let time = 30;
        io.emit('timer', time);
        clearInterval(timer);
        timer = setInterval(() => {
            time--;
            io.emit('timer', time);
            if (time <= 0) {
                clearInterval(timer);
                // Dashboard: alle scores
                io.emit('showScore', players);
                // Remote: alleen eigen score
                io.sockets.sockets.forEach(s => {
                    const me = players.find(p => p.id === s.id);
                    s.emit('showScore', [{ name: me.name, score: me.score }]);
                });
            }
        }, 1000);
    }
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server luistert op http://localhost:${PORT}`));