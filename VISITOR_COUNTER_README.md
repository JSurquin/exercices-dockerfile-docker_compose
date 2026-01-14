# 🎯 Compteur de Visiteurs - Guide Rapide

## ✅ Installation terminée !

Le système de compteur de visiteurs a été créé avec succès. Voici un guide rapide pour l'utiliser.

## 📦 Ce qui a été créé

### Fichiers principaux

1. **`src/lib/redis.ts`**
   - Configuration Redis avec fallback mémoire automatique
   - Fonctions: `cacheGet`, `cacheSet`, `cacheIncr`, `cacheDel`
   - Compatible production et développement

2. **`src/app/api/stats/visitors/route.ts`**
   - GET: Récupère le nombre de visiteurs
   - POST: Incrémente le compteur

3. **`src/app/api/stats/visitors/reset/route.ts`**
   - POST: Reset le compteur (Admin uniquement)

4. **`src/components/stats/visitor-counter.tsx`**
   - Composant React avec 3 variantes
   - useEffect propre (pas de double fetch)
   - Auto-refresh toutes les 30s
   - Animations Framer Motion
   - Support FR/EN

5. **`src/components/stats/index.ts`**
   - Export du composant

### Fichiers de documentation

- `VISITOR_COUNTER_DOCS.md` - Documentation complète
- `EXAMPLE_VISITOR_COUNTER.tsx` - Exemples d'utilisation
- `VISITOR_COUNTER_README.md` - Ce fichier

## 🚀 Démarrage rapide

### 1. Installer Redis (optionnel en dev)

**Avec Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Ou utiliser le fallback mémoire** (automatique si Redis n'est pas disponible)

### 2. Configuration

Ajouter dans `.env` ou `.env.local`:
```env
REDIS_URL=redis://localhost:6379
```

### 3. Utilisation basique

```tsx
import { VisitorCounter } from "@/components/stats";

export default function HomePage() {
  return (
    <div>
      <h1>Bienvenue sur MoonSkin</h1>
      <VisitorCounter locale="fr" variant="default" />
    </div>
  );
}
```

## 🎨 Les 3 variantes

### Default - Card complète
```tsx
<VisitorCounter locale="fr" variant="default" />
```
- Design soigné avec gradient CS2
- Animations
- Compteur animé avec CountUp
- Indicateur de mise à jour temps réel
- **Idéal pour:** Dashboard, page d'accueil

### Compact - Badge inline
```tsx
<VisitorCounter locale="fr" variant="compact" />
```
- Badge horizontal avec gradient
- Affichage compact
- **Idéal pour:** Header, barre latérale

### Minimal - Texte simple
```tsx
<VisitorCounter locale="fr" variant="minimal" />
```
- Simple ligne de texte avec icône
- Ultra-compact
- **Idéal pour:** Footer, infos secondaires

## 🌍 Internationalisation

```tsx
// Français (par défaut)
<VisitorCounter locale="fr" />

// Anglais
<VisitorCounter locale="en" />
```

## 🔧 Configuration avancée

### Changer la fréquence de polling

Dans `visitor-counter.tsx`, ligne ~156:
```tsx
}, 30000); // Changer à 60000 pour 1 minute
```

### Désactiver le polling

Commenter le second `useEffect` dans le composant.

### Personnaliser les couleurs

Modifier les classes Tailwind dans le composant:
```tsx
className="bg-linear-to-r from-blue-500/10 to-purple-500/10"
```

## 🎯 Exemples d'intégration

### Dans la page d'accueil

```tsx
// src/app/page.tsx
import { VisitorCounter } from "@/components/stats";
import { HeroSection } from "@/components/home/hero-section";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Section Stats */}
      <section className="container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <VisitorCounter locale="fr" variant="default" />
          {/* Autres stats... */}
        </div>
      </section>
    </div>
  );
}
```

### Dans le Header

```tsx
// src/components/layout/header.tsx
import { VisitorCounter } from "@/components/stats";

export function Header() {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center justify-between py-4">
        <Logo />
        <div className="flex items-center gap-4">
          <VisitorCounter locale="fr" variant="compact" />
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
```

### Dans le Footer

```tsx
// src/components/layout/footer.tsx
import { VisitorCounter } from "@/components/stats";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex justify-between items-center">
        <div>© 2025 MoonSkin</div>
        <VisitorCounter locale="fr" variant="minimal" />
      </div>
    </footer>
  );
}
```

## 📊 API Endpoints

### GET /api/stats/visitors
Récupère le compteur actuel.

**Exemple:**
```bash
curl http://localhost:3000/api/stats/visitors
```

**Réponse:**
```json
{
  "success": true,
  "count": 42567
}
```

### POST /api/stats/visitors
Incrémente le compteur.

**Exemple:**
```bash
curl -X POST http://localhost:3000/api/stats/visitors
```

**Réponse:**
```json
{
  "success": true,
  "count": 42568
}
```

### POST /api/stats/visitors/reset
Reset le compteur (Admin uniquement).

**Exemple:**
```bash
curl -X POST http://localhost:3000/api/stats/visitors/reset \
  -H "Cookie: session=your-admin-session"
```

## 🔒 Sécurité

Le composant utilise un `useRef` pour éviter les doubles incréments :

```tsx
const hasIncremented = useRef(false);

// Incrémente UNIQUEMENT au premier montage
if (!hasIncremented.current) {
  await fetch("/api/stats/visitors", { method: "POST" });
  hasIncremented.current = true;
}
```

### Cleanup propre

```tsx
useEffect(() => {
  let isMounted = true;
  
  // ... code ...
  
  return () => {
    isMounted = false; // Évite les setState sur composant démonté
  };
}, []);
```

## 🐛 Troubleshooting

### Le compteur ne s'affiche pas

1. Vérifier que le composant est bien importé
2. Vérifier les logs de la console navigateur
3. Vérifier que l'API répond : `curl http://localhost:3000/api/stats/visitors`

### "Redis connection error"

C'est normal en développement ! Le système bascule automatiquement sur le cache mémoire.

Pour désactiver les warnings :
- Démarrer Redis localement
- Ou ignorer les logs (le fallback fonctionne bien)

### Le compteur ne s'incrémente pas

1. Vérifier que l'API POST fonctionne
2. Vérifier le réseau dans DevTools
3. Rafraîchir la page pour un nouvel incrément

### Le compteur se réinitialise souvent

C'est normal avec le cache mémoire (mode dev sans Redis). En production avec Redis, les données sont persistantes.

## 📈 En production

### Redis recommandé

- **Upstash**: Redis cloud gratuit
- **Railway**: Redis managé
- **Render**: Redis add-on
- **AWS ElastiCache**: Pour grande échelle

Exemple Upstash:
```env
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
```

### Monitoring

Avec redis-cli:
```bash
redis-cli GET platform:visitors:total
# > "42567"
```

## 🎨 Personnalisation

Le composant est entièrement personnalisable via les props et le code source.

**Props disponibles:**
- `locale`: `"fr"` | `"en"` (défaut: `"fr"`)
- `variant`: `"default"` | `"compact"` | `"minimal"` (défaut: `"default"`)

**Modification des couleurs:**
Le thème CS2 utilise orange/jaune, mais vous pouvez changer :
```tsx
// De
from-orange-500 to-yellow-500

// À
from-blue-500 to-purple-500
```

## 📝 Prochaines étapes recommandées

1. **Intégrer le composant** dans votre page d'accueil
2. **Tester** avec et sans Redis
3. **Personnaliser** les couleurs selon votre charte
4. **Ajouter** un rate limiting sur l'API POST (optionnel)
5. **Déployer** avec Redis en production

## 🔗 Fichiers à consulter

- Documentation complète : `VISITOR_COUNTER_DOCS.md`
- Exemples d'utilisation : `EXAMPLE_VISITOR_COUNTER.tsx`
- Code source : `src/components/stats/visitor-counter.tsx`
- API : `src/app/api/stats/visitors/route.ts`
- Redis config : `src/lib/redis.ts`

## ✨ Fonctionnalités

- ✅ useEffect propre (pas de double fetch)
- ✅ Cleanup automatique (pas de fuites mémoire)
- ✅ Fallback mémoire si Redis indisponible
- ✅ 3 variantes de design
- ✅ Animations Framer Motion
- ✅ CountUp animé
- ✅ Auto-refresh 30s
- ✅ Support FR/EN
- ✅ TypeScript strict
- ✅ Zero linter errors
- ✅ Theme-aware (dark/light)
- ✅ Responsive
- ✅ API REST documentée
- ✅ Route admin pour reset

---

**Créé avec ❤️ pour MoonSkin - Projet CS2 Skin Trading**








