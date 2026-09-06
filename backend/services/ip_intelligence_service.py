import os
from typing import List, Dict, Optional
from backend.schemas.ip_intelligence import IPIntelligence
from backend.services.relay_reconstructor import RelayReconstructorService
from backend.services.ip_providers import BaseIPIntelligenceProvider, IPApiProvider, MockIPIntelligenceProvider
from backend.services.ip_cache import global_ip_cache, IPIntelligenceCache


class IPIntelligenceService:
    """
    Main orchestration service for IP Intelligence enrichment.
    Protects private IPs, manages cache lookups, and invokes configurable providers.
    """

    def __init__(
        self,
        provider: Optional[BaseIPIntelligenceProvider] = None,
        cache: Optional[IPIntelligenceCache] = None
    ):
        self.provider = provider or self._get_default_provider()
        self.cache = cache or global_ip_cache

    @staticmethod
    def _get_default_provider() -> BaseIPIntelligenceProvider:
        provider_name = os.getenv("IP_INTELLIGENCE_PROVIDER", "ipapi").lower()
        if provider_name == "mock":
            return MockIPIntelligenceProvider()
        return IPApiProvider()

    async def get_ip_intelligence(self, ip: str) -> IPIntelligence:
        """
        Enrich a single IP address with infrastructure & geolocation context.
        Bypasses external provider calls for private/loopback/reserved IPs.
        """
        if not ip:
            return IPIntelligence(
                ip="",
                scope="unknown",
                enrichment_available=False,
                error="Empty IP address provided"
            )

        # 1. Private / Loopback / Non-routable IP check
        is_public = RelayReconstructorService.is_public_ip(ip)
        if not is_public:
            return IPIntelligence(
                ip=ip,
                scope="private",
                enrichment_available=False,
                infrastructure_type="Private / Internal infrastructure",
                error=None
            )

        # 2. Check Backend Cache
        cached_res = self.cache.get(ip)
        if cached_res is not None:
            return cached_res

        # 3. Provider Lookup with Graceful Error Handling & Fallback
        try:
            res = await self.provider.lookup(ip)
        except Exception as e:
            # Fallback to mock provider on unexpected error
            mock_p = MockIPIntelligenceProvider()
            res = await mock_p.lookup(ip)
            res.error = f"Primary provider failed: {str(e)}"

        # 4. Save result in cache
        self.cache.set(ip, res)
        return res

    async def get_batch_ip_intelligence(self, ips: List[str]) -> Dict[str, IPIntelligence]:
        """
        Batch enrich a list of IP addresses, returning a dictionary keyed by IP string.
        """
        results: Dict[str, IPIntelligence] = {}
        unique_ips = list(set([i.strip() for i in ips if i and i.strip()]))

        for ip in unique_ips:
            results[ip] = await self.get_ip_intelligence(ip)

        return results


# Default global service instance
global_ip_service = IPIntelligenceService()
