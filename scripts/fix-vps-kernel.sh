#!/bin/bash
# Диагностика и обновление ядра VPS для восстановления embedded DNS Docker
# (TASK-DNS-3, ЧТЗ_Фикс_Docker_DNS_VPS — ПОСТОЯННОЕ решение).
#
# Запускать НА VPS (root):
#   ./scripts/fix-vps-kernel.sh            — диагностика (безопасно, ничего не меняет)
#   ./scripts/fix-vps-kernel.sh --install  — установить стандартное ядро дистрибутива
#   ./scripts/fix-vps-kernel.sh --verify   — проверка ПОСЛЕ reboot
#
# ⚠️ ПЕРЕД --install: обязательно сделать снапшот VPS у хостера!
# ⚠️ Reboot — только в окно обслуживания (сайт недоступен ~2-5 минут).
set -uo pipefail

DNS_NET="dryclean-net"
DNS_TEST_CMD="docker run --rm --network $DNS_NET busybox nslookup dryclean-postgres"

log()  { echo "[kernel-fix] $1"; }
fatal(){ echo "[kernel-fix] FATAL: $1" >&2; exit 1; }

MODE="diag"
[ "${1:-}" = "--install" ] && MODE="install"
[ "${1:-}" = "--verify" ] && MODE="verify"

[[ "$(id -u)" == "0" ]] || fatal "Run as root"

# ── Диагностика ──────────────────────────────────────────────────────────────
diag() {
    echo "======== ДИАГНОСТИКА ЯДРА / DOCKER DNS ========"

    KERNEL=$(uname -r)
    log "Ядро: $KERNEL"
    log "Дистрибутив: $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || echo unknown)"

    echo ""
    log "-- iptables --"
    IPT_MODE=$(iptables --version 2>/dev/null | grep -o '(nf_tables\|legacy)' || echo "unknown")
    log "Режим: $IPT_MODE"
    if iptables -t nat -L -n &>/dev/null; then
        log "OK: таблица nat доступна"
        NAT_OK=1
    else
        log "BROKEN: таблица nat недоступна — embedded DNS (127.0.0.11) работать не будет"
        NAT_OK=0
    fi

    echo ""
    log "-- Модули ядра --"
    MODULES_DIR="/lib/modules/$KERNEL"
    if [ -d "$MODULES_DIR" ]; then
        log "Каталог модулей существует: $MODULES_DIR ($(find "$MODULES_DIR" -type f | wc -l) файлов)"
        if modprobe nf_nat 2>/dev/null; then
            log "OK: nf_nat загружается"
            NAT_MOD_OK=1
        else
            log "BROKEN: modprobe nf_nat → ошибка"
            NAT_MOD_OK=0
        fi
        modprobe iptable_nat 2>/dev/null && log "OK: iptable_nat загружается" || log "BROKEN: modprobe iptable_nat → ошибка"
    else
        log "BROKEN: $MODULES_DIR НЕ существует — кастомное ядро хостера без модулей"
        log "        (Virtuozzo/OpenVZ-подобные VPS не позволяют сменить ядро из гостевой ОС)"
        NAT_MOD_OK=0
        HOSTER_KERNEL=1
    fi

    echo ""
    log "-- Embedded DNS Docker --"
    if $DNS_TEST_CMD &>/dev/null; then
        log "OK: nslookup dryclean-postgres работает — embedded DNS жив"
        DNS_OK=1
    else
        log "BROKEN: $DNS_TEST_CMD → неудача"
        DNS_OK=0
    fi

    echo ""
    log "-- Возможность установки ядра --"
    if [ "${HOSTER_KERNEL:-0}" = "1" ]; then
        log "Ядро управляется хостером: установка из гостя БЕЗОПАСНОСТИ НЕ ГАРАНТИРУЕТ."
        log "Рекомендация: запросить у хостера (timeweb) штатное ядро дистрибутива"
        log "или переход на KVM-VM с полным контролем ядра."
    fi
    if command -v apt-get &>/dev/null; then
        log "apt доступен. Кандидаты ядра:"
        apt-cache search --names-only 'linux-image-(generic|virtual)' 2>/dev/null | sort | tail -5
        log "Загруженные ядра в /boot:"
        ls -1 /boot/vmlinuz-* 2>/dev/null || log "  /boot пуст или отсутствует"
    else
        log "apt-get не найден — дистрибутив не Debian-подобный, обратитесь к хостеру"
    fi

    echo ""
    echo "=============================================="
    if [ "$DNS_OK" = "1" ]; then
        echo "ИТОГ: embedded DNS РАБОТАЕТ — extra_hosts можно удалить из compose"
    elif [ "$NAT_OK" = "1" ] && [ "$NAT_MOD_OK" = "1" ]; then
        echo "ИТОГ: netfilter в порядке, но DNS не работает — смотрите journalctl -u docker | grep -i resolver"
    else
        echo "ИТОГ: подтверждено ограничение ядра. Воркараунд (статические IP +"
        echo "extra_hosts) ОСТАЁТСЯ. Постоянное решение: --install (если возможно) или хостер."
    fi
}

# ── Установка ядра ───────────────────────────────────────────────────────────
install_kernel() {
    echo "======== УСТАНОВКА СТАНДАРТНОГО ЯДРА ========"

    [ -d "/lib/modules/$(uname -r)" ] && fatal "Каталог модулей текущего ядра существует — похоже, ядро штатное. Сначала запустите диагностику."

    command -v apt-get &>/dev/null || fatal "apt-get не найден — обновление ядра из гостя невозможно, обратитесь к хостеру"

    echo "ВНИМАНИЕ: операция меняет загрузчик. Перед продолжением:"
    echo "  1) Снапшот VPS в панели хостера (обязательно!)"
    echo "  2) Окно обслуживания: после установки нужен reboot (сайт ляжет на 2-5 мин)"
    echo "  3) Откат: выбор старого ядра в grub (Advanced options) или откат снапшота"
    echo ""
    read -r -p "Продолжать? (yes/no): " CONFIRM
    [ "$CONFIRM" = "yes" ] || { echo "Отменено."; exit 0; }

    export DEBIAN_FRONTEND=noninteractive
    apt-get update

    # Виртуальная машина → linux-image-virtual (компактнее), иначе generic-hwe
    if systemd-detect-virt &>/dev/null && [ "$(systemd-detect-virt)" != "none" ]; then
        KERNEL_PKG="linux-image-virtual"
        apt-cache show linux-image-virtual &>/dev/null || KERNEL_PKG="linux-image-generic"
    else
        KERNEL_PKG="linux-image-generic"
    fi
    log "Устанавливаю: $KERNEL_PKG"
    apt-get install -y "$KERNEL_PKG" || fatal "установка $KERNEL_PKG провалилась — ядро не менялось, система в исходном состоянии"

    if [ -d /boot/grub ] && command -v update-grub &>/dev/null; then
        update-grub || fatal "update-grub провалился — НЕ перезагружайтесь, разберитесь вручную"
    else
        fatal "/boot/grub или update-grub недоступны — VPS не позволяет смену ядра из гостя. Ядро НЕ изменено."
    fi

    log "Ядро установлено. Для применения необходим reboot:"
    echo ""
    echo "  shutdown -r now"
    echo ""
    echo "После загрузки проверьте: ./scripts/fix-vps-kernel.sh --verify"
    echo "Если VPS не загрузился (недоступен по SSH > 10 мин):"
    echo "  → панель хостера → VNC-консоль → grub → Advanced → старое ядро,"
    echo "  либо откат на снапшот."
}

# ── Проверка после reboot ────────────────────────────────────────────────────
verify() {
    echo "======== ПРОВЕРКА ПОСЛЕ REBOOT ========"
    log "Ядро теперь: $(uname -r)"

    if modprobe nf_nat 2>/dev/null; then
        echo "[ OK ] modprobe nf_nat → NAT_OK"
    else
        echo "[FAIL] nf_nat не загружается — ядро по-прежнему кастомное. Воркараунд остаётся."
        exit 1
    fi

    if $DNS_TEST_CMD; then
        echo "[ OK ] embedded DNS работает: dryclean-postgres резолвится"
        echo ""
        echo "Постоянное решение применено. Теперь можно (опционально):"
        echo "  - убрать extra_hosts из docker-compose*.yml"
        echo "  - вернуться к hostname-таргетам в monitoring/prometheus.prod.yml"
        echo "  - запустить ./scripts/check-dns.sh --strict для полной проверки"
        echo "Воркараунд (статические IP) можно оставить — он не мешает."
    else
        echo "[FAIL] DNS всё ещё не работает — смотрите: journalctl -u docker | grep -i resolver"
        echo "       и docker compose -f docker-compose.prod.yml restart postgres-exporter"
        exit 1
    fi
}

case "$MODE" in
    diag)    diag ;;
    install) install_kernel ;;
    verify)  verify ;;
esac
