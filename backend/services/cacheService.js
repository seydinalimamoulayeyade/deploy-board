/**
 * In-memory cache service with TTL support
 * Used to cache API responses to reduce external API calls
 */
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Store a value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 60) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Retrieve a value from cache if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Get cache age in seconds
   * @param {string} key - Cache key
   * @returns {number|null} - Age in seconds or null if not found
   */
  getAge(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    return Math.floor((Date.now() - cached.createdAt) / 1000);
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries (garbage collection)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: entries.filter(e => now > e.expiresAt).length,
      activeEntries: entries.filter(e => now <= e.expiresAt).length
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

// Run cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

module.exports = cacheService;
