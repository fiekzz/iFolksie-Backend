const workerURL = new URL("worker.ts", import.meta.url).href;
const worker = new Worker(workerURL);

worker.postMessage('hello')