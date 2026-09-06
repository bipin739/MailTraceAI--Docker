from typing import Optional
from pydantic import BaseModel, Field


class IPIntelligence(BaseModel):
    ip: str = Field(..., description="IP address string")
    scope: str = Field("public", description="Scope: public, private, loopback, link_local, reserved, unknown")
    enrichment_available: bool = Field(True, description="True if public IP enrichment data was obtained or attempted")
    country: Optional[str] = Field(None, description="Country name or ISO code")
    country_code: Optional[str] = Field(None, description="2-letter country code (ISO-3166-1 alpha-2)")
    region: Optional[str] = Field(None, description="State or Region name")
    city: Optional[str] = Field(None, description="City name")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    timezone: Optional[str] = Field(None, description="Timezone string e.g. UTC, Europe/Amsterdam")
    asn: Optional[str] = Field(None, description="Autonomous System Number e.g. AS12345")
    asn_org: Optional[str] = Field(None, description="ASN Organization name")
    isp: Optional[str] = Field(None, description="Internet Service Provider name")
    organization: Optional[str] = Field(None, description="Organization name")
    is_hosting: Optional[bool] = Field(None, description="True if IP belongs to cloud/datacenter hosting provider")
    is_proxy_vpn_tor: Optional[bool] = Field(None, description="True if IP belongs to known proxy, VPN, or Tor exit node")
    infrastructure_type: Optional[str] = Field("Observed infrastructure location", description="Type description e.g. Hosting infrastructure, ISP, Corporate, Private")
    error: Optional[str] = Field(None, description="Error message if provider lookup failed, timed out, or rate limited")
