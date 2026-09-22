#!/bin/bash
# Тесты SMTP-env конструктора deploy-vps.sh (ЧТЗ_SMTP_переменные_на_проде_PROD-ENV)
# Извлекает блок Step 1.05 и проверяет под set -euo pipefail.
# ВНИМАНИЕ: блок требует bash >= 4.4 (пустой массив под set -u; deploy-vps.sh
# уже использует ${var,,} — bash 4+). На проде GNU bash 5.1. Тест запускается
# bash >= 4.4 (homebrew), иначе соответствующие проверки пропускаются.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-vps.sh"
PASS_CNT=0; FAIL_CNT=0; SKIP_CNT=0

# Целевой bash: как на проде (>= 4.4)
TARGET_BASH="/bin/bash"
if command -v /opt/homebrew/bin/bash &>/dev/null; then TARGET_BASH="/opt/homebrew/bin/bash"; fi
TARGET_VER=$("$TARGET_BASH" -c 'echo "${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}"')
MAJOR="${TARGET_VER%%.*}"; MINOR="${TARGET_VER#*.}"
SEMANTICS_OK=0
if [ "$MAJOR" -gt 4 ] || { [ "$MAJOR" -eq 4 ] && [ "$MINOR" -ge 4 ]; }; then SEMANTICS_OK=1; fi

ok()   { echo "  OK: $1"; PASS_CNT=$((PASS_CNT+1)); }
fail() { echo "  FAIL: $1"; FAIL_CNT=$((FAIL_CNT+1)); }
skip() { echo "  SKIP: $1 (bash $TARGET_VER < 4.4)"; SKIP_CNT=$((SKIP_CNT+1)); }

extract_block() {
    sed -n '/# ── Step 1.05: SMTP env/,/^fi$/p' "$DEPLOY_SCRIPT"
}

# Выполнить блок в чистой среде; аргументы = VAR=VALUE (argv, пробелы безопасны)
run_block() {
    local vars=("$@")
    local block; block=$(extract_block)
    env -i HOME="$HOME" PATH="$PATH" "${vars[@]+"${vars[@]}"}" "$TARGET_BASH" -c '
        set -euo pipefail
        log() { echo "[log] $1"; }
        sizing=()
        [ -n "${vars_present:-}" ] && sizing=(1)  # no-op, для шаблона
        '"$block"'
        printf "ELEMENTS=%d\n" "${#SMTP_FRONTEND_ENV[@]}"
        if [ "${#SMTP_FRONTEND_ENV[@]}" -gt 0 ]; then
            printf "ARG:%s\n" "${SMTP_FRONTEND_ENV[@]}"
        fi
    ' 2>&1
}

echo "Target bash: $TARGET_BASH ($TARGET_VER), семантика bash>=4.4: $SEMANTICS_OK"

echo "── Test 1: bash -n deploy-vps.sh ──"
bash -n "$DEPLOY_SCRIPT" && ok "синтаксис" || fail "синтаксис"

echo "── Test 2: без SMTP_* (.env без SMTP) — обратная совместимость ──"
if [ "$SEMANTICS_OK" -eq 1 ]; then
    OUT=$(run_block)
    RC=$?
    if [ $RC -eq 0 ]; then ok "блок жив под set -euo pipefail"; else fail "блок упал (rc=$RC): $(echo "$OUT" | tail -2)"; fi
    echo "$OUT" | grep -q '^ELEMENTS=0$' && ok "массив пуст" || fail "массив не пуст"
    echo "$OUT" | grep -q 'SMTP export: disabled' && ok "лог disabled" || fail "нет лога disabled"
    echo "$OUT" | grep -q 'unbound variable' && fail "unbound variable на пустом массиве" || ok "set -u безопасен на пустом массиве"
else
    skip "проверки пустого массива под set -u"
fi

echo "── Test 3: полный набор SMTP_* (спецсимволы, пробелы, запятые) ──"
if [ "$SEMANTICS_OK" -eq 1 ]; then
    OUT=$(run_block "SMTP_HOST=smtp.yandex.ru" "SMTP_PORT=465" "SMTP_SECURE=true" \
                    "SMTP_USER=test@yandex.ru" "SMTP_PASS=p@ss w0rd\$pecial" \
                    "SMTP_TO=a@yandex.ru,b@mail.ru" "SMTP_FROM=site@yandex.ru")
    RC=$?
    [ $RC -eq 0 ] && ok "блок жив" || fail "блок упал (rc=$RC)"
    echo "$OUT" | grep -q '^ELEMENTS=14$' && ok "14 элементов (7 пар -e KEY=VAL)" || fail "ожидалось 14: $(echo "$OUT" | head -1)"
    echo "$OUT" | grep -Fxq 'ARG:SMTP_PASS=p@ss w0rd$pecial' && ok "спецсимволы/пробелы сохранены" || fail "SMTP_PASS искажён"
    echo "$OUT" | grep -q 'SMTP export: enabled' && ok "лог enabled" || fail "нет лога enabled"
    echo "$OUT" | grep '\[log\]' | grep -q 'w0rd' && fail "СЕКРЕТ В ЛОГЕ" || ok "секрет не логируется"
else
    skip "runtime-проверки конструктора"
fi

echo "── Test 4: частичный набор (только USER/PASS) ──"
if [ "$SEMANTICS_OK" -eq 1 ]; then
    OUT=$(run_block "SMTP_USER=u@yandex.ru" "SMTP_PASS=secret1")
    echo "$OUT" | grep -q '^ELEMENTS=4$' && ok "4 элемента, только установленные vars" || fail "ожидалось 4"
else
    skip "runtime-проверка частичного набора"
fi

echo "── Test 5: структурный — массив в 3 docker run frontend ──"
SITES=$(grep -c '"${SMTP_FRONTEND_ENV\[@\]}"' "$DEPLOY_SCRIPT")
[ "$SITES" -eq 3 ] && ok "3 места docker run (найдено $SITES)" || fail "найдено $SITES, ожидалось 3"
FRONT_SITES=$(grep -B8 '"${SMTP_FRONTEND_ENV\[@\]}"' "$DEPLOY_SCRIPT" | grep -c 'name dryclean-frontend')
[ "$FRONT_SITES" -eq 3 ] && ok "только frontend-контейнеры" || fail "frontend-контейнеров: $FRONT_SITES"
CONTENT_SITES=$(grep -B8 '"${SMTP_FRONTEND_ENV\[@\]}"' "$DEPLOY_SCRIPT" | grep -c 'name dryclean-content')
[ "$CONTENT_SITES" -eq 0 ] && ok "SMTP не утекает в content-контейнеры" || fail "массив попал в content run"

echo "── Test 6: блок не выполняется при source (только внутри функций/Step 1) ──"
grep -n 'Step 1.05' "$DEPLOY_SCRIPT" | head -1 | grep -q ':7[0-9]:' && ok "блок после source .env (Step 1)" || skip "позиция блока изменилась — проверить вручную"

echo ""
echo "SMTP-ENV TESTS: $PASS_CNT passed, $FAIL_CNT failed, $SKIP_CNT skipped"
[ "$FAIL_CNT" -eq 0 ] || exit 1
