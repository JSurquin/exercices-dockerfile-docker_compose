#!/usr/bin/env python3
"""Audit d'autorisation des routes API Next.

Pour chaque `route.ts` sous src/app/api, détecte les handlers mutateurs
(POST/PUT/PATCH/DELETE) et vérifie la présence d'un garde d'auth/autorisation.
But: repérer un endpoint mutateur exposé sans contrôle (broken access control).
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

API_DIR = Path("src/app/api")

# Indices qu'un contrôle d'accès est présent dans le fichier.
AUTH_MARKERS = [
    "getSession",
    "requireAdminSession",
    "requireAdminOrModerator",
    "requireCronSecret",
    "resolveChatIdentity",
    "validateWebhookSignature",
    "isTestAuthEnabled",
    "NODE_ENV === 'production'",
    'NODE_ENV === "production"',
    "auth.api.getSession",
    "assertTradeOwnership",
    "requireTradeOwnership",
    "requireUserSession",
    "getCurrentUserForTwoFactor",
    "verifySkinplaceSignature",
    "kycaidApplicantId",
]

# Routes publiques par conception (lecture seule / endpoints ouverts légitimes).
PUBLIC_ALLOWLIST = {
    "newsletter",          # inscription publique (rate-limited)
    "exchange-rate",
    "stats",
    "build-id",
    "partners",
    "legal-pages",
    "giveaways",           # liste publique
}

HANDLER_RE = re.compile(r"export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b")
MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


def is_allowlisted(path: Path) -> bool:
    parts = set(path.parts)
    return bool(parts & PUBLIC_ALLOWLIST)


def main() -> int:
    if not API_DIR.exists():
        print(f"!! {API_DIR} introuvable (lancer depuis la racine du repo)")
        return 2

    routes = sorted(API_DIR.rglob("route.ts"))
    flagged: list[tuple[Path, list[str]]] = []
    scanned = 0

    for route in routes:
        text = route.read_text(encoding="utf-8", errors="replace")
        handlers = set(HANDLER_RE.findall(text))
        mutating = handlers & MUTATING
        if not mutating:
            continue
        scanned += 1
        has_auth = any(m in text for m in AUTH_MARKERS)
        if not has_auth and not is_allowlisted(route):
            flagged.append((route, sorted(mutating)))

    print(f"Routes mutatrices analysées : {scanned}")
    print(f"Routes signalées (aucun garde détecté) : {len(flagged)}\n")
    for route, verbs in flagged:
        rel = route.relative_to(Path.cwd()) if route.is_absolute() else route
        print(f"  [WARN] {rel}  ->  {', '.join(verbs)}")

    if not flagged:
        print("OK : aucun endpoint mutateur sans contrôle d'accès détecté.")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
