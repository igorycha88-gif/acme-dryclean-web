# DEPLOY.md — CI/CD Blue-Green Deployment

## Architecture

```
GitHub Actions (deploy.yml)
        │
        ├── CI (lint + typecheck)
        ├── Calculate version
        │
        └── SSH → VPS (/opt/app)
              │
              ├── 1. Git pull (origin/main)
              ├── 2. Determine active/standby
              ├── 3. DB backup
              ├── 4. Build standby (--no-cache)
              ├── 5. Start standby (--force-recreate)
              ├── 6. Health-check (120s timeout)
              ├── 7. Smoke tests
              ├── 8. Switch nginx traffic
              ├── 9. Verify live traffic
              ├── 10. Update version tracking
              └── 11. Cleanup old images

              ┌─ On failure: AUTO-ROLLBACK ─┐
              │  Switch nginx back to active  │
              │  Stop failed standby          │
              └───────────────────────────────┘
```

## Blue-Green Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  :80/:443   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼─────────┐   ┌──────────▼─────────┐
    │   BLUE (active)   │   │  GREEN (standby)   │
    │  frontend:3000    │   │  frontend:3000     │
    │  content:8011     │   │  content:8011      │
    │  postgres         │   │  postgres          │
    │  redis            │   │  redis             │
    │  rabbitmq         │   │  rabbitmq          │
    └───────────────────┘   └────────────────────┘

    Nginx reads: /etc/nginx/conf.d/active.conf
    Contains:    set $active_env "blue";  (or "green")
```

## Workflows

### CI (`ci.yml`) — Automatic on push/PR to main

Runs lint, typecheck, and build verification. No deployment.

### Deploy (`deploy.yml`) — Manual trigger from main

```bash
# Deploy with auto-version
gh workflow run deploy.yml

# Deploy with specific version
gh workflow run deploy.yml --field version=1.5.0

# Deploy skipping CI
gh workflow run deploy.yml --field skip_tests=true

# Deploy without auto-rollback
gh workflow run deploy.yml --field auto_rollback=false
```

## Pipeline Steps

| Step | Description | Timeout |
|------|-------------|---------|
| CI check | ruff + mypy + eslint + tsc | 10 min |
| Calculate version | SemVer from commits | 1 min |
| Pre-deploy snapshot | Current state capture | 1 min |
| Sync code | git pull on VPS | 2 min |
| Determine envs | active vs standby | instant |
| DB backup | pg_dump active | 2 min |
| Build standby | docker compose build --no-cache | 10 min |
| Start standby | docker compose up --force-recreate | 2 min |
| Health-check | Poll until healthy | up to 120s |
| Smoke tests | /health endpoint checks | 30s |
| Switch traffic | nginx active.conf + reload | instant |
| Verify live | HTTPS + nginx-health checks | 10s |
| Version tracking | current_env + VERSIONS.md + git tag | instant |
| Cleanup | Remove old images (keep 3) | 1 min |
| **Auto-rollback** | On any failure | instant |

## GitHub Secrets Required

```bash
gh secret set SSH_PRIVATE_KEY    # SSH private key for VPS
gh secret set VPS_USER           # root
gh secret set VPS_HOST           # VPS IP address
gh secret set POSTGRES_PASSWORD  # Strong DB password
gh secret set RABBITMQ_PASS      # Strong RabbitMQ password
```

## First-time VPS Setup

```bash
ssh root@VPS_HOST

mkdir -p /opt/app
cd /opt/app
git clone <repo-url> .

cat > .env << EOF
POSTGRES_USER=dryclean
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=dryclean_content
RABBITMQ_USER=dryclean
RABBITMQ_PASS=<strong-password>
EOF

mkdir -p /etc/nginx/conf.d
echo 'set $active_env "blue";' > /etc/nginx/conf.d/active.conf

# Initial deploy of blue environment
docker compose -f docker-compose.blue.yml build --no-cache
docker compose -f docker-compose.blue.yml up -d

# Wait for healthy
# Then deploy nginx container
docker compose -f docker-compose.prod.yml up -d nginx certbot
```

## Rollback

```bash
# Automatic — CI/CD does it on failure (auto_rollback=true by default)

# Manual via CLI
./scripts/rollback.sh

# Manual via CI/CD — switch back to previous active
gh workflow run deploy.yml --field skip_tests=true
```

## Monitoring

```bash
# Active environment
cat /opt/app/current_env

# Nginx routing
cat /etc/nginx/conf.d/active.conf

# All containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Deploy history
cat /opt/app/VERSIONS.md

# Check which env is live
curl -s https://da-dryclean.ru/active-env
```

## Troubleshooting

### Health-check not passing

```bash
docker compose -f docker-compose.green.yml logs --tail=100
docker inspect --format='{{.State.Health.Status}}' content-green
```

### Nginx not routing correctly

```bash
cat /etc/nginx/conf.d/active.conf
nginx -T 2>/dev/null | grep active_env
```

### Manual traffic switch

```bash
echo 'set $active_env "green";' > /etc/nginx/conf.d/active.conf
nginx -s reload
```

### Out of disk space

```bash
cd /opt/app && ./scripts/cleanup.sh --keep 2
docker system prune -f
```

## Metrics export for external monitoring

Central monitoring (project «Мониторинг сайтов») scrapes business and service
metrics over HTTPS only, authenticated by the `X-Monitoring-Key` header.
No new ports are exposed: everything goes through nginx :443.

```
GET https://da-dryclean.ru/metrics/tracking   → 127.0.0.1:8020  (business gauges)
GET https://da-dryclean.ru/metrics/content    → $content_upstream (blue-green aware)
GET https://da-dryclean.ru/metrics/node       → 127.0.0.1:9100  (node_exporter)
GET https://da-dryclean.ru/metrics/postgres   → 127.0.0.1:9187  (postgres_exporter)
```

### One-time setup on the VPS

```bash
ssh root@37.143.15.148
cd /opt/app && git pull
./scripts/setup-metrics-export.sh --key <MONITORING_API_KEY>
```

The script (idempotent):
- writes `/etc/nginx/conf.d/monitoring-key.conf` (map + rate limit zone, chmod 600 root:root)
- ensures the 4 `/metrics/*` locations exist in `/etc/nginx/nginx.conf`, runs `nginx -t`, reloads
- stores `MONITORING_API_KEY` in `/opt/app/.env` (600)
- installs node_exporter as a systemd service bound to 127.0.0.1:9100
- creates read-only user `metrics_exporter` (pg_monitor) and starts
  `dryclean-postgres-exporter` container on 127.0.0.1:9187
- runs acceptance checks (403 without key, 200 + expected metric names with key, POST → 405)

The monitoring key and `POSTGRES_EXPORTER_PASSWORD` must never be committed.
`/metrics/content` follows the active blue-green environment automatically
(existing `map $active_env $content_upstream`).
