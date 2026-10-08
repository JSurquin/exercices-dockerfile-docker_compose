-- Stats du bandeau Trustpilot in-app, par déclencheur.
-- affichages = reviewPromptSeenAt renseigné
-- clics      = reviewPromptAction = 'clicked'
-- taux       = clics / affichages
--
-- Usage :
--   pnpm exec prisma db execute --file scripts/review-prompt-stats.sql --schema prisma/schema.prisma

SELECT
  COALESCE("reviewPromptTrigger", '(inconnu)') AS trigger,
  COUNT(*) FILTER (WHERE "reviewPromptSeenAt" IS NOT NULL) AS affichages,
  COUNT(*) FILTER (WHERE "reviewPromptAction" = 'clicked') AS clics,
  COUNT(*) FILTER (WHERE "reviewPromptAction" = 'dismissed') AS fermetures,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "reviewPromptAction" = 'clicked')
      / NULLIF(COUNT(*) FILTER (WHERE "reviewPromptSeenAt" IS NOT NULL), 0),
    2
  ) AS taux_clic_pct
FROM "user"
WHERE "reviewPromptSeenAt" IS NOT NULL
GROUP BY "reviewPromptTrigger"
ORDER BY trigger;
