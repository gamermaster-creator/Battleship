document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const enemyBoard = document.getElementById('enemy-board');
    const messageArea = document.getElementById('message-area');
    const newGameButton = document.getElementById('new-game-button');

    const boardSize = 10;
    let playerShips = [];
    let enemyShips = [];

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
                    const currentIndex = startIndex + (isHorizontal ? i : i * boardSize);
                    if (boardCells[currentIndex].classList.contains('ship')) {
                        valid = false;
                        break;
                    }
                    shipCoords.push(currentIndex);
                }

                if (valid) {
                    const ship = { name: shipType.name, hits: [], coordinates: shipCoords };
                    ships.push(ship);
                    shipCoords.forEach(coord => {
                        if (isPlayer) { // Only show player's ships
                           boardCells[coord].classList.add('ship');
                        }
                        // For debugging, you might want to show enemy ships
                        // else { boardCells[coord].classList.add('ship'); }
                    });
                    placed = true;
                }
            }
        });
        return ships;
    }

    function handleCellClick(e) {
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
                messageArea.textContent = `You sunk the enemy\'s ${sunkShip.name}!`;
            }
        } else {
            cell.classList.add('miss');
            messageArea.textContent = 'It\'s a MISS!';
        }
        
        // Check for win condition
        checkGameOver();
    }

    function checkGameOver() {
        const allEnemyShipsSunk = enemyShips.every(ship => ship.hits.length === ship.coordinates.length);
        if (allEnemyShipsSunk) {
            messageArea.textContent = 'Congratulations! You have sunk all enemy ships! You WIN!';
            enemyBoard.removeEventListener('click', handleCellClick);
        }
        // Basic computer turn would go here in the future
    }

    function startGame() {
        createBoard(playerBoard, true);
        createBoard(enemyBoard, false);
        playerShips = placeShips(true);
        enemyShips = placeShips(false);
        messageArea.textContent = 'The battle begins! Your turn.';
    }

    newGameButton.addEventListener('click', startGame);

    // Initial game start
    startGame();
});
