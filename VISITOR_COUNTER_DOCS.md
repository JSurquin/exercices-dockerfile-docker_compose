# Documentation - Compteur de Visiteurs

## 🎯 Description

Système de comptage des visiteurs de la plateforme avec Redis et composant React moderne avec animations CS2.

## 📦 Installation

```bash
pnpm add ioredis
```

## 🔧 Configuration

### 1. Variables d'environnement

Ajouter dans `.env` ou `.env.local` :

```env
REDIS_URL=redis://localhost:6379
```

**Note :** En développement, si Redis n'est pas disponible, un cache en mémoire sera utilisé automatiquement.

### 2. Fichiers créés

- `src/lib/redis.ts` - Configuration Redis avec fallback mémoire
- `src/app/api/stats/visitors/route.ts` - API GET/POST pour le compteur
- `src/app/api/stats/visitors/reset/route.ts` - API POST admin pour reset
- `src/components/stats/visitor-counter.tsx` - Composant React
- `src/components/stats/index.ts` - Export du composant

## 📚 Utilisation du composant

### Variante par défaut (Card complète)

```tsx
import { VisitorCounter } from "~/components/stats";

export default function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <VisitorCounter locale="fr" variant="default" />
    </div>
  );
}
```

### Variante compacte

```tsx
<VisitorCounter locale="en" variant="compact" />
```

### Variante minimale

```tsx
<VisitorCounter locale="fr" variant="minimal" />
```

## 🎨 Variants disponibles

### `default` - Card complète avec animation
- Design soigné avec gradient CS2 (orange/jaune)
- Animation de l'icône Users
- Compteur animé avec CountUp
- Indicateur de mise à jour en temps réel
- Parfait pour dashboard ou page d'accueil

### `compact` - Version inline
- Badge horizontal avec gradient
- Affichage compact du compteur
- Idéal pour header ou sidebar

### `minimal` - Version texte simple
- Simple ligne de texte avec icône Eye
- Ultra-compact
- Pour footer ou info secondaire

## 🌍 Internationalisation

Le composant supporte 2 langues :

```tsx
<VisitorCounter locale="fr" /> // Français (par défaut)
<VisitorCounter locale="en" /> // Anglais
```

## 🔌 API Endpoints

### GET /api/stats/visitors
Récupère le nombre actuel de visiteurs.

**Réponse :**
```json
{
  "success": true,
  "count": 42567
}
```

### POST /api/stats/visitors
Incrémente le compteur de visiteurs (+1).

**Réponse :**
```json
{
  "success": true,
  "count": 42568
}
```

### POST /api/stats/visitors/reset
Réinitialise le compteur (Admin uniquement).

**Headers requis :** Session avec rôle ADMIN

**Réponse :**
```json
{
  "success": true,
  "message": "Visitor counter reset successfully"
}
```

## ⚙️ Fonctionnement du useEffect

Le composant utilise un **useEffect propre** avec plusieurs mécanismes :

### 1. Premier montage (incrément)
```tsx
useEffect(() => {
  let isMounted = true;
  const hasIncremented = useRef(false);

  // Incrémente uniquement au premier montage
  if (!hasIncremented.current) {
    await fetch("/api/stats/visitors", { method: "POST" });
    hasIncremented.current = true;
  }

  // Cleanup pour éviter les fuites mémoire
  return () => {
    isMounted = false;
  };
}, []); // Dépendances vides = exécution unique
```

### 2. Polling automatique (30s)
```tsx
useEffect(() => {
  const intervalId = setInterval(async () => {
    // Récupère la valeur à jour toutes les 30 secondes
    const data = await fetch("/api/stats/visitors");
    setVisitorCount(data.count);
  }, 30000);

  return () => clearInterval(intervalId); // Nettoyage de l'interval
}, []);
```

## 🎨 Personnalisation

### Changer les couleurs

Le composant utilise les couleurs CS2 par défaut (orange/jaune), mais vous pouvez modifier :

```tsx
// Dans visitor-counter.tsx
className="bg-gradient-to-r from-blue-500/10 to-purple-500/10"
```

### Changer la fréquence de polling

```tsx
// Dans visitor-counter.tsx
}, 60000); // 60 secondes au lieu de 30
```

### Désactiver le polling

Commentez simplement le second useEffect dans le composant.

## 🚀 Redis en Production

### Option 1 : Redis Cloud (Upstash)

```env
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
```

### Option 2 : Redis local Docker

```bash
docker run -d -p 6379:6379 redis:alpine
```

### Option 3 : Railway / Render

Ces plateformes proposent Redis managé directement.

## 📊 Monitoring

Pour voir le compteur en temps réel :

```bash
# Avec redis-cli
redis-cli GET platform:visitors:total

# Avec Docker
docker exec -it <container-id> redis-cli GET platform:visitors:total
```

## 🔒 Sécurité

- **Rate limiting** : Ajouter un rate limit sur l'API POST pour éviter les abus
- **IP tracking** : Optionnel - stocker l'IP pour éviter les multi-comptages
- **Admin route** : Le reset nécessite authentification ADMIN

## 🎯 Exemples d'intégration

### Dans la page d'accueil

```tsx
// src/app/page.tsx
import { VisitorCounter } from "~/components/stats";

export default function HomePage() {
  return (
    <main>
      {/* Hero section */}
      <section className="container mx-auto py-20">
        <h1>Bienvenue sur CashTrade</h1>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <VisitorCounter locale="fr" variant="default" />
          {/* Autres stats... */}
        </div>
      </section>
    </main>
  );
}
```

### Dans le header (compact)

```tsx
// src/components/layout/header.tsx
import { VisitorCounter } from "~/components/stats";

export function Header() {
  return (
    <header>
      <nav className="flex items-center justify-between">
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

### Dans le footer (minimal)

```tsx
// src/components/layout/footer.tsx
import { VisitorCounter } from "~/components/stats";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex justify-between">
        <div>© 2025 CashTrade</div>
        <VisitorCounter locale="fr" variant="minimal" />
      </div>
    </footer>
  );
}
```

## 🧪 Tests

Pour tester le composant :

1. Vérifier que Redis fonctionne ou que le fallback mémoire est actif
2. Ouvrir la page avec le composant
3. Le compteur devrait s'incrémenter de +1
4. Rafraîchir la page → +1 de plus
5. Vérifier la mise à jour automatique après 30s

## 🐛 Troubleshooting

### Le compteur ne s'affiche pas
- Vérifier que Redis est bien démarré ou que le fallback mémoire fonctionne
- Vérifier les logs dans la console du navigateur et du serveur

### Le compteur ne s'incrémente pas
- Vérifier que l'API POST `/api/stats/visitors` répond correctement
- Vérifier les droits d'écriture sur Redis

### Redis connection error en dev
- C'est normal ! Le système bascule automatiquement sur le cache mémoire
- Pour désactiver les warnings : utiliser une connexion Redis locale

## 📝 Todo / Améliorations futures

- [ ] Ajouter un rate limit sur l'API POST
- [ ] Tracker les visiteurs uniques par IP/session
- [ ] Dashboard admin avec graphiques de visites
- [ ] Export des statistiques en CSV
- [ ] Visiteurs par page (pas seulement global)
- [ ] Intégration avec système d'analytics existant

## 🔗 Liens utiles

- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands](https://redis.io/commands/)
- [Framer Motion Animations](https://www.framer.com/motion/)
- [CountUp.js](https://github.com/glennreyes/react-countup)








