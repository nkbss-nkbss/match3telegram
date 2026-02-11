class Match3Game {
    constructor() {
        this.size = 8;
        this.board = [];
        this.score = 0;
        this.moves = 10;
        this.selectedCell = null;
        this.isProcessing = false;
        
        this.emojis = ['🍎', '🍊', '🍋', '🍇', '🍒', '🍓', '🍑', '🥝'];
        
        this.init();
    }
    
    init() {
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
                rowArray.push(this.getRandomEmoji());
            }
            this.board.push(rowArray);
        }
        
        // Убираем начальные совпадения
        this.removeMatches();
    }
    
    getRandomEmoji() {
        return this.emojis[Math.floor(Math.random() * this.emojis.length)];
    }
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.board[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    addEventListeners() {
        const boardElement = document.getElementById('game-board');
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
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });
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
                const emoji = this.board[row][col];
                if (emoji === this.board[row][col + 1] && 
                    emoji === this.board[row][col + 2]) {
                    matches.push({ row, col, length: 3, direction: 'horizontal' });
                }
            }
        }
        
        // По вертикали
        for (let col = 0; col < this.size; col++) {
            for (let row = 0; row < this.size - 2; row++) {
                const emoji = this.board[row][col];
                if (emoji === this.board[row + 1][col] && 
                    emoji === this.board[row + 2][col]) {
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
                        cell.textContent = '';
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
                this.board[row][col] = this.getRandomEmoji();
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
    
    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }
    
    resetGame() {
        this.score = 0;
        this.moves = 10;
        this.selectedCell = null;
        this.createBoard();
        this.renderBoard();
        this.updateStats();
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
    game = new Match3Game();
});
