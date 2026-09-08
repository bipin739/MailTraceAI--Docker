import os
import re
import abc
import httpx
from typing import Optional
from backend.schemas.ip_intelligence import IPIntelligence


class BaseIPIntelligenceProvider(abc.ABC):
    """Abstract Base Class for IP Intelligence Geolocation & Infrastructure Providers."""

    @abc.abstractmethod
    async def lookup(self, ip: str) -> IPIntelligence:
        """Perform asynchronous IP lookup and return structured IPIntelligence."""
        pass


class IPApiProvider(BaseIPIntelligenceProvider):
    """
    IP-API Provider implementation.
    Supports free and pro endpoints with automatic field mapping.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("IP_INTELLIGENCE_API_KEY") or os.getenv("IPAPI_KEY")

    async def lookup(self, ip: str) -> IPIntelligence:
        from backend.services.ssrf_protector import SSRFProtector
        clean_ip = ip.strip()
        if not SSRFProtector.is_safe_public_ip(clean_ip):
            return IPIntelligence(
                ip=clean_ip,
                scope="private",
                enrichment_available=False,
                infrastructure_type="Private / Internal infrastructure",
                error=None
            )

        url = f"http://ip-api.com/json/{clean_ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as,proxy,hosting"
        if self.api_key:
            url = f"https://pro.ip-api.com/json/{clean_ip}?key={self.api_key}&fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as,proxy,hosting"

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(url)
                if response.status_code == 429:
                    return IPIntelligence(
                        ip=ip,
                        scope="public",
                        enrichment_available=False,
                        error="Rate limit exceeded for IP intelligence provider"
                    )
                if response.status_code != 200:
                    return IPIntelligence(
                        ip=ip,
                        scope="public",
                        enrichment_available=False,
                        error=f"Provider HTTP Error {response.status_code}"
                    )

                data = response.json()
                if data.get("status") == "fail":
                    return IPIntelligence(
                        ip=ip,
                        scope="public",
                        enrichment_available=False,
                        error=data.get("message", "IP lookup failed")
                    )

                asn_raw = data.get("as", "")
                asn_code = None
                asn_org = None
                if asn_raw:
                    asn_match = re.match(r'^(AS\d+)\s*(.*)', asn_raw)
                    if asn_match:
                        asn_code = asn_match.group(1)
                        asn_org = asn_match.group(2).strip() or None
                    else:
                        asn_code = asn_raw

                is_hosting = data.get("hosting", False)
                is_proxy = data.get("proxy", False)
                infra_type = "Hosting infrastructure" if is_hosting else ("Corporate / ISP" if data.get("org") else "Observed infrastructure location")

                return IPIntelligence(
                    ip=ip,
                    scope="public",
                    enrichment_available=True,
                    country=data.get("country"),
                    country_code=data.get("countryCode"),
                    region=data.get("regionName"),
                    city=data.get("city"),
                    latitude=data.get("lat"),
                    longitude=data.get("lon"),
                    timezone=data.get("timezone"),
                    asn=asn_code,
                    asn_org=asn_org,
                    isp=data.get("isp"),
                    organization=data.get("org"),
                    is_hosting=is_hosting,
                    is_proxy_vpn_tor=is_proxy,
                    infrastructure_type=infra_type,
                    error=None
                )
        except httpx.TimeoutException:
            return IPIntelligence(
                ip=ip,
                scope="public",
                enrichment_available=False,
                error="Provider request timeout"
            )
        except Exception as e:
            return IPIntelligence(
                ip=ip,
                scope="public",
                enrichment_available=False,
                error=f"Provider lookup error: {str(e)}"
            )


class MockIPIntelligenceProvider(BaseIPIntelligenceProvider):
    """
    Fallback / Mock Provider for offline execution, unit tests, or keyless deployments.
    Generates realistic contextual data for test public IPs.
    """

    async def lookup(self, ip: str) -> IPIntelligence:
        # Deterministic mock generation based on IP octets
        if ip.startswith("203.0.113.") or ip.startswith("198.51.100.") or ip.startswith("192.0.2."):
            return IPIntelligence(
                ip=ip,
                scope="public",
                enrichment_available=True,
                country="Netherlands",
                country_code="NL",
                region="North Holland",
                city="Amsterdam",
                latitude=52.3676,
                longitude=4.9041,
                timezone="Europe/Amsterdam",
                asn="AS12345",
                asn_org="Example Cloud Hosting BV",
                isp="Example Cloud Infrastructure",
                organization="Example Cloud Services",
                is_hosting=True,
                is_proxy_vpn_tor=False,
                infrastructure_type="Hosting infrastructure",
                error=None
            )
        
        return IPIntelligence(
            ip=ip,
            scope="public",
            enrichment_available=True,
            country="United States",
            country_code="US",
            region="California",
            city="Mountain View",
            latitude=37.3860,
            longitude=-122.0839,
            timezone="America/Los_Angeles",
            asn="AS15169",
            asn_org="Google LLC",
            isp="Google LLC",
            organization="Google Cloud Platform",
            is_hosting=True,
            is_proxy_vpn_tor=False,
            infrastructure_type="Hosting infrastructure",
            error=None
        )
