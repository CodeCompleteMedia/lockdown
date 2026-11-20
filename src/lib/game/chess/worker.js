// Runs the computer's search off the main thread so the 3D view never stalls.
import { search } from './ai.js';

onmessage = e => {
  const { id, position, budget } = e.data;
  postMessage({ id, found: search(position, budget) });
};
