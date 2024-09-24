document.addEventListener("DOMContentLoaded", function() {
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    const connectButton = document.getElementById('connect-button');
    const playerNameInput = document.getElementById('player-name');
    const gameArea = document.getElementById('game-area');
    const playerColors = {}; 
    const botColors = {}; 
    let loggedInPlayer = null;
    let snakeBody = [{x:0, y:0}];
    const playerSpeed = 10; 


    const socket = new SockJS('https://4b25349d4f8b.ngrok.app/game', {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    });
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/game', function(response) {
            const data = JSON.parse(response.body);
            updateGameState(data, gameArea, loggedInPlayer, playerColors, botColors);
        });
    });

    connectButton.addEventListener('click', function() {
        const playerName = playerNameInput.value.trim();

        if (playerName) {
            stompClient.send("/app/connect", {}, JSON.stringify({ name: playerName }));
            loggedInPlayer = { name: playerName, position: { x: 0, y: 0 } }; 
            loginContainer.style.display = 'none';
            gameContainer.style.display = 'block';
        } else {
            alert('Please enter a player name.');
        }
    });

    document.addEventListener('keydown', function(event) {
        if (!loggedInPlayer) return; 

        switch (event.key) {
            case 'ArrowUp':
                loggedInPlayer.position.y -= playerSpeed;
                break;
            case 'ArrowDown':
                loggedInPlayer.position.y += playerSpeed;
                break;
            case 'ArrowLeft':
                loggedInPlayer.position.x -= playerSpeed;
                break;
            case 'ArrowRight':
                loggedInPlayer.position.x += playerSpeed;
                break;
        }

        updatePlayerPosition(loggedInPlayer);
   
        
        if(loggedInPlayer && stompClient) {
            var move = {
                name: loggedInPlayer.name,
                position: loggedInPlayer.position
            };

            console.log('Enviando nova posição: ', move);
            stompClient.send("/app/move", {}, JSON.stringify(move));
        }
        
        updatePlayerPosition(loggedInPlayer);
    });
});

function growSnake() {
    const newSegment = { ...snakeBody[snakeBody.length - 1]};
    snakeBody.push(newSegment);
}

function updateScore() {
    loggedInPlayer.score += 10;
    growSnake();
    document.getElementById('score-display').textContent = 'Pontuação: ${loggedInPlayer.score}';
}

function updatePlayerPosition(player) {
    const playerElement = document.querySelector(`[data-player-name="${player.name}"]`); 
    if (playerElement) {
        playerElement.style.left = `${player.position.x}px`;
        playerElement.style.top = `${player.position.y}px`;
    }
}

function updateRanking(data) {
    const rankingElement = document.getElementById('ranking');
    rankingElement.innerHTML = '';

    const playersSorted = data.players.sort((a, b) => b.score - a.score);

    playersSorted.forEach(player => {
        const playerRank = document.createElement('div');
        playerRank.textContent = '${player.name}: ${player.score}';
        rankingElement.appendChild(playerRank);
    })
}

function gameOver() {
    alert('Game Over! Pontuação Final: ${loggedInPlayer.score}');
    const restart = confirm('Deseja reiniciar o jogo?');

    if(restart) {
        restartGame();
    }
}

function restartGame() {
    loggedInPlayer.position = { x: 0, y: 0 };
    loggedInPlayer.score = 0;
    snakeBody = [{ x: 0, y: 0 }];
    document.getElementById('score-display').textContent = 'Pontuação: 0';
}

function updateGameState(data, gameArea, loggedInPlayer, playerColors, botColors) {
    gameArea.innerHTML = '';

    data.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = `${player.name}`;
        playerElement.classList.add('player');
        playerElement.setAttribute('data-player-name', player.name); 
        playerElement.style.left = `${player.position.x}px`;
        playerElement.style.top = `${player.position.y}px`;
        playerElement.style.backgroundColor = getOrCreateColor(player.name, playerColors);
        gameArea.appendChild(playerElement);

        if (player.name === loggedInPlayer.name) {
            loggedInPlayer.position = player.position;
        }
    });

    data.bots.forEach(bot => {
        const botElement = document.createElement('div');
        botElement.textContent = `${bot.name}`;
        botElement.classList.add('bot');
        botElement.setAttribute('data-bot-name', bot.name); 
        botElement.style.left = `${bot.position.x}px`;
        botElement.style.top = `${bot.position.y}px`;
        botElement.style.backgroundColor = getOrCreateColor(bot.name, botColors); 
        gameArea.appendChild(botElement);
    });
}

function getOrCreateColor(id, colorStorage) {
    if (!colorStorage[id]) {
        colorStorage[id] = generateRandomColor(); 
    }
    return colorStorage[id];
}

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function enterGame() {
    
}