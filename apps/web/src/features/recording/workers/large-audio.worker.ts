type WorkerCommand =
  | {
      type: 'START';
      payload: {
        sessionId: string;
        file: File;
        chunkSize: number;
      };
    }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CANCEL' };

type WorkerEvent =
  | {
      type: 'PROGRESS';
      payload: {
        sessionId: string;
        uploadedBytes: number;
        totalBytes: number;
        progress: number;
      };
    }
  | {
      type: 'DONE';
      payload: {
        sessionId: string;
        digest: number;
      };
    }
  | {
      type: 'ERROR';
      payload: {
        sessionId: string;
        message: string;
      };
    }
  | {
      type: 'CANCELED';
      payload: {
        sessionId: string;
      };
    };

let paused = false;
let canceled = false;
let isRunning = false;

function post(event: WorkerEvent) {
  self.postMessage(event);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitIfPaused() {
  while (paused && !canceled) {
    await sleep(120);
  }
}

function lightweightDigest(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let hash = 2166136261;

  for (let index = 0; index < bytes.length; index += 512) {
    hash ^= bytes[index] ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

async function handleStart(sessionId: string, file: File, chunkSize: number) {
  if (isRunning) {
    post({
      type: 'ERROR',
      payload: {
        sessionId,
        message: 'Worker is busy with another large file.'
      }
    });
    return;
  }

  isRunning = true;
  paused = false;
  canceled = false;

  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / chunkSize);
  let uploadedBytes = 0;
  let digest = 0;

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      if (canceled) {
        post({ type: 'CANCELED', payload: { sessionId } });
        return;
      }

      await waitIfPaused();
      const offset = chunkIndex * chunkSize;
      const chunk = file.slice(offset, Math.min(offset + chunkSize, totalBytes));

      const buffer = await chunk.arrayBuffer();
      digest = (digest + lightweightDigest(buffer)) % 1_000_000_007;

      // Simulate heavy processing to mimic local long-file pipeline.
      const simulatedLatency = Math.min(260, 60 + Math.round(chunk.size / (1024 * 80)));
      await sleep(simulatedLatency);

      uploadedBytes += chunk.size;
      post({
        type: 'PROGRESS',
        payload: {
          sessionId,
          uploadedBytes,
          totalBytes,
          progress: Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
        }
      });
    }

    post({
      type: 'DONE',
      payload: {
        sessionId,
        digest
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worker error.';
    post({
      type: 'ERROR',
      payload: {
        sessionId,
        message
      }
    });
  } finally {
    isRunning = false;
    paused = false;
    canceled = false;
  }
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const data = event.data;

  if (data.type === 'PAUSE') {
    paused = true;
    return;
  }

  if (data.type === 'RESUME') {
    paused = false;
    return;
  }

  if (data.type === 'CANCEL') {
    canceled = true;
    paused = false;
    return;
  }

  if (data.type === 'START') {
    void handleStart(data.payload.sessionId, data.payload.file, data.payload.chunkSize);
  }
};
