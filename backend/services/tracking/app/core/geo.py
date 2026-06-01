import structlog
from pathlib import Path
from app.config import settings

logger = structlog.get_logger()


class GeoIPResolver:
    def __init__(self):
        self._reader = None
        self._available = False
        self._init_db()

    def _init_db(self):
        db_path = Path(settings.geoip_db_path)
        if db_path.exists():
            try:
                import maxminddb
                self._reader = maxminddb.open_database(str(db_path))
                self._available = True
                logger.info("geoip_db_loaded", path=str(db_path))
            except Exception as e:
                logger.warning("geoip_db_load_failed", error=str(e))
        else:
            logger.info("geoip_db_not_found", path=str(db_path))

    def resolve(self, ip_address: str | None) -> dict[str, str | None]:
        if not ip_address or not self._available or not self._reader:
            return {"city": None, "country": None}

        try:
            result = self._reader.get(ip_address)
            if result:
                city = result.get("city", {}).get("names", {}).get("ru") or \
                       result.get("city", {}).get("names", {}).get("en")
                country = result.get("country", {}).get("names", {}).get("ru") or \
                          result.get("country", {}).get("names", {}).get("en")
                return {"city": city, "country": country}
        except Exception as e:
            logger.debug("geoip_resolve_failed", ip=ip_address, error=str(e))

        return {"city": None, "country": None}

    def close(self):
        if self._reader:
            self._reader.close()


geo_resolver = GeoIPResolver()
