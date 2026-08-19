#!/bin/bash
# Renew the production TLS certificate for da-dryclean.ru when it is close to
# expiry. Idempotent: no-op while the certificate is valid for more than
# RENEW_BEFORE_DAYS days.
#
# Used by:
#   - scripts/deploy-vps.sh  (Step 1.15, every deploy)
#   - .github/workflows/cert-renew.yml (scheduled, twice a day)
#
# Works both with a host-installed certbot and via the certbot/certbot image
# with host mounts (host nginx reads certs from /etc/letsencrypt).

set -uo pipefail

DOMAIN="da-dryclean.ru"
CERT_EMAIL="${CERTBOT_EMAIL:-admin@da-dryclean.ru}"
WEBROOT="/var/www/certbot"
CERT_FILE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
RENEW_BEFORE_DAYS="${RENEW_BEFORE_DAYS:-30}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [cert-renew] $1"; }
fatal() { log "FATAL: $1"; exit 1; }

cert_days_left() {
    if [ ! -r "$CERT_FILE" ]; then
        echo "-1"
        return
    fi
    local end_time end_epoch
    end_time=$(openssl x509 -noout -enddate -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)
    if [ -z "$end_time" ]; then
        echo "-1"
        return
    fi
    end_epoch=$(date -d "$end_time" +%s 2>/dev/null) || { echo "-1"; return; }
    echo $(( (end_epoch - $(date +%s)) / 86400 ))
}

run_certbot() {
    mkdir -p "$WEBROOT"
    if command -v certbot >/dev/null 2>&1; then
        certbot certonly \
            --non-interactive --agree-tos --email "$CERT_EMAIL" \
            --webroot --webroot-path "$WEBROOT" \
            --cert-name "$DOMAIN" \
            -d "$DOMAIN" -d "www.${DOMAIN}" \
            --force-renewal
    else
        docker run --rm \
            -v /etc/letsencrypt:/etc/letsencrypt \
            -v /var/lib/letsencrypt:/var/lib/letsencrypt \
            -v "${WEBROOT}:${WEBROOT}" \
            certbot/certbot certonly \
                --non-interactive --agree-tos --email "$CERT_EMAIL" \
                --webroot --webroot-path "$WEBROOT" \
                --cert-name "$DOMAIN" \
                -d "$DOMAIN" -d "www.${DOMAIN}" \
                --force-renewal
    fi
}

DAYS_LEFT=$(cert_days_left)
log "Certificate '${CERT_FILE}' — days left: ${DAYS_LEFT}"

if [ "$DAYS_LEFT" -ge "$RENEW_BEFORE_DAYS" ]; then
    log "OK — certificate valid for ${DAYS_LEFT} days, nothing to do"
    exit 0
fi

log "Certificate expires in ${DAYS_LEFT} days (< ${RENEW_BEFORE_DAYS}) — renewing..."
if ! run_certbot; then
    fatal "certbot renewal failed — see output above"
fi

if command -v nginx >/dev/null 2>&1; then
    if nginx -t 2>&1 && nginx -s reload 2>&1; then
        log "nginx reloaded with renewed certificate"
    else
        fatal "nginx config test or reload failed"
    fi
else
    log "WARN: host nginx not found — skipping reload (cert files updated)"
fi

NEW_DAYS_LEFT=$(cert_days_left)
if [ "$NEW_DAYS_LEFT" -lt "$RENEW_BEFORE_DAYS" ]; then
    fatal "certificate still expiring in ${NEW_DAYS_LEFT} days after renewal attempt"
fi

log "SUCCESS — certificate renewed, now valid for ${NEW_DAYS_LEFT} days"
