class Match3Game {
    constructor() {
        this.size = 8;
        this.board = [];
        this.score = 0;
        this.moves = 10;
        this.selectedCell = null;
        this.isProcessing = false;
        this.lastSwappedSpecial = null; // Для отслеживания обмена с радугой
        
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
        
        // Специальные элементы
        this.specialItems = {
            bomb: { name: 'bomb', color: '#3498db', image: 'assets/icons/bomb.png' },
            rainbow: { name: 'rainbow', color: '#9b59b6', image: 'assets/icons/rainbow.png' }
        };
        
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
        const allItems = [...this.items, ...Object.values(this.specialItems)];
        const promises = allItems.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`Loaded: ${item.name}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load: ${item.image}`);
                    resolve();
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
            this.createBoard();
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
                
                // Добавляем иконку для специальных элементов
                if (item.isBomb) {
                    img.classList.add('bomb-item');
                    const bombIcon = document.createElement('div');
                    bombIcon.className = 'special-icon bomb-icon';
                    bombIcon.textContent = '💣';
                    cell.appendChild(bombIcon);
                } else if (item.isRainbow) {
                    img.classList.add('rainbow-item');
                    const rainbowIcon = document.createElement('div');
                    rainbowIcon.className = 'special-icon rainbow-icon';
                    rainbowIcon.textContent = '🌈';
                    cell.appendChild(rainbowIcon);
                }
                
                img.onerror = () => {
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
                    if (item.isBomb) {
                        fallback.textContent = '💣';
                    } else if (item.isRainbow) {
                        fallback.textContent = '🌈';
                    } else {
                        fallback.textContent = item.name.charAt(0).toUpperCase();
                    }
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
        // Проверяем, есть ли радужный элемент в обмене
        const item1 = this.board[row1][col1];
        const item2 = this.board[row2][col2];
        
        const hasRainbow = item1.isRainbow || item2.isRainbow;
        
        if (hasRainbow) {
            // Если обмениваем радугу, запоминаем тип элемента для активации
            this.lastSwappedSpecial = {
                rainbowRow: item1.isRainbow ? row1 : row2,
                rainbowCol: item1.isRainbow ? col1 : col2,
                targetType: item1.isRainbow ? item2.name : item1.name
            };
        } else {
            this.lastSwappedSpecial = null;
        }
        
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
            
            // Если был обмен с радугой, но не было совпадений - отменяем
            this.lastSwappedSpecial = null;
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
        const visited = new Set();
        
        // По горизонтали
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size - 2; col++) {
                const item = this.board[row][col];
                const key = `${row},${col}`;
                
                if (visited.has(key)) continue;
                
                // Считаем длину совпадения
                let length = 1;
                while (col + length < this.size && 
                       this.board[row][col + length].name === item.name) {
                    length++;
                }
                
                if (length >= 3) {
                    matches.push({ 
                        row, 
                        col, 
                        length, 
                        direction: 'horizontal',
                        type: this.getMatchType(length)
                    });
                    
                    // Помечаем все ячейки как посещённые
                    for (let i = 0; i < length; i++) {
                        visited.add(`${row},${col + i}`);
                    }
                    
                    col += length - 1; // Пропускаем проверенные ячейки
                }
            }
        }
        
        // По вертикали
        for (let col = 0; col < this.size; col++) {
            for (let row = 0; row < this.size - 2; row++) {
                const item = this.board[row][col];
                const key = `${row},${col}`;
                
                if (visited.has(key)) continue;
                
                // Считаем длину совпадения
                let length = 1;
                while (row + length < this.size && 
                       this.board[row + length][col].name === item.name) {
                    length++;
                }
                
                if (length >= 3) {
                    matches.push({ 
                        row, 
                        col, 
                        length, 
                        direction: 'vertical',
                        type: this.getMatchType(length)
                    });
                    
                    // Помечаем все ячейки как посещённые
                    for (let i = 0; i < length; i++) {
                        visited.add(`${row + i},${col}`);
                    }
                    
                    row += length - 1; // Пропускаем проверенные ячейки
                }
            }
        }
        
        return matches;
    }
    
    getMatchType(length) {
        if (length >= 5) return 'rainbow';  // 5+ в ряд = радужный
        if (length >= 4) return 'bomb';     // 4 в ряд = бомба
        return 'normal';                    // 3 в ряд = обычный
    }
    
    async processMatches(matches) {
        this.isProcessing = true;
        
        // Собираем все ячейки для удаления
        const cellsToClear = new Set();
        const specialItemsToCreate = [];
        const bombActivations = []; // Бомбы, которые нужно активировать
        
        matches.forEach(match => {
            const matchedItems = [];
            
            for (let i = 0; i < match.length; i++) {
                const row = match.direction === 'horizontal' ? match.row : match.row + i;
                const col = match.direction === 'horizontal' ? match.col + i : match.col;
                const key = `${row},${col}`;
                
                cellsToClear.add(key);
                matchedItems.push({ row, col, item: this.board[row][col] });
                
                // Проверяем, есть ли бомба в совпадении
                if (this.board[row][col].isBomb) {
                    bombActivations.push({ row, col });
                }
            }
            
            // Создаём специальный элемент в центре комбинации (если это не бомба/радуга)
            if (match.type === 'bomb' || match.type === 'rainbow') {
                const centerIndex = Math.floor(match.length / 2);
                const centerRow = match.direction === 'horizontal' 
                    ? match.row 
                    : match.row + centerIndex;
                const centerCol = match.direction === 'horizontal' 
                    ? match.col + centerIndex 
                    : match.col;
                
                // Создаём специальный элемент ТОЛЬКО если там не бомба/радуга
                const existingItem = this.board[centerRow][centerCol];
                if (!existingItem.isBomb && !existingItem.isRainbow) {
                    let specialItem;
                    if (match.type === 'bomb') {
                        specialItem = { ...this.specialItems.bomb, isBomb: true };
                    } else if (match.type === 'rainbow') {
                        specialItem = { ...this.specialItems.rainbow, isRainbow: true };
                    }
                    
                    specialItemsToCreate.push({
                        row: centerRow,
                        col: centerCol,
                        item: specialItem
                    });
                }
            }
        });
        
        // Добавляем очки за обычные совпадения
        this.score += cellsToClear.size * 10;
        
        // Обрабатываем активацию бомб
        for (const bomb of bombActivations) {
            await this.activateBomb(bomb.row, bomb.col, cellsToClear);
        }
        
        // Обрабатываем активацию радуги (если была)
        if (this.lastSwappedSpecial) {
            await this.activateRainbow(
                this.lastSwappedSpecial.rainbowRow,
                this.lastSwappedSpecial.rainbowCol,
                this.lastSwappedSpecial.targetType,
                cellsToClear
            );
            this.lastSwappedSpecial = null;
        }
        
        // Анимация удаления
        await this.animateMatches(cellsToClear);
        
        // Заполняем пустые ячейки и создаём специальные элементы
        await this.fillEmptyCells(cellsToClear, specialItemsToCreate);
        
        // Рекурсивно проверяем новые совпадения
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.processMatches(newMatches);
        }
        
        this.isProcessing = false;
    }
    
    async activateBomb(row, col, cellsToClear) {
        console.log('💣 Бомба взорвалась в', row, col);
        
        // Бомба уничтожает 3х3 область вокруг себя
        for (let r = Math.max(0, row - 1); r <= Math.min(this.size - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.size - 1, col + 1); c++) {
                cellsToClear.add(`${r},${c}`);
            }
        }
        
        // Дополнительные очки за бомбу
        this.score += 50;
        
        // Показываем анимацию взрыва
        await this.showExplosionAnimation(row, col);
    }
    
    async activateRainbow(row, col, targetName, cellsToClear) {
        console.log('🌈 Радуга активирована, уничтожаем:', targetName);
        
        // Радужный элемент уничтожает ВСЕ элементы указанного типа на доске
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c].name === targetName) {
                    cellsToClear.add(`${r},${c}`);
                }
            }
        }
        
        // Также уничтожаем сам радужный элемент
        cellsToClear.add(`${row},${col}`);
        
        // Дополнительные очки за радугу
        this.score += 100;
        
        // Показываем анимацию радуги
        await this.showRainbowAnimation(row, col);
    }
    
    async showExplosionAnimation(row, col) {
        return new Promise(resolve => {
            const boardElement = document.getElementById('game-board');
            const cell = boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            
            if (cell) {
                cell.style.animation = 'explosion 0.5s ease';
                cell.style.boxShadow = '0 0 30px #ff6b6b, 0 0 60px #ff4757';
                
                setTimeout(() => {
                    cell.style.animation = '';
                    cell.style.boxShadow = '';
                    resolve();
                }, 500);
            } else {
                resolve();
            }
        });
    }
    
    async showRainbowAnimation(row, col) {
        return new Promise(resolve => {
            const boardElement = document.getElementById('game-board');
            const cells = boardElement.querySelectorAll('.cell');
            
            cells.forEach(cell => {
                cell.style.animation = 'rainbow-pulse 0.5s ease';
            });
            
            setTimeout(() => {
                cells.forEach(cell => {
                    cell.style.animation = '';
                });
                resolve();
            }, 500);
        });
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
    
    async fillEmptyCells(cellsToClear, specialItemsToCreate) {
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
        
        // Создаём специальные элементы
        for (const special of specialItemsToCreate) {
            this.board[special.row][special.col] = special.item;
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
        this.lastSwappedSpecial = null;
        
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
