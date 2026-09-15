//! ==========================================================================
//! WebLLM Background Worker
//! ==========================================================================
//* Runs model computation in a separate thread so the browser UI stays smooth.

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const engineHandler = new WebWorkerMLCEngineHandler();

self.onmessage = (messageEvent) => {
  engineHandler.onmessage(messageEvent);
};
