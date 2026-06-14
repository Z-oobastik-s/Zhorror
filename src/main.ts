import { createApp } from '@/core/App';
import '@/styles/global.css';

const root = document.getElementById('zhorror-root');

if (!root) {
  throw new Error('Корневой элемент #zhorror-root не найден');
}

void createApp(root);
