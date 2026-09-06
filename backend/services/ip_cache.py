import time
import threading
from typing import Optional, Dict, Tuple
from backend.schemas.ip_intelligence import IPIntelligence


class IPIntelligenceCache:
    """
    Thread-safe backend in-memory TTL cache for IP intelligence lookups.
    Avoids repeated external provider API calls for identical IP addresses.
    """

    def __init__(self, ttl_seconds: int = 3600, max_entries: int = 2000):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[str, Tuple[IPIntelligence, float]] = {}
        self._lock = threading.Lock()

    def get(self, ip: str) -> Optional[IPIntelligence]:
        """Retrieve cached IPIntelligence if present and not expired."""
        with self._lock:
            if ip in self._cache:
                entry, timestamp = self._cache[ip]
                if time.time() - timestamp < self.ttl_seconds:
                    return entry
                else:
                    del self._cache[ip]
            return None

    def set(self, ip: str, data: IPIntelligence) -> None:
        """Store IPIntelligence in cache with current timestamp."""
        with self._lock:
            # Evict oldest entries if cache exceeds max size
            if len(self._cache) >= self.max_entries:
                oldest_ip = min(self._cache.keys(), key=lambda k: self._cache[k][1])
                del self._cache[oldest_ip]

            self._cache[ip] = (data, time.time())

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        """Return current count of cached items."""
        with self._lock:
            return len(self._cache)


# Global singleton cache instance
global_ip_cache = IPIntelligenceCache()
