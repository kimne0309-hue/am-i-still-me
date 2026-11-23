/**
 * Entry point: bootstraps AppContext, background layers, and the scene manager.
 */
import './styles/base.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = '<p>Am I Still Me?</p>';
}
