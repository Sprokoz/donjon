import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as {__DUNGEON_BOUNCER_BOOTED__?: boolean}).__DUNGEON_BOUNCER_BOOTED__ = true;
createRoot(document.getElementById('root')!).render(<App />);
