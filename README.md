Le but de cet exercice, récupéré le projet : 

- Ensuite , déjà le lancer en local pour le comprendre (installer node + npm install + npm run dev) - OPTIONNEL (mais juste pour comprendre)

- Vous allez créer directement un docker-compose-dev pour simuler un nouveau arrivant dans le projet, on doit lui setup une base de données postgresql par défaut et une interface utilisateur pour acceder a sa base de données (adminer) , vous allez devoir binder les ports 5432 avec le port 5432 de votre pc

- Créer un .env en copiant le env.example et mettez à jour DATABASE_URL avec l'url de votre base de données postgre

Exemple : DATABASE_URL="postgresql://**user**:**password**@localhost:5432/**votre_nom_de_base_de_données_préciser_dans_le_compose**?schema=public"

(NE VOUS PRENEZ PAS LA TÊTE ET PRENEZ CET URL : postgresql://neondb_owner:npg_i1GKbVskPh5L@ep-flat-silence-bacacn0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require)

Ce qui est en gras est à modifier en fonction de ce que vous avez mis vous même dans votre docker compose (dev)

en suite fais la commande en local : npx prisma generate && npx prisma migrate deploy

- En suite , Préparer un dockerfile pour notre application = le dockerfile doit créer une image "moonskin" , le container doit tourner (attention je ne vous partage pas les variables d'environnements donc forcément , vous ne pourrez pas contre pas créer des de données)
- ATTENTION : dans le dockerfile vous allez donc devoir , vous baser sur une image node, préparer la copie du package.json , préparer l'installation des dépendances et lancer aussi npx prisma generate OBLIGATOIREMENT avant de lancer la build (pnpm run build) et en suite de lancer le node server.js générer

- En suite une fois le dockerfile créer, vous devez créer un docker compose qui sera ""l'orchestrateur"" de ce dockerfile, c'est LUI que vous allez lancer avec docker compose up pour démarrer la build au besoin et lancer votre container "moonskin_app"

- (Pas besoin de lancer le seed.tsx même si ça pourrait être cool)
