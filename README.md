# Winner Card

## Запуск в VS Code

1. Открой папку проекта `Winner Card` в VS Code.
2. Открой файл `index.html`.
3. Нажми `Go Live`.
4. Если браузер не открылся сам, открой вручную:

```text
http://127.0.0.1:5500/index.html
```

Иногда Live Server использует другой порт. Тогда посмотри адрес в нижней панели VS Code или в уведомлении Live Server.

## Если кнопки не нажимаются

1. Обнови страницу с очисткой кэша:
   `Cmd + Shift + R` на Mac или `Ctrl + F5` на Windows.
2. Если раньше устанавливал игру как PWA, удали старую иконку с телефона и открой сайт заново.
3. В Chrome можно очистить кэш сайта:
   `DevTools -> Application -> Storage -> Clear site data`.

В режиме `localhost` игра автоматически отключает старый service worker, чтобы Live Server не показывал закэшированные файлы.

## GitHub Pages

Загрузи все файлы в репозиторий и включи:

```text
Settings -> Pages -> Deploy from branch
```

После публикации игра будет работать как PWA и сможет сохранять настройки/партию в IndexedDB.
