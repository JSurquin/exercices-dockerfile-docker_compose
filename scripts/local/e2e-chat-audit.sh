#!/usr/bin/env bash
# E2E chat audit complet — matrice API (IA, routing, modération, accès, bot)
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
TAG="E2E-AUDIT-$(date +%s)"
COOKIE_JAR="/tmp/e2e-mod-cookies-$$.txt"
PASS=0
FAIL=0
SKIP=0
MOD_ID=""

pass() { echo "✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "❌ $1 — $2"; FAIL=$((FAIL + 1)); }
skip() { echo "⏭️  $1 — $2"; SKIP=$((SKIP + 1)); }

json_field() {
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$2',''))" 2>/dev/null || echo ""
}

json_nested() {
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); m=d.get('$2') or {}; print(m.get('$3','') if isinstance(m,dict) else '')" 2>/dev/null || echo ""
}

http_post() {
  local url="$1"
  local body="$2"
  local extra="${3:-}"
  if [ -n "$extra" ]; then
    curl -s -w "\n%{http_code}" $extra -X POST "$url" -H 'Content-Type: application/json' -d "$body"
  else
    curl -s -w "\n%{http_code}" -X POST "$url" -H 'Content-Type: application/json' -d "$body"
  fi
}

split_body_status() {
  HTTP_BODY=$(echo "$1" | sed '$d')
  HTTP_STATUS=$(echo "$1" | tail -n 1)
}

mod_login() {
  curl -s -c "$COOKIE_JAR" -X POST "$BASE/api/auth/sign-in/email" \
    -H 'Content-Type: application/json' \
    -d '{"email":"test-moderator@moonskin.test","password":"E2eTestPassword!9"}' >/dev/null 2>&1 || true
  MOD_ID=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT id FROM \"user\" WHERE email='test-moderator@moonskin.test' LIMIT 1;" 2>/dev/null || echo "")
}

wait_ai() {
  local conv_id="$1"
  local max_wait="${2:-30}"
  local i=0
  while [ "$i" -lt "$max_wait" ]; do
    local count
    count=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$conv_id' AND \"senderType\" IN ('AI','BOT');" 2>/dev/null || echo "0")
    if [ "${count:-0}" -gt 0 ]; then return 0; fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

wait_sender() {
  local conv_id="$1"
  local sender="$2"
  local max_wait="${3:-20}"
  local i=0
  while [ "$i" -lt "$max_wait" ]; do
    local count
    count=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$conv_id' AND \"senderType\"='$sender';" 2>/dev/null || echo "0")
    if [ "${count:-0}" -gt 0 ]; then return 0; fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

ai_refused() {
  local content="$1"
  echo "$content" | grep -qiE '__i18n:|assistant MoonSkin|ne peux répondre|hors sujet|MoonSkin uniquement'
}

# ── Préflight ───────────────────────────────────────────────────────────────
echo "=== E2E Chat Audit COMPLET — $TAG ==="
echo "Base: $BASE"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL non défini"
  exit 1
fi
DATABASE_URL="${DATABASE_URL%\"}"
DATABASE_URL="${DATABASE_URL#\"}"

if ! psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
  echo "❌ Connexion Postgres impossible"
  exit 1
fi

HEALTH=$(curl -s "$BASE/api/chat/ai/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
  pass "S0 préflight health IA ok"
else
  fail "S0 préflight health" "$HEALTH"
fi

mod_login

# ═══════════════════════════════════════════════════════════════════════════
# BLOC A — IA & GUARDS
# ═══════════════════════════════════════════════════════════════════════════

# S1: on-topic délai paiement
S1_TAG="${TAG}-S1"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S1_TAG} — Combien de jours avant le paiement après une vente CS2 ?\",\"category\":\"support\"}")
S1_ID=$(json_field "$RES" conversationId)
if [ -z "$S1_ID" ]; then
  fail "S1 création conversation" "pas de conversationId"
else
  if wait_ai "$S1_ID" 35; then
    AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT content FROM chat_message WHERE \"conversationId\"='$S1_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
    if echo "$AI_CONTENT" | grep -qiE '7|8|trade.?hold|jour'; then
      pass "S1 IA répond sur délai paiement (conv $S1_ID)"
    else
      fail "S1 contenu IA" "pas de mention trade hold: ${AI_CONTENT:0:120}"
    fi
    if echo "$AI_CONTENT" | grep -qiE 'achat|acheter'; then
      fail "S1 hallucination achat" "IA parle d'achat"
    else
      pass "S1 pas d'hallucination achat/vente"
    fi
  else
    fail "S1 réponse IA" "timeout conv $S1_ID"
  fi
fi

# S2: off-topic recette + category support → refus
S2_TAG="${TAG}-S2"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S2_TAG} — Donne moi une recette de tarte aux pommes\",\"category\":\"support\"}")
S2_ID=$(json_field "$RES" conversationId)
if [ -z "$S2_ID" ]; then
  fail "S2 création" "pas de conversationId"
elif wait_ai "$S2_ID" 25; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S2_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then pass "S2 off-topic refusé (recette + support)"; else fail "S2 off-topic" "${AI_CONTENT:0:120}"; fi
  if echo "$AI_CONTENT" | grep -qiE 'recette|cuisine|tarte'; then fail "S2 fuite recette" "contenu recette"; else pass "S2 pas de fuite recette"; fi
else
  fail "S2 refus IA" "timeout conv $S2_ID"
fi

# S10: off-topic sans catégorie
S10_TAG="${TAG}-S10"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S10_TAG} — Raconte une blague sur les chats\",\"forceNew\":true}")
S10_ID=$(json_field "$RES" conversationId)
if [ -z "$S10_ID" ]; then
  fail "S10 création" "pas de conversationId"
elif wait_ai "$S10_ID" 25; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S10_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then pass "S10 off-topic sans catégorie refusé"; else fail "S10 off-topic sans cat" "${AI_CONTENT:0:120}"; fi
else
  fail "S10 refus IA" "timeout"
fi

# S11: off-topic code
S11_TAG="${TAG}-S11"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S11_TAG} — Écris un programme Python pour pirater un serveur\",\"category\":\"support\",\"forceNew\":true}")
S11_ID=$(json_field "$RES" conversationId)
if [ -z "$S11_ID" ]; then
  fail "S11 création" "pas de conversationId"
elif wait_ai "$S11_ID" 25; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S11_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then pass "S11 off-topic code refusé"; else fail "S11 code" "${AI_CONTENT:0:120}"; fi
else
  fail "S11 refus IA" "timeout"
fi

# S12: on-topic KYC
S12_TAG="${TAG}-S12"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S12_TAG} — Comment valider mon KYC pour recevoir un virement SEPA ?\",\"category\":\"kyc\",\"forceNew\":true}")
S12_ID=$(json_field "$RES" conversationId)
if [ -z "$S12_ID" ]; then
  fail "S12 création" "pas de conversationId"
elif wait_ai "$S12_ID" 30; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S12_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then
    fail "S12 KYC on-topic" "refusé à tort: ${AI_CONTENT:0:120}"
  else
    pass "S12 question KYC → réponse IA"
  fi
else
  fail "S12 IA KYC" "timeout"
fi

# S13: on-topic trade
S13_TAG="${TAG}-S13"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S13_TAG} — Mon trade CS2 est bloqué par le bot Steam, que faire ?\",\"category\":\"trade\",\"forceNew\":true}")
S13_ID=$(json_field "$RES" conversationId)
if [ -z "$S13_ID" ]; then
  fail "S13 création" "pas de conversationId"
elif wait_ai "$S13_ID" 30; then
  pass "S13 question trade → réponse IA"
else
  fail "S13 IA trade" "timeout"
fi

# S3: POST /conversations → IA
S3_TAG="${TAG}-S3"
RES=$(curl -s -X POST "$BASE/api/chat/conversations" -H 'Content-Type: application/json' \
  -d "{\"initialMessage\":\"${S3_TAG} — Quel est le délai trade hold Steam ?\",\"subject\":\"Audit S3\",\"category\":\"trade\"}")
S3_ID=$(json_field "$RES" id)
if [ -z "$S3_ID" ]; then
  fail "S3 création via conversations" "pas d'id"
elif wait_ai "$S3_ID" 35; then
  pass "S3 IA via POST /conversations (conv $S3_ID)"
else
  fail "S3 IA via conversations" "timeout"
fi

# S4: salutation
S4_TAG="${TAG}-S4"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S4_TAG} — Bonjour\",\"category\":\"support\",\"forceNew\":true}")
S4_ID=$(json_field "$RES" conversationId)
if [ -z "$S4_ID" ]; then
  fail "S4 création" "pas de conversationId"
elif wait_ai "$S4_ID" 25; then
  pass "S4 salutation → réponse IA"
else
  fail "S4 salutation" "pas de réponse IA"
fi

# ═══════════════════════════════════════════════════════════════════════════
# BLOC B — MODÉRATION
# ═══════════════════════════════════════════════════════════════════════════

if [ -n "${S1_ID:-}" ] && [ -n "$MOD_ID" ]; then
  curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/conversations/${S1_ID}/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"moderatorId\":\"$MOD_ID\"}" >/dev/null

  BEFORE=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S1_ID' AND \"senderType\"='AI';" 2>/dev/null || echo "0")

  curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S1_ID\",\"content\":\"${TAG}-S5 — Relance après assignation modérateur\"}" >/dev/null

  sleep 12
  AFTER=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S1_ID' AND \"senderType\"='AI';" 2>/dev/null || echo "0")

  if [ "$BEFORE" = "$AFTER" ]; then pass "S5 IA coupée après assignation"; else fail "S5 IA après assign" "avant=$BEFORE après=$AFTER"; fi

  BOT_ACK=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S1_ID' AND \"senderType\"='BOT' AND content LIKE '%followUp%';" 2>/dev/null || echo "0")
  if [ "${BOT_ACK:-0}" -gt 0 ]; then pass "S5b accusé relance post-assignation"; else fail "S5b accusé relance" "pas de BOT followUp"; fi

  RES=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S1_ID\",\"content\":\"${TAG}-S6 — Réponse modérateur audit\",\"replyContext\":\"moderation\"}")
  CREATED_NEW=$(json_field "$RES" createdNewConversation)
  RES_CONV=$(json_field "$RES" conversationId)
  if [ "$RES_CONV" = "$S1_ID" ] && [ "$CREATED_NEW" != "True" ] && [ "$CREATED_NEW" != "true" ]; then
    pass "S6 mod répond sur même ticket (pas de fork)"
  else
    fail "S6 fork mod" "conv=$RES_CONV createdNew=$CREATED_NEW"
  fi
  MOD_COUNT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S1_ID' AND \"senderType\"='MODERATOR';" 2>/dev/null || echo "0")
  if [ "${MOD_COUNT:-0}" -gt 0 ]; then pass "S6 message MODERATOR enregistré"; else fail "S6 modérateur" "aucun MODERATOR"; fi

  # S16: staff via widget → USER
  RES=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S1_ID\",\"content\":\"${TAG}-S16 — Staff via widget\"}")
  SENDER=$(json_field "$RES" senderType)
  if [ "$SENDER" = "USER" ]; then pass "S16 staff widget → senderType USER"; else fail "S16 widget sender" "got $SENDER"; fi

  # S17: staff via moderation → MODERATOR
  RES=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S1_ID\",\"content\":\"${TAG}-S17 — Staff via moderation\",\"replyContext\":\"moderation\"}")
  SENDER=$(json_field "$RES" senderType)
  if [ "$SENDER" = "MODERATOR" ]; then pass "S17 staff moderation → senderType MODERATOR"; else fail "S17 mod sender" "got $SENDER"; fi
else
  skip "S5-S6-S16-S17 modération" "S1_ID ou MOD_ID manquant"
fi

# S7: isolation 2 conversations
S7A_TAG="${TAG}-S7A"
S7B_TAG="${TAG}-S7B"
RES_A=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S7A_TAG} — Conversation A isolation\",\"category\":\"trade\",\"forceNew\":true}")
RES_B=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S7B_TAG} — Conversation B isolation\",\"category\":\"payment\",\"forceNew\":true}")
S7A_ID=$(json_field "$RES_A" conversationId)
S7B_ID=$(json_field "$RES_B" conversationId)
if [ -n "$S7A_ID" ] && [ -n "$S7B_ID" ] && [ "$S7A_ID" != "$S7B_ID" ]; then
  pass "S7 deux conversations distinctes"
  if [ -n "$MOD_ID" ]; then
    curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/messages" \
      -H 'Content-Type: application/json' \
      -d "{\"conversationId\":\"$S7A_ID\",\"content\":\"${TAG}-S7 — Réponse UNIQUEMENT conv A\",\"replyContext\":\"moderation\"}" >/dev/null
    B_MOD=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S7B_ID' AND \"senderType\"='MODERATOR';" 2>/dev/null || echo "0")
    A_MOD=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S7A_ID' AND \"senderType\"='MODERATOR';" 2>/dev/null || echo "0")
    if [ "${A_MOD:-0}" -gt 0 ] && [ "${B_MOD:-0}" -eq 0 ]; then pass "S7 isolation modérateur conv A seule"; else fail "S7 isolation" "A=$A_MOD B=$B_MOD"; fi
  else
    skip "S7 isolation mod" "pas de modérateur"
  fi
else
  fail "S7 création 2 convs" "A=$S7A_ID B=$S7B_ID"
fi

# ═══════════════════════════════════════════════════════════════════════════
# BLOC C — ROUTING & WIDGET FLOWS
# ═══════════════════════════════════════════════════════════════════════════

# S8: ask-question category support
S8_TAG="${TAG}-S8"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S8_TAG} — Question libre support\",\"category\":\"support\",\"forceNew\":true}")
S8_ID=$(json_field "$RES" conversationId)
if [ -n "$S8_ID" ]; then
  CAT=$(psql "$DATABASE_URL" -t -A -c "SELECT category FROM conversation WHERE id='$S8_ID';" 2>/dev/null || echo "")
  if [ "$CAT" = "support" ]; then pass "S8 catégorie support enregistrée"; else fail "S8 catégorie" "got '$CAT'"; fi
  if wait_ai "$S8_ID" 30; then
    BOT_OTHER=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S8_ID' AND \"senderType\"='BOT' AND content LIKE '%other%';" 2>/dev/null || echo "0")
    if [ "${BOT_OTHER:-0}" -eq 0 ]; then pass "S19 ask-question: pas de bot support.other parasite"; else fail "S19 bot parasite" "count=$BOT_OTHER"; fi
  else
    fail "S19 ask-question IA" "timeout"
  fi
else
  fail "S8 création" "pas de conversationId"
fi

# S20: forceNew → nouvelle conv
S20_TAG="${TAG}-S20"
RES1=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S20_TAG} — Premier thread\",\"category\":\"trade\",\"forceNew\":true}")
S20_ID1=$(json_field "$RES1" conversationId)
RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S20_TAG} — Deuxième thread forceNew\",\"category\":\"trade\",\"forceNew\":true}")
S20_ID2=$(json_field "$RES2" conversationId)
if [ -n "$S20_ID1" ] && [ -n "$S20_ID2" ] && [ "$S20_ID1" != "$S20_ID2" ]; then
  pass "S20 forceNew crée des conversations distinctes"
else
  fail "S20 forceNew" "id1=$S20_ID1 id2=$S20_ID2"
fi

# S21: même fil après réponse IA (awaiting staff)
S21_TAG="${TAG}-S21"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S21_TAG} — Premier message routing\",\"category\":\"support\",\"forceNew\":true}")
S21_ID=$(json_field "$RES" conversationId)
if [ -z "$S21_ID" ]; then
  fail "S21 création" "pas de conv"
elif wait_ai "$S21_ID" 30; then
  RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S21_ID\",\"content\":\"${S21_TAG} — Relance même sujet\"}")
  S21_ID2=$(json_field "$RES2" conversationId)
  CREATED=$(json_field "$RES2" createdNewConversation)
  if [ "$S21_ID2" = "$S21_ID" ] && [ "$CREATED" != "True" ] && [ "$CREATED" != "true" ]; then
    pass "S21 même fil après réponse IA"
  else
    fail "S21 routing same" "conv=$S21_ID2 createdNew=$CREATED"
  fi
else
  fail "S21 IA initiale" "timeout"
fi

# S22: changement catégorie → fork
S22_TAG="${TAG}-S22"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S22_TAG} — Problème trade bloqué\",\"category\":\"trade\",\"forceNew\":true}")
S22_ID=$(json_field "$RES" conversationId)
if [ -z "$S22_ID" ]; then
  fail "S22 création trade" "pas de conv"
elif wait_ai "$S22_ID" 35; then
  sleep 2
  RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S22_ID\",\"content\":\"${S22_TAG} — Où est mon virement SEPA ?\",\"category\":\"payment\"}")
  S22_ID2=$(json_field "$RES2" conversationId)
  CREATED=$(json_field "$RES2" createdNewConversation)
  if [ "$S22_ID2" != "$S22_ID" ] || [ "$CREATED" = "True" ] || [ "$CREATED" = "true" ]; then
    pass "S22 changement catégorie → nouveau fil"
  else
    fail "S22 fork catégorie" "même conv $S22_ID"
  fi
else
  fail "S22 IA trade" "timeout"
fi

# S29: relance avant assign (après bot + ticket) → accusé BOT
S29_TAG="${TAG}-S29"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S29_TAG} — Trade en attente\",\"category\":\"trade\",\"forceNew\":true}")
S29_ID=$(json_field "$RES" conversationId)
if [ -z "$S29_ID" ]; then
  fail "S29 création" "pas de conv"
else
  curl -s -X POST "$BASE/api/chat/conversations/${S29_ID}/bot-message" \
    -H 'Content-Type: application/json' \
    -d '{"subcategoryKey":"trade.pending"}' >/dev/null
  curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S29_ID\",\"content\":\"${S29_TAG} — Détail initial\"}" >/dev/null
  sleep 2
  curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S29_ID\",\"content\":\"${S29_TAG} — Relance avant assign mod\"}" >/dev/null
  sleep 2
  FOLLOW=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S29_ID' AND \"senderType\"='BOT' AND content LIKE '%followUp%';" 2>/dev/null || echo "0")
  if [ "${FOLLOW:-0}" -gt 0 ]; then pass "S29 accusé relance avant assignation (post-ticket)"; else fail "S29 ack avant assign" "pas de BOT followUp"; fi
fi

# S18: bot-message + user → ticket transmis
S18_TAG="${TAG}-S18"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S18_TAG} — Trade en attente\",\"category\":\"trade\",\"forceNew\":true}")
S18_ID=$(json_field "$RES" conversationId)
if [ -z "$S18_ID" ]; then
  fail "S18 création" "pas de conv"
else
  BOT_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/chat/conversations/${S18_ID}/bot-message" \
    -H 'Content-Type: application/json' \
    -d '{"subcategoryKey":"trade.pending"}')
  split_body_status "$BOT_RES"
  if [ "$HTTP_STATUS" = "201" ]; then
    pass "S18 bot-message trade.pending injecté"
    curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
      -d "{\"conversationId\":\"$S18_ID\",\"content\":\"${S18_TAG} — Détail utilisateur après bot\"}" >/dev/null
    sleep 2
    SYS=$(psql "$DATABASE_URL" -t -A -c \
      "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S18_ID' AND \"senderType\"='SYSTEM' AND content LIKE '%ticketTransmitted%';" 2>/dev/null || echo "0")
    if [ "${SYS:-0}" -gt 0 ]; then pass "S18 ticket transmis SYSTEM après 1er message user post-BOT"; else fail "S18 ticket" "pas de SYSTEM"; fi
  else
    fail "S18 bot-message" "status=$HTTP_STATUS"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# BLOC D — ACCÈS & CONVERSATION FERMÉE
# ═══════════════════════════════════════════════════════════════════════════

# S23: guest 401 sur conv liée à un compte
USER_CONV=$(psql "$DATABASE_URL" -t -A -c \
  "SELECT id FROM conversation WHERE \"userId\" IS NOT NULL LIMIT 1;" 2>/dev/null || echo "")
if [ -n "$USER_CONV" ]; then
  RES=$(http_post "$BASE/api/chat/messages" "{\"conversationId\":\"$USER_CONV\",\"content\":\"${TAG}-S23 guest hack\"}")
  split_body_status "$RES"
  if [ "$HTTP_STATUS" = "401" ]; then pass "S23 guest bloqué sur conv utilisateur (401)"; else fail "S23 accès guest" "status=$HTTP_STATUS"; fi
else
  skip "S23 guest 401" "aucune conv userId en base"
fi

# S24: guest GET messages sur conv invité
if [ -n "${S4_ID:-}" ]; then
  RES=$(curl -s -w "\n%{http_code}" "$BASE/api/chat/conversations/${S4_ID}/messages")
  split_body_status "$RES"
  if [ "$HTTP_STATUS" = "200" ]; then pass "S24 guest peut lire sa conversation"; else fail "S24 GET guest" "status=$HTTP_STATUS"; fi
else
  skip "S24 GET guest" "S4_ID manquant"
fi

# S25-S26: conversation fermée
S25_TAG="${TAG}-S25"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S25_TAG} — Conv à fermer\",\"category\":\"support\",\"forceNew\":true}")
S25_ID=$(json_field "$RES" conversationId)
if [ -n "$S25_ID" ] && [ -n "$MOD_ID" ]; then
  curl -s -b "$COOKIE_JAR" -X PATCH "$BASE/api/chat/conversations/${S25_ID}" \
    -H 'Content-Type: application/json' \
    -d '{"status":"CLOSED"}' >/dev/null

  RES=$(http_post "$BASE/api/chat/messages" "{\"conversationId\":\"$S25_ID\",\"content\":\"${S25_TAG} — Guest sur fermée\"}")
  split_body_status "$RES"
  if [ "$HTTP_STATUS" = "400" ]; then pass "S25 guest bloqué sur conv fermée"; else fail "S25 guest fermée" "status=$HTTP_STATUS"; fi

  curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/conversations/${S25_ID}/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"moderatorId\":\"$MOD_ID\"}" >/dev/null

  RES=$(http_post "$BASE/api/chat/messages" "{\"conversationId\":\"$S25_ID\",\"content\":\"${S25_TAG} — Mod sur fermée\",\"replyContext\":\"moderation\"}" "-b $COOKIE_JAR")
  split_body_status "$RES"
  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    pass "S26 mod peut répondre sur conv fermée assignée"
  else
    fail "S26 mod fermée" "status=$HTTP_STATUS body=${HTTP_BODY:0:80}"
  fi
else
  skip "S25-S26 fermée" "S25_ID ou MOD_ID manquant"
fi

# S27: message vide rejeté
RES=$(http_post "$BASE/api/chat/messages" '{"content":"   "}')
split_body_status "$RES"
if [ "$HTTP_STATUS" = "400" ]; then pass "S27 message vide rejeté (400)"; else fail "S27 vide" "status=$HTTP_STATUS"; fi

# ═══════════════════════════════════════════════════════════════════════════
# BLOC E — CAS SUPPLÉMENTAIRES
# ═══════════════════════════════════════════════════════════════════════════

# S30: off-topic météo
S30_TAG="${TAG}-S30"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S30_TAG} — Quel temps fait-il à Paris demain ?\",\"forceNew\":true}")
S30_ID=$(json_field "$RES" conversationId)
if [ -z "$S30_ID" ]; then
  fail "S30 création" "pas de conv"
elif wait_ai "$S30_ID" 25; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S30_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then pass "S30 off-topic météo refusé"; else fail "S30 météo" "${AI_CONTENT:0:120}"; fi
else
  fail "S30 refus IA" "timeout"
fi

# S31: question ambiguë courte avec ?
S31_TAG="${TAG}-S31"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S31_TAG} — Comment ça marche ?\",\"category\":\"support\",\"forceNew\":true}")
S31_ID=$(json_field "$RES" conversationId)
if [ -z "$S31_ID" ]; then
  fail "S31 création" "pas de conv"
elif wait_ai "$S31_ID" 30; then
  pass "S31 question ambiguë → réponse IA autorisée"
else
  fail "S31 IA ambiguë" "timeout"
fi

# S32: subject shift trade → payment (mots-clés)
S32_TAG="${TAG}-S32"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S32_TAG} — Mon trade CS2 est bloqué\",\"category\":\"trade\",\"forceNew\":true}")
S32_ID=$(json_field "$RES" conversationId)
if [ -z "$S32_ID" ]; then
  fail "S32 création" "pas de conv"
elif wait_ai "$S32_ID" 35; then
  sleep 2
  RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S32_ID\",\"content\":\"${S32_TAG} — Où est mon virement SEPA IBAN ?\"}")
  S32_ID2=$(json_field "$RES2" conversationId)
  CREATED=$(json_field "$RES2" createdNewConversation)
  if [ "$S32_ID2" != "$S32_ID" ] || [ "$CREATED" = "True" ] || [ "$CREATED" = "true" ]; then
    pass "S32 subject shift trade→payment → nouveau fil"
  else
    fail "S32 subject shift" "même conv $S32_ID"
  fi
else
  fail "S32 IA trade" "timeout"
fi

# S33: bot-message clé invalide → 400
S33_TAG="${TAG}-S33"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S33_TAG} — test bot\",\"category\":\"trade\",\"forceNew\":true}")
S33_ID=$(json_field "$RES" conversationId)
if [ -n "$S33_ID" ]; then
  BOT_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/chat/conversations/${S33_ID}/bot-message" \
    -H 'Content-Type: application/json' \
    -d '{"subcategoryKey":"invalid.key.xyz"}')
  split_body_status "$BOT_RES"
  if [ "$HTTP_STATUS" = "400" ]; then pass "S33 bot-message clé invalide → 400"; else fail "S33 bot invalide" "status=$HTTP_STATUS"; fi
else
  fail "S33 création" "pas de conv"
fi

# S34: conversationId inexistant → 404
RES=$(http_post "$BASE/api/chat/messages" '{"conversationId":"conv-inexistant-audit-000","content":"test"}')
split_body_status "$RES"
if [ "$HTTP_STATUS" = "404" ]; then pass "S34 conversationId inexistant → 404"; else fail "S34 404" "status=$HTTP_STATUS"; fi

# S35: mod via route thread [id]/messages + replyContext moderation
if [ -n "${S7B_ID:-}" ] && [ -n "$MOD_ID" ]; then
  RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/chat/conversations/${S7B_ID}/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"content\":\"${TAG}-S35 — Mod via thread route\",\"replyContext\":\"moderation\"}")
  split_body_status "$RES"
  S35_CONV=$(json_field "$HTTP_BODY" conversationId)
  S35_SENDER=$(json_nested "$HTTP_BODY" message senderType)
  if [ "$HTTP_STATUS" = "201" ] && [ "$S35_CONV" = "$S7B_ID" ] && [ "$S35_SENDER" = "MODERATOR" ]; then
    pass "S35 mod thread route sans fork + sender MODERATOR"
  else
    fail "S35 thread route" "status=$HTTP_STATUS conv=$S35_CONV sender=$S35_SENDER"
  fi
else
  skip "S35 thread route" "S7B_ID ou MOD_ID manquant"
fi

# S36: guest GET conv utilisateur → 403
if [ -n "$USER_CONV" ]; then
  RES=$(curl -s -w "\n%{http_code}" "$BASE/api/chat/conversations/${USER_CONV}/messages")
  split_body_status "$RES"
  if [ "$HTTP_STATUS" = "403" ] || [ "$HTTP_STATUS" = "401" ]; then
    pass "S36 guest GET conv user bloqué ($HTTP_STATUS)"
  else
    fail "S36 GET guest user conv" "status=$HTTP_STATUS"
  fi
else
  skip "S36 GET guest user" "USER_CONV manquant"
fi

# S37: payment on-topic
S37_TAG="${TAG}-S37"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S37_TAG} — Délai virement SEPA après vente de skins ?\",\"category\":\"payment\",\"forceNew\":true}")
S37_ID=$(json_field "$RES" conversationId)
if [ -z "$S37_ID" ]; then
  fail "S37 création" "pas de conv"
elif wait_ai "$S37_ID" 30; then
  AI_CONTENT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT content FROM chat_message WHERE \"conversationId\"='$S37_ID' AND \"senderType\"='AI' ORDER BY \"createdAt\" DESC LIMIT 1;" 2>/dev/null || echo "")
  if ai_refused "$AI_CONTENT"; then fail "S37 payment on-topic" "refusé: ${AI_CONTENT:0:80}"; else pass "S37 payment on-topic → IA"; fi
else
  fail "S37 IA payment" "timeout"
fi

# S38: inactivité 24h → nouveau fil (après réponse IA)
S38_TAG="${TAG}-S38"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S38_TAG} — Thread inactif\",\"category\":\"support\",\"forceNew\":true}")
S38_ID=$(json_field "$RES" conversationId)
if [ -z "$S38_ID" ]; then
  fail "S38 création" "pas de conv"
elif wait_ai "$S38_ID" 35; then
  psql "$DATABASE_URL" -c \
    "UPDATE conversation SET \"lastMessageAt\" = NOW() - INTERVAL '25 hours' WHERE id='$S38_ID';" >/dev/null 2>&1
  RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S38_ID\",\"content\":\"${S38_TAG} — Relance après 25h inactivité\"}")
  S38_ID2=$(json_field "$RES2" conversationId)
  CREATED=$(json_field "$RES2" createdNewConversation)
  if [ "$S38_ID2" != "$S38_ID" ] || [ "$CREATED" = "True" ] || [ "$CREATED" = "true" ]; then
    pass "S38 inactivité 24h → nouveau fil"
  else
    fail "S38 inactivité" "même conv $S38_ID"
  fi
else
  fail "S38 IA initiale" "timeout avant test inactivité"
fi

# S38b: inactivité + attente staff sans réponse → même fil (comportement voulu)
S38B_TAG="${TAG}-S38B"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S38B_TAG} — Message sans réponse IA\",\"category\":\"support\",\"forceNew\":true}")
S38B_ID=$(json_field "$RES" conversationId)
if [ -z "$S38B_ID" ]; then
  fail "S38b création" "pas de conv"
else
  psql "$DATABASE_URL" -c \
    "UPDATE conversation SET \"lastMessageAt\" = NOW() - INTERVAL '25 hours' WHERE id='$S38B_ID';" >/dev/null 2>&1
  RES2=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S38B_ID\",\"content\":\"${S38B_TAG} — Relance en attente staff\"}")
  S38B_ID2=$(json_field "$RES2" conversationId)
  CREATED=$(json_field "$RES2" createdNewConversation)
  if [ "$S38B_ID2" = "$S38B_ID" ] && [ "$CREATED" != "True" ] && [ "$CREATED" != "true" ]; then
    pass "S38b inactivité + attente staff → même fil conservé"
  else
    fail "S38b awaiting staff" "conv=$S38B_ID2 createdNew=$CREATED"
  fi
fi

# S39: assign puis unassign
S39_TAG="${TAG}-S39"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S39_TAG} — Conv assign/unassign\",\"category\":\"support\",\"forceNew\":true}")
S39_ID=$(json_field "$RES" conversationId)
if [ -n "$S39_ID" ] && [ -n "$MOD_ID" ]; then
  curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/chat/conversations/${S39_ID}/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"moderatorId\":\"$MOD_ID\"}" >/dev/null
  ASSIGNED=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT \"assignedTo\" FROM conversation WHERE id='$S39_ID';" 2>/dev/null || echo "")
  if [ "$ASSIGNED" = "$MOD_ID" ]; then
    pass "S39a assignation modérateur OK"
  else
    fail "S39a assign" "assignedTo=$ASSIGNED"
  fi
  UNASSIGN_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X DELETE "$BASE/api/chat/conversations/${S39_ID}/assign")
  split_body_status "$UNASSIGN_RES"
  ASSIGNED_AFTER=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT \"assignedTo\" FROM conversation WHERE id='$S39_ID';" 2>/dev/null || echo "")
  UNASSIGNED_MSG=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S39_ID' AND \"senderType\"='SYSTEM' AND content LIKE '%unassigned%';" 2>/dev/null || echo "0")
  if [ "$HTTP_STATUS" = "200" ] && [ -z "$ASSIGNED_AFTER" ]; then
    pass "S39b unassign → assignedTo null"
  else
    fail "S39b unassign" "status=$HTTP_STATUS assignedTo=$ASSIGNED_AFTER"
  fi
  if [ "${UNASSIGNED_MSG:-0}" -gt 0 ]; then pass "S39c message SYSTEM unassigned"; else fail "S39c unassigned msg" "count=$UNASSIGNED_MSG"; fi
else
  skip "S39 assign/unassign" "S39_ID ou MOD_ID manquant"
fi

# S40: pas de ticket SYSTEM dupliqué après 2e message user post-bot
S40_TAG="${TAG}-S40"
RES=$(curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
  -d "{\"content\":\"${S40_TAG} — Trade pending\",\"category\":\"trade\",\"forceNew\":true}")
S40_ID=$(json_field "$RES" conversationId)
if [ -z "$S40_ID" ]; then
  fail "S40 création" "pas de conv"
else
  curl -s -X POST "$BASE/api/chat/conversations/${S40_ID}/bot-message" \
    -H 'Content-Type: application/json' \
    -d '{"subcategoryKey":"trade.pending"}' >/dev/null
  curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S40_ID\",\"content\":\"${S40_TAG} — Premier détail\"}" >/dev/null
  sleep 2
  curl -s -X POST "$BASE/api/chat/messages" -H 'Content-Type: application/json' \
    -d "{\"conversationId\":\"$S40_ID\",\"content\":\"${S40_TAG} — Deuxième détail\"}" >/dev/null
  sleep 2
  TICKET_COUNT=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT COUNT(*) FROM chat_message WHERE \"conversationId\"='$S40_ID' AND \"senderType\"='SYSTEM' AND content LIKE '%ticketTransmitted%';" 2>/dev/null || echo "0")
  if [ "${TICKET_COUNT:-0}" -eq 1 ]; then pass "S40 un seul ticket SYSTEM (pas de doublon)"; else fail "S40 ticket dup" "count=$TICKET_COUNT"; fi
fi

# S9: health (rappel)
if echo "$HEALTH" | grep -q '"enabled":true'; then pass "S9 health IA enabled"; else fail "S9 enabled" "$HEALTH"; fi

# ── Résumé ───────────────────────────────────────────────────────────────
echo ""
echo "=== RÉSUMÉ AUDIT E2E ==="
echo "✅ Pass: $PASS"
echo "❌ Fail: $FAIL"
echo "⏭️  Skip: $SKIP"
echo "Tag audit: $TAG"
rm -f "$COOKIE_JAR"
[ "$FAIL" -eq 0 ]
