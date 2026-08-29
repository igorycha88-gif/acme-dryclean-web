import logging
from dataclasses import dataclass

from sqlalchemy import text
from starlette.responses import Response

from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# App-level pg_* metrics endpoint (ЧТЗ_Сайт_da_dryclean_Полные_Бизнес_Метрики §2.2,
# same pattern as evacuaciya.online / zabor-i-naves.ru): runtime stats of the
# service database — connections, transactions, blocks, tuples, db size.
# Served behind the X-Monitoring-Key check done by nginx.

STATS_QUERY = text(
    """
    SELECT
        current_database() AS datname,
        pg_database_size(current_database()) AS size_bytes,
        s.numbackends,
        s.xact_commit,
        s.xact_rollback,
        s.blks_read,
        s.blks_hit,
        s.tup_returned,
        s.tup_fetched,
        s.tup_inserted,
        s.tup_updated,
        s.tup_deleted,
        s.conflicts,
        s.deadlocks,
        s.temp_files,
        s.temp_bytes,
        (SELECT setting::bigint FROM pg_settings WHERE name = 'max_connections') AS max_connections
    FROM pg_stat_database s
    WHERE s.datname = current_database()
    """
)


@dataclass(frozen=True)
class PgStats:
    datname: str
    size_bytes: int
    numbackends: int
    xact_commit: int
    xact_rollback: int
    blks_read: int
    blks_hit: int
    tup_returned: int
    tup_fetched: int
    tup_inserted: int
    tup_updated: int
    tup_deleted: int
    conflicts: int
    deadlocks: int
    temp_files: int
    temp_bytes: int
    max_connections: int


async def collect_pg_stats(session_factory=AsyncSessionLocal) -> PgStats | None:
    try:
        async with session_factory() as session:
            row = (await session.execute(STATS_QUERY)).one()
        return PgStats(**row._mapping)
    except Exception:
        logger.exception("postgres_metrics_query_failed")
        return None


def _gauge(lines: list[str], name: str, help_text: str, value: int, datname: str | None) -> None:
    lines.append(f"# HELP {name} {help_text}")
    lines.append(f"# TYPE {name} gauge")
    if datname is None:
        lines.append(f"{name} {value}")
    else:
        lines.append(f'{name}{{datname="{datname}"}} {value}')


def _counter(lines: list[str], name: str, help_text: str, value: int, datname: str) -> None:
    lines.append(f"# HELP {name} {help_text}")
    lines.append(f"# TYPE {name} counter")
    lines.append(f'{name}{{datname="{datname}"}} {value}')


def render_postgres_metrics(stats: PgStats | None) -> str:
    lines: list[str] = []
    _gauge(lines, "pg_up", "Whether the last query of PostgreSQL succeeded", 0 if stats is None else 1, None)
    if stats is None:
        return "\n".join(lines) + "\n"

    s = stats
    _gauge(lines, "pg_max_connections", "Maximum allowed connections (pg_settings)", s.max_connections, None)
    _gauge(lines, "pg_connections", "Client connections currently in use", s.numbackends, None)
    _gauge(lines, "pg_database_size_bytes", "Database size in bytes (pg_database_size)", s.size_bytes, s.datname)
    _gauge(lines, "pg_stat_database_numbackends", "Backends currently connected to this database", s.numbackends, s.datname)
    _counter(lines, "pg_stat_database_xact_commit", "Transactions committed to this database", s.xact_commit, s.datname)
    _counter(lines, "pg_stat_database_xact_rollback", "Transactions rolled back in this database", s.xact_rollback, s.datname)
    _counter(lines, "pg_stat_database_blks_read", "Disk blocks read in this database", s.blks_read, s.datname)
    _counter(lines, "pg_stat_database_blks_hit", "Times disk blocks were found in the buffer cache", s.blks_hit, s.datname)
    _counter(lines, "pg_stat_database_tup_returned", "Rows returned by queries in this database", s.tup_returned, s.datname)
    _counter(lines, "pg_stat_database_tup_fetched", "Rows fetched by queries in this database", s.tup_fetched, s.datname)
    _counter(lines, "pg_stat_database_tup_inserted", "Rows inserted by queries in this database", s.tup_inserted, s.datname)
    _counter(lines, "pg_stat_database_tup_updated", "Rows updated by queries in this database", s.tup_updated, s.datname)
    _counter(lines, "pg_stat_database_tup_deleted", "Rows deleted by queries in this database", s.tup_deleted, s.datname)
    _counter(lines, "pg_stat_database_conflicts", "Queries cancelled due to recovery conflicts", s.conflicts, s.datname)
    _counter(lines, "pg_stat_database_deadlocks", "Deadlocks detected in this database", s.deadlocks, s.datname)
    _counter(lines, "pg_stat_database_temp_files", "Temporary files created by queries", s.temp_files, s.datname)
    _counter(lines, "pg_stat_database_temp_bytes", "Data written to temporary files by queries", s.temp_bytes, s.datname)
    return "\n".join(lines) + "\n"


async def postgres_metrics_endpoint(session_factory=None) -> Response:
    if session_factory is None:
        session_factory = AsyncSessionLocal
    stats = await collect_pg_stats(session_factory)
    return Response(content=render_postgres_metrics(stats), media_type="text/plain; charset=utf-8")
