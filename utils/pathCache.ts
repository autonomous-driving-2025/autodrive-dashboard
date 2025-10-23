interface Position {
  lat: number;
  lon: number;
}

const CACHE_KEY = 'gps_path_cache';
const MAX_CACHE_SIZE = 1000;

export const PathCache = {
  // Save path to localStorage
  save: (path: Position[]): void => {
    try {
      const dataToCache = {
        path,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
      console.log('Path cached successfully:', path.length, 'points');
    } catch (error) {
      console.error('Error caching path:', error);
      // If localStorage is full, try to clear and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        PathCache.clear();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ path, timestamp: Date.now() }));
        } catch (retryError) {
          console.error('Failed to cache path after clearing:', retryError);
        }
      }
    }
  },

  // Load path from localStorage
  load: (): Position[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return [];

      const { path, timestamp } = JSON.parse(cached);
      
      // Check if cache is less than 24 hours old
      const cacheAge = Date.now() - timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > maxAge) {
        console.log('Cache expired, clearing...');
        PathCache.clear();
        return [];
      }

      console.log('Loaded cached path:', path.length, 'points');
      return path;
    } catch (error) {
      console.error('Error loading cached path:', error);
      return [];
    }
  },

  // Clear cache
  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('Path cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Add a single position to cache
  append: (position: Position, currentPath: Position[]): Position[] => {
    const newPath = [...currentPath, position];
    // Limit cache size
    const trimmedPath = newPath.length > MAX_CACHE_SIZE 
      ? newPath.slice(-MAX_CACHE_SIZE) 
      : newPath;
    
    PathCache.save(trimmedPath);
    return trimmedPath;
  },
};
