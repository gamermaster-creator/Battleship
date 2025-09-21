document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const enemyBoard = document.getElementById('enemy-board');
    const messageArea = document.getElementById('message-area');
    const turnInfo = document.getElementById('turn-info');
    const newGameButton = document.getElementById('new-game-button');

    const boardSize = 10;
    let playerShips = [];
    let enemyShips = [];
    let currentPlayer = 'player';
    let isGameOver = false;
    let enemyFiredShots = new Set();

    const shipTypes = [
        { name: 'Carrier', size: 5 },
        { name: 'Battleship', size: 4 },
        { name: 'Cruiser', size: 3 },
        { name: 'Submarine', size: 3 },
        { name: 'Destroyer', size: 2 }
    ];

    function createBoard(boardElement, isPlayer) {
        boardElement.innerHTML = '';
        for (let i = 0; i < boardSize * boardSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.id = i;
            if (!isPlayer) {
                cell.addEventListener('click', handleCellClick);
            }
            boardElement.appendChild(cell);
        }
    }

    function placeShips(isPlayer) {
        const ships = [];
        const boardElement = isPlayer ? playerBoard : enemyBoard;
        const boardCells = boardElement.children;

        shipTypes.forEach(shipType => {
            let placed = false;
            while (!placed) {
                const isHorizontal = Math.random() < 0.5;
                const startX = Math.floor(Math.random() * (boardSize - (isHorizontal ? shipType.size : 0)));
                const startY = Math.floor(Math.random() * (boardSize - (isHorizontal ? 0 : shipType.size)));
                const startIndex = startY * boardSize + startX;

                let valid = true;
                const shipCoords = [];
                for (let i = 0; i < shipType.size; i++) {
                    const cellIndex = startIndex + (isHorizontal ? i : i * boardSize);
                    if (cellIndex >= 100 || boardCells[cellIndex].classList.contains('ship')) {
                        valid = false;
                        break;
                    }
                    // Check adjacency
                    const surrounding = [-1, 1, -boardSize, boardSize, -boardSize-1, -boardSize+1, boardSize-1, boardSize+1];
                    for(const offset of surrounding) {
                        if(boardCells[cellIndex + offset] && boardCells[cellIndex + offset].classList.contains('ship')) {
                            valid = false;
                            break;
                        }
                    }
                    if(!valid) break;

                    shipCoords.push(cellIndex);
                }

                if (valid) {
                    const ship = { name: shipType.name, hits: [], coordinates: shipCoords };
                    ships.push(ship);
                    shipCoords.forEach(coord => {
                        if (isPlayer) { 
                           boardCells[coord].classList.add('ship');
                        }
                    });
                    placed = true;
                }
            }
        });
        return ships;
    }

    function handleCellClick(e) {
        if (currentPlayer !== 'player' || isGameOver) return;

        const cell = e.target;
        const cellId = parseInt(cell.dataset.id);

        if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
            messageArea.textContent = 'You already fired at this location!';
            return;
        }

        let hit = false;
        let sunkShip = null;

        enemyShips.forEach(ship => {
            if (ship.coordinates.includes(cellId)) {
                hit = true;
                ship.hits.push(cellId);
                cell.classList.add('hit');
                messageArea.textContent = 'It\'s a HIT!';
                if (ship.hits.length === ship.coordinates.length) {
                    sunkShip = ship;
                }
            }
        });

        if (hit) {
            if (sunkShip) {
                messageArea.textContent = `You sunk the enemy's ${sunkShip.name}!`;
            }
        } else {
            cell.classList.add('miss');
            messageArea.textContent = 'It\'s a MISS!';
        }
        
        if (checkGameOver()) return;

        switchTurn();
        setTimeout(enemyTurn, 1000);
    }

    function enemyTurn() {
        if (isGameOver) return;

        let fired = false;
        while (!fired) {
            const shotId = Math.floor(Math.random() * (boardSize * boardSize));
            if (!enemyFiredShots.has(shotId)) {
                const cell = playerBoard.querySelector(`[data-id='${shotId}']`);
                enemyFiredShots.add(shotId);

                let hit = false;
                playerShips.forEach(ship => {
                    if (ship.coordinates.includes(shotId)) {
                        hit = true;
                        ship.hits.push(shotId);
                        cell.classList.add('hit');
                        messageArea.textContent = 'The enemy scored a HIT!';
                        if (ship.hits.length === ship.coordinates.length) {
                            messageArea.textContent = `The enemy sunk your ${ship.name}!`;
                        }
                    }
                });

                if (!hit) {
                    cell.classList.add('miss');
                }
                fired = true;
            }
        }

        if (checkGameOver()) return;
        switchTurn();
    }

    function switchTurn() {
        currentPlayer = currentPlayer === 'player' ? 'enemy' : 'player';
        turnInfo.textContent = currentPlayer === 'player' ? 'Your Turn' : 'Enemy\'s Turn';
        enemyBoard.style.pointerEvents = currentPlayer === 'player' ? 'auto' : 'none';
    }

    function checkGameOver() {
        const allEnemyShipsSunk = enemyShips.every(ship => ship.hits.length === ship.coordinates.length);
        const allPlayerShipsSunk = playerShips.every(ship => ship.hits.length === ship.coordinates.length);

        if (allEnemyShipsSunk) {
            messageArea.textContent = 'Congratulations! You have sunk all enemy ships! You WIN!';
            isGameOver = true;
        } else if (allPlayerShipsSunk) {
            messageArea.textContent = 'All your ships have been sunk! You LOSE!';
            isGameOver = true;
        }

        if (isGameOver) {
            enemyBoard.style.pointerEvents = 'none'; // Disable board
        }
        return isGameOver;
    }

    function startGame() {
        isGameOver = false;
        currentPlayer = 'player';
        enemyFiredShots.clear();

        createBoard(playerBoard, true);
        createBoard(enemyBoard, false);
        
        playerShips = placeShips(true);
        enemyShips = placeShips(false);
        
        turnInfo.textContent = 'Your Turn';
        messageArea.textContent = 'The battle begins!';
        enemyBoard.style.pointerEvents = 'auto';
    }

    newGameButton.addEventListener('click', startGame);

    startGame();
});
