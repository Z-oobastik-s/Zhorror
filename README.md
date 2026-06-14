# Zhorror

Премиальный интерактивный хоррор-проект от **Zoobastiks**.

Цифровой архив проклятых записей. Не сайт, а портал в мрачную вселенную.

## Стек

- TypeScript
- Vite
- Canvas API + WebGL
- GitHub Pages + GitHub Actions

## Локальная разработка

```cmd
npm install
npm run dev
```

## Сборка

```cmd
npm run build
```

## Деплой

При каждом push в ветку `main` GitHub Actions автоматически собирает и публикует сайт.

**URL:** https://z-oobastik-s.github.io/Zhorror/

### Первоначальная настройка GitHub Pages

1. Запушьте репозиторий в https://github.com/Z-oobastik-s/Zhorror.git
2. Settings > Pages > Source: **GitHub Actions**
3. После первого push workflow опубликует сайт автоматически

## Структура

```
src/
  core/       - движок, приложение, события
  systems/    - скролл, атмосфера, звук, защита, события
  render/     - Canvas, WebGL, частицы, эффекты
  scenes/     - сцены (Hero, Archive, Entity, Ritual, Void)
  components/ - навигация, загрузка
  config/     - константы, палитра
  utils/      - математика, easing
  styles/     - глобальные стили
```

## Автор

**Zoobastiks** - создатель цифровой вселенной Zhorror.
