interface Position {
  lat: number;
  lon: number;
}

interface WorkerMessage {
  type: 'ADD_POSITION' | 'GET_PATH' | 'CLEAR_PATH' | 'INIT';
  position?: Position;
  initialPath?: Position[];
}

interface WorkerResponse {
  type: 'PATH_UPDATED' | 'PATH_DATA' | 'INITIALIZED';
  path: Position[];
  position?: Position;
}

let path: Position[] = [];
let lastPosition: Position | null = null;
// Maximum points in worker memory - 1 million points
// At 1Hz GPS frequency: 1M points = 277+ hours (11+ days) of continuous tracking
// At 10Hz: 27+ hours of tracking
const MAX_POINTS = 1000000;

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, position, initialPath } = event.data;

  switch (type) {
    case 'INIT':
      if (initialPath) {
        path = initialPath;
        console.log('Worker initialized with', path.length, 'points');
      }
      self.postMessage({
        type: 'INITIALIZED',
        path,
      } as WorkerResponse);
      break;

    case 'ADD_POSITION':
      if (position) {
        // Check if position changed
        const positionChanged = !lastPosition || 
          lastPosition.lat !== position.lat || 
          lastPosition.lon !== position.lon;

        if (positionChanged) {
          path = [...path, position];
          
          // Limit to MAX_POINTS
          if (path.length > MAX_POINTS) {
            path = path.slice(-MAX_POINTS);
          }

          lastPosition = position;

          // Send update back to main thread
          self.postMessage({
            type: 'PATH_UPDATED',
            path,
            position,
          } as WorkerResponse);
        }
      }
      break;

    case 'GET_PATH':
      self.postMessage({
        type: 'PATH_DATA',
        path,
      } as WorkerResponse);
      break;

    case 'CLEAR_PATH':
      path = [];
      lastPosition = null;
      self.postMessage({
        type: 'PATH_UPDATED',
        path,
      } as WorkerResponse);
      break;
  }
};

export {};
