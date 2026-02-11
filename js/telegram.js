// Инициализация Telegram Web App
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Настройка темы
        tg.expand();
        tg.ready();
        
        // Применяем тему из Telegram
        document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';
        
        // Кнопка "Поделиться результатом"
        tg.MainButton.text = "Поделиться результатом";
        tg.MainButton.show();
        
        tg.MainButton.onClick(() => {
            if (game) {
                const message = `🎮 Match-3\n\nЯ набрал ${game.score} очков!\nПопробуй побить мой рекорд!`;
                tg.shareText(message);
            }
        });
        
        // Сохранение прогресса
        window.addEventListener('beforeunload', () => {
            if (game && game.score > 0) {
                localStorage.setItem('match3_save', JSON.stringify({
                    score: game.score,
                    moves: game.moves,
                    timestamp: Date.now()
                }));
            }
        });
        
        // Загрузка сохранения
        const savedGame = localStorage.getItem('match3_save');
        if (savedGame) {
            try {
                const data = JSON.parse(savedGame);
                const age = Date.now() - data.timestamp;
                
                // Загружаем сохранение только если оно не старше 24 часов
                if (age < 24 * 60 * 60 * 1000 && data.score > 0) {
                    console.log('Загружено сохранение:', data);
                }
            } catch (e) {
                console.error('Ошибка загрузки сохранения:', e);
            }
        }
    }
});