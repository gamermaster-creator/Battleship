document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const enemyBoard = document.getElementById('enemy-board');
    const messageArea = document.getElementById('message-area');
    const turnInfo = document.getElementById('turn-info');
    const newGameButton = document.getElementById('new-game-button');
    const placementControls = document.getElementById('placement-controls');
    const shipListContainer = document.getElementById('ship-list');
    const rotateButton = document.getElementById('rotate-button');
    const startGameButton = document.getElementById('start-game-button');

    const boardSize = 10;
    let playerShips = [];
    let enemyShips = [];
    let currentPlayer = 'player';
    let isGameOver = false;
    let enemyFiredShots = new Set();

    let isPlacementPhase = true;
    let selectedShipName = null;
    let currentOrientation = 'horizontal'; // 'horizontal' or 'vertical'
    let playerPlacedShips = []; // To store ships after player places them
    let playerShipCoords = new Set(); // To keep track of occupied cells on player board

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
            boardElement.appendChild(cell);
        }
    }

    function placeEnemyShips() {
        const ships = [];
        const boardCells = enemyBoard.children;

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
                    // Check adjacency (only direct neighbors, not diagonals)
                    const adjacentOffsets = [-1, 1, -boardSize, boardSize];
                    for(const offset of adjacentOffsets) {
                        const adjIndex = cellIndex + offset;
                        // Ensure adjIndex is within bounds and on the same row/col for horizontal/vertical checks
                        if (adjIndex >= 0 && adjIndex < boardSize * boardSize) {
                            if (isHorizontal && (offset === -1 || offset === 1) && Math.floor(adjIndex / boardSize) !== Math.floor(cellIndex / boardSize)) continue;
                            if (!isHorizontal && (offset === -boardSize || offset === boardSize) && (adjIndex % boardSize) !== (cellIndex % boardSize)) continue;
                            
                            if(boardCells[adjIndex] && boardCells[adjIndex].classList.contains('ship')) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if(!valid) break;

                    shipCoords.push(cellIndex);
                }

                if (valid) {
                    const ship = { name: shipType.name, hits: [], coordinates: shipCoords };
                    ships.push(ship);
                    // For debugging, you might want to show enemy ships
                    // shipCoords.forEach(coord => { boardCells[coord].classList.add('ship'); });
                    placed = true;
                }
            }
        });
        return ships;
    }

    function isValidPlacement(startIndex, shipSize, isHorizontal, occupiedCells, currentShipCoords = []) {
        const row = Math.floor(startIndex / boardSize);
        const col = startIndex % boardSize;

        if (isHorizontal) {
            if (col + shipSize > boardSize) return false; // Out of bounds
        } else {
            if (row + shipSize > boardSize) return false; // Out of bounds
        }

        for (let i = 0; i < shipSize; i++) {
            const currentCellIndex = startIndex + (isHorizontal ? i : i * boardSize);
            
            // Check if current cell is already occupied by another ship (excluding the ship being moved)
            if (occupiedCells.has(currentCellIndex) && !currentShipCoords.includes(currentCellIndex)) return false; 

            // Check adjacency (only direct neighbors, not diagonals)
            const adjacentOffsets = [-1, 1, -boardSize, boardSize];
            for (const offset of adjacentOffsets) {
                const adjIndex = currentCellIndex + offset;
                if (adjIndex >= 0 && adjIndex < boardSize * boardSize) {
                    // Ensure adjIndex is on the same row/col for horizontal/vertical checks
                    if (isHorizontal && (offset === -1 || offset === 1) && Math.floor(adjIndex / boardSize) !== Math.floor(currentCellIndex / boardSize)) continue;
                    if (!isHorizontal && (offset === -boardSize || offset === boardSize) && (adjIndex % boardSize) !== (currentCellIndex % boardSize)) continue;

                    // Check if adjacent cell is occupied by another ship (excluding the ship being moved)
                    if (occupiedCells.has(adjIndex) && !currentShipCoords.includes(adjIndex)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function handlePlayerBoardHover(e) {
        if (!isPlacementPhase || !selectedShipName) return;

        const cell = e.target;
        const startIndex = parseInt(cell.dataset.id);
        const shipType = shipTypes.find(s => s.name === selectedShipName);
        const shipSize = shipType.size;
        const isHorizontal = currentOrientation === 'horizontal';
        const boardCells = playerBoard.children;

        // Clear previous hover highlights
        Array.from(boardCells).forEach(c => c.classList.remove('placement-hover', 'placement-invalid'));

        // Get current coordinates of the ship being moved, if any
        const shipBeingMoved = playerPlacedShips.find(s => s.name === selectedShipName);
        const currentShipCoords = shipBeingMoved ? shipBeingMoved.coordinates : [];

        const valid = isValidPlacement(startIndex, shipSize, isHorizontal, playerShipCoords, currentShipCoords);

        for (let i = 0; i < shipSize; i++) {
            const currentCellIndex = startIndex + (isHorizontal ? i : i * boardSize);
            if (currentCellIndex < boardSize * boardSize) { // Ensure index is within bounds
                const targetCell = boardCells[currentCellIndex];
                if (targetCell) {
                    if (valid) {
                        targetCell.classList.add('placement-hover');
                    } else {
                        targetCell.classList.add('placement-invalid');
                    }
                }
            }
        }
    }

    function handlePlayerBoardLeave() {
        if (!isPlacementPhase) return;
        Array.from(playerBoard.children).forEach(c => c.classList.remove('placement-hover', 'placement-invalid'));
    }

    function handlePlayerBoardClickForPlacement(e) {
        if (!isPlacementPhase || !selectedShipName) return;

        const cell = e.target;
        const startIndex = parseInt(cell.dataset.id);
        const shipType = shipTypes.find(s => s.name === selectedShipName);
        const shipSize = shipType.size;
        const isHorizontal = currentOrientation === 'horizontal';
        const boardCells = playerBoard.children;

        // Get current coordinates of the ship being moved, if any
        const shipBeingMoved = playerPlacedShips.find(s => s.name === selectedShipName);
        const currentShipCoords = shipBeingMoved ? shipBeingMoved.coordinates : [];

        if (isValidPlacement(startIndex, shipSize, isHorizontal, playerShipCoords, currentShipCoords)) {
            // If moving an existing ship, remove its old position
            if (shipBeingMoved) {
                shipBeingMoved.coordinates.forEach(coord => {
                    playerBoard.children[coord].classList.remove('ship');
                    playerShipCoords.delete(coord);
                });
                // Remove from playerPlacedShips temporarily
                playerPlacedShips = playerPlacedShips.filter(s => s.name !== selectedShipName);
            }

            const newShipCoords = [];
            for (let i = 0; i < shipSize; i++) {
                const currentCellIndex = startIndex + (isHorizontal ? i : i * boardSize);
                boardCells[currentCellIndex].classList.add('ship');
                playerShipCoords.add(currentCellIndex);
                newShipCoords.push(currentCellIndex);
            }
            playerPlacedShips.push({ name: selectedShipName, hits: [], coordinates: newShipCoords });

            // Update ship item in list to show it's placed
            const shipItem = document.querySelector(`.ship-item[data-ship-name='${selectedShipName}']`);
            if (shipItem) {
                shipItem.classList.remove('selected');
                shipItem.classList.add('placed');
            }

            selectedShipName = null; // Deselect ship
            messageArea.textContent = `Placed ${shipType.name}.`;
            Array.from(boardCells).forEach(c => c.classList.remove('placement-hover', 'placement-invalid'));

            if (playerPlacedShips.length === shipTypes.length) {
                messageArea.textContent = 'All ships placed! Click Start Game.';
                startGameButton.disabled = false;
            } else {
                startGameButton.disabled = true;
            }
        } else {
            messageArea.textContent = 'Invalid placement. Try again.';
        }
    }

    function selectShip(shipName) {
        // If a ship is currently selected, deselect it first
        if (selectedShipName) {
            const prevSelectedItem = document.querySelector(`.ship-item[data-ship-name='${selectedShipName}']`);
            if (prevSelectedItem) prevSelectedItem.classList.remove('selected');
        }

        selectedShipName = shipName;
        const selectedItem = document.querySelector(`.ship-item[data-ship-name='${shipName}']`);
        if (selectedItem) selectedItem.classList.add('selected');
        messageArea.textContent = `Selected ${shipName}. Place it on your board.`;

        // If the selected ship was already placed, remove it from the board temporarily
        const shipToEdit = playerPlacedShips.find(s => s.name === shipName);
        if (shipToEdit) {
            shipToEdit.coordinates.forEach(coord => {
                playerBoard.children[coord].classList.remove('ship');
                playerShipCoords.delete(coord);
            });
            playerPlacedShips = playerPlacedShips.filter(s => s.name !== shipName);
            // Re-enable start game button if it was disabled due to picking up a ship
            startGameButton.disabled = true;
        }
    }

    function rotateShip() {
        currentOrientation = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        rotateButton.textContent = `Rotate Ship (${currentOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'})`;
        messageArea.textContent = `Orientation set to ${currentOrientation}.`;
        // Trigger a hover update if a ship is selected and mouse is over the board
        const event = new Event('mouseover');
        playerBoard.dispatchEvent(event);
    }

    function initPlacementPhase() {
        isPlacementPhase = true;
        isGameOver = false;
        currentPlayer = 'player';
        selectedShipName = null;
        currentOrientation = 'horizontal';
        playerPlacedShips = [];
        playerShipCoords.clear();
        enemyFiredShots.clear();

        // Clear boards
        createBoard(playerBoard, true);
        createBoard(enemyBoard, false);

        // Show placement controls, hide game info
        placementControls.style.display = 'block';
        document.getElementById('game-info').style.display = 'none';
        enemyBoard.style.pointerEvents = 'none'; // Disable enemy board during placement

        messageArea.textContent = 'Place your ships on the board.';
        turnInfo.textContent = ''; // Clear turn info during placement
        startGameButton.disabled = true;
        rotateButton.textContent = 'Rotate Ship (Horizontal)';

        // Populate ship list
        shipListContainer.innerHTML = '';
        shipTypes.forEach(shipType => {
            const shipItem = document.createElement('div');
            shipItem.classList.add('ship-item');
            shipItem.dataset.shipName = shipType.name;
            shipItem.textContent = `${shipType.name} (${shipType.size})`;
            shipItem.addEventListener('click', () => selectShip(shipType.name));
            shipListContainer.appendChild(shipItem);
        });

        // Add placement listeners to player board
        playerBoard.addEventListener('mouseover', handlePlayerBoardHover);
        playerBoard.addEventListener('mouseout', handlePlayerBoardLeave);
        playerBoard.addEventListener('click', handlePlayerBoardClickForPlacement);

        rotateButton.addEventListener('click', rotateShip);
        startGameButton.addEventListener('click', finalizeGameStart);
    }

    function finalizeGameStart() {
        isPlacementPhase = false;
        placementControls.style.display = 'none';
        document.getElementById('game-info').style.display = 'block';
        enemyBoard.style.pointerEvents = 'auto'; // Enable enemy board for gameplay

        enemyShips = placeEnemyShips();
        playerShips = playerPlacedShips; // Use the ships player placed

        messageArea.textContent = 'The battle begins! Your turn.';
        turnInfo.textContent = 'Your Turn';

        // Remove placement listeners from player board
        playerBoard.removeEventListener('mouseover', handlePlayerBoardHover);
        playerBoard.removeEventListener('mouseout', handlePlayerBoardLeave);
        playerBoard.removeEventListener('click', handlePlayerBoardClickForPlacement);
    }

    function handleCellClick(e) {
        if (isPlacementPhase || currentPlayer !== 'player' || isGameOver) return;

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
            playerBoard.style.pointerEvents = 'none'; // Disable player board too
        }
        return isGameOver;
    }

    newGameButton.addEventListener('click', initPlacementPhase);

    initPlacementPhase(); // Start with placement phase
});
