"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CodeBracketIcon,
  KeyIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

const endpoints = [
  {
    category: "Authentification",
    color: "text-blue-600",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/steam",
        description: "Authentification via Steam OpenID",
        auth: false,
        rateLimit: "10/min",
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        description: "Déconnexion utilisateur",
        auth: true,
        rateLimit: "5/min",
      },
    ]
  },
  {
    category: "Utilisateur",
    color: "text-green-600",
    endpoints: [
      {
        method: "GET",
        path: "/api/user/profile",
        description: "Récupérer le profil utilisateur",
        auth: true,
        rateLimit: "60/min",
      },
      {
        method: "PUT",
        path: "/api/user/profile",
        description: "Mettre à jour le profil",
        auth: true,
        rateLimit: "10/min",
      },
      {
        method: "GET",
        path: "/api/user/trades",
        description: "Historique des trades",
        auth: true,
        rateLimit: "30/min",
      },
    ]
  },
  {
    category: "Trading",
    color: "text-orange-600",
    endpoints: [
      {
        method: "POST",
        path: "/api/steam/estimate-prices",
        description: "Estimation des prix de skins",
        auth: true,
        rateLimit: "20/min",
      },
      {
        method: "POST",
        path: "/api/steam/create-trade",
        description: "Créer un trade de vente",
        auth: true,
        rateLimit: "5/min",
      },
      {
        method: "GET",
        path: "/api/steam/inventory",
        description: "Inventaire Steam utilisateur",
        auth: true,
        rateLimit: "10/min",
      },
    ]
  },
  {
    category: "Skinplace",
    color: "text-purple-600",
    endpoints: [
      {
        method: "GET",
        path: "/api/skinplace/items",
        description: "Liste des items disponibles",
        auth: true,
        rateLimit: "30/min",
      },
      {
        method: "GET",
        path: "/api/skinplace/balance",
        description: "Solde Skinplace",
        auth: true,
        rateLimit: "10/min",
      },
      {
        method: "POST",
        path: "/api/skinplace/purchase",
        description: "Acheter des items",
        auth: true,
        rateLimit: "5/min",
      },
    ]
  },
];

const sdkExamples = {
  javascript: `// Installation
npm install @cashtrade/sdk

// Utilisation
import CashTrade from '@cashtrade/sdk';

const client = new CashTrade({
  apiKey: 'your_api_key',
  environment: 'production' // ou 'sandbox'
});

// Estimation de prix
const estimate = await client.estimatePrices([
  { market_hash_name: 'AK-47 | Redline (Field-Tested)' }
]);

// Créer un trade
const trade = await client.createTrade({
  items: estimate.items,
  tradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=...'
});`,

  python: `# Installation
pip install cashtrade-sdk

# Utilisation
from cashtrade import CashTrade

client = CashTrade(
    api_key='your_api_key',
    environment='production'  # ou 'sandbox'
)

# Estimation de prix
estimate = client.estimate_prices([
    {'market_hash_name': 'AK-47 | Redline (Field-Tested)'}
])

# Créer un trade
trade = client.create_trade({
    'items': estimate['items'],
    'trade_link': 'https://steamcommunity.com/tradeoffer/new/?partner=...'
})`,

  curl: `# Authentification
curl -X POST https://api.cashtrade.gg/auth/steam \\
  -H "Content-Type: application/json" \\
  -d '{"return_url": "https://yourapp.com/callback"}'

# Estimation de prix
curl -X POST https://api.cashtrade.gg/steam/estimate-prices \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      {"market_hash_name": "AK-47 | Redline (Field-Tested)"}
    ]
  }'

# Créer un trade
curl -X POST https://api.cashtrade.gg/steam/create-trade \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [...],
    "trade_link": "https://steamcommunity.com/tradeoffer/new/?partner=..."
  }'`
};

const responseExamples = {
  estimate: `{
  "success": true,
  "data": {
    "items": [
      {
        "market_hash_name": "AK-47 | Redline (Field-Tested)",
        "price_cents": 1250,
        "price_eur": "12.50",
        "confidence": 0.95,
        "last_updated": "2024-09-21T10:30:00Z"
      }
    ],
    "total_cents": 1250,
    "total_eur": "12.50",
    "fees": {
      "cashout_cents": 6,
      "network_cents": 200
    },
    "net_cents": 1044,
    "net_eur": "10.44"
  }
}`,

  trade: `{
  "success": true,
  "data": {
    "trade_id": "trade_01HF7XQZM8N5P2R4S6T8V0W2X4",
    "status": "created",
    "items": [...],
    "total_cents": 1250,
    "net_cents": 1044,
    "trade_url": "https://steamcommunity.com/tradeoffer/new/?tradeofferid=...",
    "expires_at": "2024-09-21T11:30:00Z",
    "created_at": "2024-09-21T10:30:00Z"
  }
}`,

  error: `{
  "success": false,
  "error": {
    "code": "INVALID_TRADE_LINK",
    "message": "Le Trade Link fourni n&apos;est pas valide",
    "details": {
      "field": "trade_link",
      "expected_format": "https://steamcommunity.com/tradeoffer/new/?partner=..."
    }
  }
}`
};

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <CodeBracketIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Documentation API
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Intégrez CashTrade dans vos applications avec notre API REST sécurisée
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Version 1.0
            </Badge>
            <Badge variant="outline">
              Base URL: https://api.cashtrade.gg
            </Badge>
          </div>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span>Démarrage rapide</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <KeyIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Obtenir une clé API</h3>
                  <p className="text-sm text-muted-foreground">Créez un compte développeur et générez votre clé API</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CodeBracketIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Faire un appel</h3>
                  <p className="text-sm text-muted-foreground">Utilisez votre clé pour authentifier vos requêtes</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CubeIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Intégrer</h3>
                  <p className="text-sm text-muted-foreground">Utilisez nos SDKs ou appelez directement l&apos;API REST</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Authentification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    L&apos;API CashTrade utilise des tokens Bearer pour l&apos;authentification. Incluez votre token dans l&apos;en-tête Authorization de chaque requête.
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <code className="text-sm">
                      Authorization: Bearer YOUR_API_TOKEN
                    </code>
                  </div>
                  <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Important</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Ne partagez jamais votre clé API et utilisez HTTPS pour toutes les requêtes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Endpoints */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Endpoints disponibles</h2>
              <div className="space-y-6">
                {endpoints.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className={`${category.color}`}>{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.endpoints.map((endpoint, endpointIndex) => (
                          <div key={endpointIndex} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge 
                                variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                                className={`${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 
                                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-orange-100 text-orange-800'} font-mono text-xs`}
                              >
                                {endpoint.method}
                              </Badge>
                              <div>
                                <code className="text-sm font-mono">{endpoint.path}</code>
                                <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {endpoint.auth && <ShieldCheckIcon className="w-4 h-4" />}
                              <span>{endpoint.rateLimit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Code Examples */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Exemples de code</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="javascript" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="javascript" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{sdkExamples.javascript}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{sdkExamples.python}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="curl" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{sdkExamples.curl}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Response Examples */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Exemples de réponses</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="estimate" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="estimate">Estimation</TabsTrigger>
                      <TabsTrigger value="trade">Trade</TabsTrigger>
                      <TabsTrigger value="error">Erreur</TabsTrigger>
                    </TabsList>
                    <TabsContent value="estimate" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{responseExamples.estimate}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="trade" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{responseExamples.trade}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="error" className="mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{responseExamples.error}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate Limits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5" />
                    <span>Limites de taux</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Par défaut</span>
                      <Badge variant="outline">100/min</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Authentification</span>
                      <Badge variant="outline">10/min</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Trading</span>
                      <Badge variant="outline">20/min</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimation</span>
                      <Badge variant="outline">30/min</Badge>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Les limites sont par clé API et se réinitialisent chaque minute.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Codes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Codes de statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span>200</span>
                      <span className="text-green-600">Succès</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>400</span>
                      <span className="text-red-600">Requête invalide</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>401</span>
                      <span className="text-red-600">Non autorisé</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>429</span>
                      <span className="text-orange-600">Trop de requêtes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>500</span>
                      <span className="text-red-600">Erreur serveur</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SDKs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>SDKs officiels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <span className="mr-2">📦</span>
                      JavaScript/TypeScript
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <span className="mr-2">🐍</span>
                      Python
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <span className="mr-2">🦀</span>
                      Rust
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <span className="mr-2">🐹</span>
                      Go
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Besoin d&apos;aide ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Notre équipe technique est là pour vous accompagner.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      📧 api-support@cashtrade.gg
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      💬 Discord développeurs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}