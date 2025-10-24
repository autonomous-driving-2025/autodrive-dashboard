interface Position {
  lat: number;
  lon: number;
}

const CACHE_KEY = 'gps_path_cache';
// Maximum cache size - 1 million points
// With ~40 bytes per position, this is ~40MB of data
// We'll use IndexedDB fallback if localStorage is too small
const MAX_CACHE_SIZE = 1000000; // 1 million points

export const PathCache = {
  // Save path to localStorage with size management
  save: (path: Position[]): void => {
    try {
      const dataToCache = {
        path,
        timestamp: Date.now(),
        version: 1, // For future migrations
      };
      
      const jsonString = JSON.stringify(dataToCache);
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      
      localStorage.setItem(CACHE_KEY, jsonString);
      console.log(`Path cached successfully: ${path.length} points (${sizeInMB}MB)`);
    } catch (error) {
      console.error('Error caching path:', error);
      // If localStorage is full, try progressive trimming
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting progressive trimming...');
        
        // Try trimming to different sizes
        const trimSizes = [500000, 250000, 100000, 50000];
        
        for (const size of trimSizes) {
          try {
            const trimmedPath = path.slice(-size);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ 
              path: trimmedPath, 
              timestamp: Date.now(),
              version: 1,
              trimmed: true 
            }));
            console.log(`Path cached with trimming to ${size} points`);
            return;
          } catch (retryError) {
            console.warn(`Failed to cache ${size} points, trying smaller size...`);
          }
        }
        
        // Last resort: clear everything
        console.error('Failed all cache attempts, clearing cache');
        PathCache.clear();
      }
    }
  },

  // Load path from localStorage
  load: (): Position[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return [];

      const data = JSON.parse(cached);
      const { path, timestamp, trimmed } = data;
      
      // Check if cache is less than 7 days old (increased for long trips)
      const cacheAge = Date.now() - timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (cacheAge > maxAge) {
        console.log('Cache expired (>7 days), clearing...');
        PathCache.clear();
        return [];
      }

      const sizeInMB = (new Blob([cached]).size / (1024 * 1024)).toFixed(2);
      console.log(`Loaded cached path: ${path.length} points (${sizeInMB}MB)${trimmed ? ' [trimmed]' : ''}`);
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
