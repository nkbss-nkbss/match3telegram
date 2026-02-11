class Match3Game {
    constructor() {
        this.size = 8;
        this.board = [];
        this.score = 0;
        this.moves = 10;
        this.selectedCell = null;
        this.isProcessing = false;
        
        // Массив изображений
        this.items = [
            { name: 'apple', color: '#ff6b6b', image: 'assets/icons/apple.png' },
            { name: 'orange', color: '#ffa500', image: 'assets/icons/orange.png' },
            { name: 'lemon', color: '#f4d03f', image: 'assets/icons/lemon.png' },
            { name: 'grape', color: '#8e44ad', image: 'assets/icons/grape.png' },
            { name: 'cherry', color: '#e74c3c', image: 'assets/icons/cherry.png' },
            { name: 'strawberry', color: '#c0392b', image: 'assets/icons/strawberry.png' },
            { name: 'peach', color: '#f39c12', image: 'assets/icons/peach.png' },
            { name: 'kiwi', color: '#27ae60', image: 'assets/icons/kiwi.png' }
        ];
        
        this.imagesLoaded = false;
        this.init();
    }
    
    init() {
        this.preloadImages().then(() => {
            this.imagesLoaded = true;
            this.startGame();
        });
    }
    
    async preloadImages() {
        const promises = this.items.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`Loaded: ${item.name}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load: ${item.image}`);
                    resolve(); // Продолжаем даже если изображение не загрузилось
                };
                img.src = item.image;
            });
        });
        await Promise.all(promises);
    }
    
    startGame() {
        this.createBoard();
        this.renderBoard();
        this.updateStats();
        this.addEventListeners();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.size; row++) {
            const rowArray = [];
            for (let col = 0; col < this.size; col++) {
                rowArray.push(this.getRandomItem());
            }
            this.board.push(rowArray);
        }
        
        // Убираем начальные совпадения
        this.removeMatches();
        
        // Проверяем, есть ли возможные ходы
        if (!this.hasPossibleMoves()) {
            console.log('No possible moves, regenerating board...');
            this.createBoard(); // Рекурсивно пересоздаём
        }
    }
    
    getRandomItem() {
        return this.items[Math.floor(Math.random() * this.items.length)];
    }
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        if (!boardElement) return;
        
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const item = this.board[row][col];
                
                // Создаём изображение
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.name;
                img.draggable = false;
                img.onerror = () => {
                    // Если изображение не загрузилось, показываем цветной кружок
                    img.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.style.width = '80%';
                    fallback.style.height = '80%';
                    fallback.style.borderRadius = '50%';
                    fallback.style.backgroundColor = item.color;
                    fallback.style.display = 'flex';
                    fallback.style.justifyContent = 'center';
                    fallback.style.alignItems = 'center';
                    fallback.style.color = 'white';
                    fallback.style.fontWeight = 'bold';
                    fallback.textContent = item.name.charAt(0).toUpperCase();
                    cell.appendChild(fallback);
                };
                
                cell.appendChild(img);
                boardElement.appendChild(cell);
            }
        }
    }
    
    addEventListeners() {
        const boardElement = document.getElementById('game-board');
        if (!boardElement) return;
        
        boardElement.addEventListener('click', (e) => {
            if (this.isProcessing || this.moves <= 0) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (!this.selectedCell) {
                // Выбираем первую ячейку
                this.selectedCell = { row, col, element: cell };
                cell.classList.add('selected');
            } else {
                // Пытаемся поменять местами
                const prevRow = this.selectedCell.row;
                const prevCol = this.selectedCell.col;
                
                // Снимаем выделение
                this.selectedCell.element.classList.remove('selected');
                
                // Проверяем, соседние ли ячейки
                if (this.areAdjacent(prevRow, prevCol, row, col)) {
                    this.swapCells(prevRow, prevCol, row, col);
                }
                
                this.selectedCell = null;
            }
        });
        
        // Кнопка рестарта
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }
    }
    
    areAdjacent(row1, col1, row2, col2) {
        return (
            (Math.abs(row1 - row2) === 1 && col1 === col2) ||
            (Math.abs(col1 - col2) === 1 && row1 === row2)
        );
    }
    
    async swapCells(row1, col1, row2, col2) {
        // Меняем местами в данных
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        // Обновляем отображение
        this.renderBoard();
        
        // Проверяем совпадения
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.moves--;
            await this.processMatches(matches);
        } else {
            // Возвращаем обратно
            const temp = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp;
            this.renderBoard();
        }
        
        this.updateStats();
        
        // Проверяем, остались ли возможные ходы
        if (this.moves > 0 && !this.hasPossibleMoves()) {
            await this.regenerateBoard();
        }
        
        // Проверка конца игры
        if (this.moves <= 0) {
            this.gameOver();
        }
    }
    
    findMatches() {
        const matches = [];
        
        // По горизонтали
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size - 2; col++) {
                const item = this.board[row][col];
                if (item.name === this.board[row][col + 1].name && 
                    item.name === this.board[row][col + 2].name) {
                    matches.push({ row, col, length: 3, direction: 'horizontal' });
                }
            }
        }
        
        // По вертикали
        for (let col = 0; col < this.size; col++) {
            for (let row = 0; row < this.size - 2; row++) {
                const item = this.board[row][col];
                if (item.name === this.board[row + 1][col].name && 
                    item.name === this.board[row + 2][col].name) {
                    matches.push({ row, col, length: 3, direction: 'vertical' });
                }
            }
        }
        
        return matches;
    }
    
    async processMatches(matches) {
        this.isProcessing = true;
        
        // Помечаем совпадения
        const cellsToClear = new Set();
        
        matches.forEach(match => {
            for (let i = 0; i < match.length; i++) {
                const key = match.direction === 'horizontal' 
                    ? `${match.row},${match.col + i}`
                    : `${match.row + i},${match.col}`;
                cellsToClear.add(key);
            }
        });
        
        // Добавляем очки
        this.score += cellsToClear.size * 10;
        
        // Анимация удаления
        await this.animateMatches(cellsToClear);
        
        // Заполняем пустые ячейки
        await this.fillEmptyCells(cellsToClear);
        
        // Рекурсивно проверяем новые совпадения
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.processMatches(newMatches);
        }
        
        this.isProcessing = false;
    }
    
    async animateMatches(cellsToClear) {
        return new Promise(resolve => {
            const boardElement = document.getElementById('game-board');
            const cells = boardElement.querySelectorAll('.cell');
            
            cells.forEach(cell => {
                const row = cell.dataset.row;
                const col = cell.dataset.col;
                const key = `${row},${col}`;
                
                if (cellsToClear.has(key)) {
                    cell.classList.add('matched');
                }
            });
            
            setTimeout(() => {
                cells.forEach(cell => {
                    if (cell.classList.contains('matched')) {
                        cell.innerHTML = '';
                        cell.classList.remove('matched');
                    }
                });
                resolve();
            }, 300);
        });
    }
    
    async fillEmptyCells(cellsToClear) {
        // Создаем массив пустых ячеек
        const emptyCells = Array.from(cellsToClear);
        
        // Заполняем сверху вниз
        for (let col = 0; col < this.size; col++) {
            let emptyCount = 0;
            
            // Считаем пустые в колонке
            for (let row = this.size - 1; row >= 0; row--) {
                const key = `${row},${col}`;
                if (cellsToClear.has(key)) {
                    emptyCount++;
                } else if (emptyCount > 0) {
                    // Сдвигаем ячейку вниз
                    this.board[row + emptyCount][col] = this.board[row][col];
                }
            }
            
            // Заполняем новые ячейки сверху
            for (let row = 0; row < emptyCount; row++) {
                this.board[row][col] = this.getRandomItem();
            }
        }
        
        // Плавное обновление доски
        await this.animateBoardUpdate();
    }
    
    async animateBoardUpdate() {
        return new Promise(resolve => {
            this.renderBoard();
            setTimeout(resolve, 200);
        });
    }
    
    removeMatches() {
        let matches = this.findMatches();
        while (matches.length > 0) {
            matches.forEach(match => {
                for (let i = 0; i < match.length; i++) {
                    const row = match.direction === 'horizontal' ? match.row : match.row + i;
                    const col = match.direction === 'horizontal' ? match.col + i : match.col;
                    this.board[row][col] = this.getRandomItem();
                }
            });
            matches = this.findMatches();
        }
    }
    
    // Проверка наличия возможных ходов
    hasPossibleMoves() {
        // Проверяем каждую ячейку
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // Проверяем 4 направления: вверх, вниз, влево, вправо
                const directions = [
                    { dr: -1, dc: 0 }, // вверх
                    { dr: 1, dc: 0 },  // вниз
                    { dr: 0, dc: -1 }, // влево
                    { dr: 0, dc: 1 }   // вправо
                ];
                
                for (const dir of directions) {
                    const newRow = row + dir.dr;
                    const newCol = col + dir.dc;
                    
                    // Проверяем, что новая ячейка в пределах доски
                    if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                        // Меняем ячейки местами
                        const temp = this.board[row][col];
                        this.board[row][col] = this.board[newRow][newCol];
                        this.board[newRow][newCol] = temp;
                        
                        // Проверяем, есть ли совпадения
                        const matches = this.findMatches();
                        
                        // Возвращаем ячейки обратно
                        this.board[newRow][newCol] = this.board[row][col];
                        this.board[row][col] = temp;
                        
                        // Если есть совпадения, значит ход возможен
                        if (matches.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Нет возможных ходов
        return false;
    }
    
    async regenerateBoard() {
        console.log('No possible moves left. Regenerating board...');
        
        // Показываем сообщение
        const boardElement = document.getElementById('game-board');
        if (boardElement) {
            const message = document.createElement('div');
            message.style.position = 'absolute';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            message.style.color = 'white';
            message.style.padding = '15px 30px';
            message.style.borderRadius = '25px';
            message.style.fontSize = '18px';
            message.style.fontWeight = 'bold';
            message.style.zIndex = '100';
            message.textContent = '🔄 Перетасовка...';
            boardElement.appendChild(message);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Удаляем сообщение
            message.remove();
        }
        
        // Пересоздаём доску
        this.createBoard();
        this.renderBoard();
    }
    
    updateStats() {
        const scoreEl = document.getElementById('score');
        const movesEl = document.getElementById('moves');
        if (scoreEl) scoreEl.textContent = this.score;
        if (movesEl) movesEl.textContent = this.moves;
    }
    
    resetGame() {
        console.log('Resetting game...');
        this.score = 0;
        this.moves = 10;
        this.selectedCell = null;
        this.isProcessing = false;
        
        this.createBoard();
        this.renderBoard();
        this.updateStats();
        
        console.log('Game reset complete');
    }
    
    gameOver() {
        // Сохраняем результат в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                score: this.score,
                moves: this.moves
            }));
        }
        
        alert(`Игра окончена! Ваш счёт: ${this.score}`);
    }
}

// Инициализация игры
let game;

window.addEventListener('DOMContentLoaded', () => {
    console.log('Game initializing...');
    game = new Match3Game();
});
