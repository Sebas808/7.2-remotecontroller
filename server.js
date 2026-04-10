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
    { question: "Wat is de hoofdstad van Nederland?", answers: ["Amsterdam", "Rotterdam", "Utrecht", "Den Haag"], correct: 0 },
    { question: "Welke taal gebruikt deze server?", answers: ["Python", "PHP", "Node.js", "Java"], correct: 2 },
    { question: "Hoeveel is 7 x 7?", answers: ["42", "48", "49", "51"], correct: 2 },
    { question: "Wie is de maker van Quizzly?", answers: ["Google AI", "Jij!", "Bill Gates", "Elon Musk"], correct: 1 },
    { question: "Wat is de kleur van een banaan?", answers: ["Rood", "Blauw", "Geel", "Groen"], correct: 2 }
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
        if (player && currentQuestionIndex >= 0 && !player.answered) {
            player.answered = true;
            if (idx === questions[currentQuestionIndex].correct) {
                player.score += 100; // meer punten voor kahoot-stijl
                player.lastResult = 'correct';
            } else {
                player.lastResult = 'incorrect';
            }
        }
        io.emit('updatePlayers', players);
    });

    socket.on('startQuiz', () => {
        currentQuestionIndex = 0;
        players.forEach(p => p.score = 0); // RESET ALLE SCORES
        resetRound();
        io.emit('updatePlayers', players);
        io.emit('loadQuestion', questions[currentQuestionIndex]);
        startTimer();
    });

    socket.on('kickPlayer', playerId => {
        console.log('Kicking player:', playerId);
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            players.splice(playerIndex, 1);
            io.to(playerId).emit('kicked');
            io.emit('updatePlayers', players);
            console.log('Player removed. Current players:', players.length);
        }
    });

    socket.on('restartGame', () => {
        currentQuestionIndex = -1;
        players = []; // LEEG DE LIJST VOLLEDIG
        io.emit('gameRestarted', players);
        io.emit('updatePlayers', players);
    });

    socket.on('nextQuestion', () => {
        currentQuestionIndex++;
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        if (currentQuestionIndex >= questions.length) {
            io.emit('quizEnded', {
                top3: sortedPlayers.slice(0, 3),
                allPlayers: sortedPlayers
            });
            // Stuur rank naar elke speler individually
            sortedPlayers.forEach((p, index) => {
                io.to(p.id).emit('finalResult', {
                    rank: index + 1,
                    totalPlayers: sortedPlayers.length,
                    score: p.score
                });
            });
        } else {
            resetRound();
            io.emit('loadQuestion', questions[currentQuestionIndex]);
            startTimer();
        }
    });

    function resetRound() {
        players.forEach(p => {
            p.answered = false;
            p.lastResult = null;
        });
    }

    function startTimer() {
        let time = 10; // 10 seconden voor sneller testen of demo
        io.emit('timer', time);
        clearInterval(timer);
        timer = setInterval(() => {
            time--;
            io.emit('timer', time);
            if (time <= 0) {
                clearInterval(timer);
                io.emit('showScore', players);
                // Stuur individuele feedback naar spelers
                players.forEach(p => {
                    io.to(p.id).emit('roundResult', {
                        score: p.score,
                        result: p.lastResult
                    });
                });
            }
        }, 1000);
    }
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server luistert op http://localhost:${PORT}`));