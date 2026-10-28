Le but de cet exercice, récupéré le projet : 

- Ensuite , déjà le lancer en local pour le comprendre (installer node + npm install + npm run dev) - OPTIONNEL (mais juste pour comprendre)

- En suite , Préparer un dockerfile pour notre application = le dockerfile doit créer une image "moonskin" , le container doit tourner (attention je ne vous partage pas les variables d'environnements donc forcément , vous ne pourrez pas contre pas créer des de données)

- En suite une fois le dockerfile créer, vous devez créer un docker compose qui sera ""l'orchestrateur"" de ce dockerfile, c'est LUI que vous allez lancer avec docker compose up pour démarrer la build au besoin et lancer votre container "moonskin_app"

- Une fois ce dockerfile créer vous allez créer directement un docker-compose-dev pour simuler un nouveau arrivant dans le projet, on doit lui setup une base de données postgresql par défaut et une interface utilisateur pour acceder a sa base de données

- (Pas besoin de lancer le seed.tsx même si ça pourrait être cool)
