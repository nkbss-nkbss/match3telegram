// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Настройка темы
    tg.expand();
    tg.ready();
    
    // Тема в соответствии с Telegram
    document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';
    document.body.style.color = tg.textColor || '#000000';
    
    // Кнопка "Закрыть"
    tg.MainButton.text = "Поделиться результатом";
    tg.MainButton.show();
    
    tg.MainButton.onClick(() => {
        if (game) {
            const message = `Я набрал ${game.score} очков в Match-3! Попробуй побить мой рекорд!`;
            tg.shareText(message);
        }
    });
    
    // Сохранение прогресса
    window.addEventListener('beforeunload', () => {
        if (game) {
            localStorage.setItem('match3_save', JSON.stringify({
                score: game.score,
                moves: game.moves,
                board: game.board,
                timestamp: Date.now()
            }));
        }
    });
    
    // Загрузка сохранения
    const savedGame = localStorage.getItem('match3_save');
    if (savedGame) {
        const data = JSON.parse(savedGame);
        // Можно добавить логику восстановления
    }
}
