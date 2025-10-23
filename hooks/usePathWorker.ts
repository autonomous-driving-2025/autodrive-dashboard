import { useEffect, useRef, useState, useCallback } from 'react';
import { PathCache } from '@/utils/pathCache';

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

export const usePathWorker = () => {
  const [path, setPath] = useState<Position[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize worker and load cached data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load cached path from localStorage
    const cachedPath = PathCache.load();
    setPath(cachedPath);

    // Create worker
    try {
      workerRef.current = new Worker(
        new URL('../workers/pathWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, path: workerPath } = event.data;

        switch (type) {
          case 'INITIALIZED':
            console.log('Worker initialized successfully');
            isInitializedRef.current = true;
            break;

          case 'PATH_UPDATED':
            setPath(workerPath);
            // Cache the updated path
            PathCache.save(workerPath);
            break;

          case 'PATH_DATA':
            setPath(workerPath);
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };

      // Initialize worker with cached data
      workerRef.current.postMessage({
        type: 'INIT',
        initialPath: cachedPath,
      } as WorkerMessage);

      console.log('Path worker created and initialized');
    } catch (error) {
      console.error('Error creating worker:', error);
      // Fallback: worker not supported, use main thread
      isInitializedRef.current = true;
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        console.log('Path worker terminated');
      }
    };
  }, []);

  // Add position to path
  const addPosition = useCallback((position: Position) => {
    if (workerRef.current && isInitializedRef.current) {
      workerRef.current.postMessage({
        type: 'ADD_POSITION',
        position,
      } as WorkerMessage);
    } else {
      // Fallback: no worker, update directly
      setPath((prev) => {
        const newPath = PathCache.append(position, prev);
        return newPath;
      });
    }
  }, []);

  // Clear path
  const clearPath = useCallback(() => {
    if (workerRef.current && isInitializedRef.current) {
      workerRef.current.postMessage({
        type: 'CLEAR_PATH',
      } as WorkerMessage);
    } else {
      setPath([]);
    }
    PathCache.clear();
  }, []);

  // Get current path
  const getPath = useCallback(() => {
    if (workerRef.current && isInitializedRef.current) {
      workerRef.current.postMessage({
        type: 'GET_PATH',
      } as WorkerMessage);
    }
    return path;
  }, [path]);

  return {
    path,
    addPosition,
    clearPath,
    getPath,
  };
};

export default usePathWorker;
