import { createApp } from '@/core/App';
import { updates } from '@/systems/UpdateSystem';
import '@/styles/global.css';

const root = document.getElementById('zhorror-root');

if (!root) {
  throw new Error('Корневой элемент #zhorror-root не найден');
}

updates.start();
void createApp(root);