# Génération du PDF du Mémoire FEDE

Ce document explique comment générer le PDF professionnel du mémoire FEDE d'Imène.

## Prérequis

### 1. Python 3.7+

Vérifiez que Python est installé :

```bash
python3 --version
```

### 2. Dépendances Python

Le script utilise **WeasyPrint**, une bibliothèque Python moderne pour générer des PDFs. Aucune installation système supplémentaire n'est requise.

**Installation avec environnement virtuel (recommandé) :**

```bash
# Créer un environnement virtuel
python3 -m venv venv

# Activer l'environnement virtuel
source venv/bin/activate  # Sur macOS/Linux
# ou
venv\Scripts\activate  # Sur Windows

# Installer les dépendances
pip install -r requirements.txt
```

## Génération du PDF

### Méthode rapide

Exécutez simplement le script :

```bash
python3 generate_pdf.py
```

Le PDF sera généré dans le même répertoire sous le nom `MEMOIRE_FEDE_IMENE_TORNADE.pdf`.

### Résultat attendu

Le script génère un PDF professionnel avec :

- ✅ **Page de couverture** avec titre, informations de l'auteure et date
- ✅ **En-tête** sur chaque page (sauf page de couverture) : "Mémoire Professionnel FEDE - Imène - Tornade.io"
- ✅ **Pied de page** avec numérotation : "Page X sur Y"
- ✅ **Table des matières** automatique avec liens cliquables
- ✅ **Mise en forme professionnelle** :
  - Marges de 2,5 cm (gauche, droite, haut) et 3 cm (bas)
  - Interligne 1,5
  - Police Georgia 12pt pour le corps du texte
  - Titres hiérarchisés et colorés
  - Tableaux formatés
  - Blocs de code avec coloration syntaxique
  - Sauts de page automatiques avant chaque partie principale

### Structure du PDF généré

```
┌────────────────────────────────────────────┐
│  Page de couverture                        │
│  - Titre du mémoire                        │
│  - Problématique                           │
│  - Informations de l'auteure               │
├────────────────────────────────────────────┤
│  Table des matières (automatique)          │
├────────────────────────────────────────────┤
│  Introduction générale                      │
│  Partie 1 : Contexte et problématique      │
│  Partie 2 : Méthodologie et réalisation    │
│  Partie 3 : Analyse critique et apports    │
│  Conclusion générale                        │
│  Bibliographie                              │
│  Annexes                                    │
└────────────────────────────────────────────┘

Chaque page (sauf couverture) contient :
┌────────────────────────────────────────────┐
│ En-tête: Mémoire Professionnel FEDE...     │
├────────────────────────────────────────────┤
│                                            │
│    Contenu de la page                      │
│                                            │
├────────────────────────────────────────────┤
│ Pied de page: Page X sur Y                │
└────────────────────────────────────────────┘
```

## Personnalisation

### Modifier le style CSS

Le fichier `generate_pdf.py` contient une fonction `add_header_footer_css()` que vous pouvez modifier pour ajuster :

- Les couleurs (actuellement bleu #0066cc pour les titres)
- Les polices
- Les espacements
- Les tailles de police
- Les marges

### Modifier l'en-tête ou le pied de page

Dans la fonction `generate_pdf()`, modifiez les options :

```python
options = {
    # ...
    'footer-center': 'Votre texte de pied de page [page]/[topage]',
    'header-center': 'Votre texte d\'en-tête',
    # ...
}
```

### Modifier la page de couverture

La fonction `create_cover_page()` génère la page de couverture. Modifiez-la selon vos besoins.

## Dépannage

### Erreur : wkhtmltopdf not found

**Solution :** Installez wkhtmltopdf (voir section Prérequis ci-dessus).

### Erreur : No module named 'markdown'

**Solution :** Installez les dépendances Python :
```bash
pip3 install -r requirements.txt
```

### Le PDF n'affiche pas correctement les caractères spéciaux

**Solution :** Assurez-vous que le fichier Markdown est encodé en UTF-8.

### Les tableaux ne s'affichent pas correctement

**Solution :** Vérifiez que les tableaux dans le Markdown utilisent la syntaxe correcte avec `|` et `---`.

### Les images ne s'affichent pas

**Solution :** Utilisez des chemins absolus pour les images ou placez-les dans le même répertoire que le script.

## Format du Markdown source

Le fichier `MEMOIRE_FEDE_IMENE_TORNADE.md` doit respecter la syntaxe Markdown standard :

- `#` pour les titres de niveau 1 (Parties)
- `##` pour les titres de niveau 2 (Sections)
- `###` pour les titres de niveau 3 (Sous-sections)
- Tables Markdown standard
- Blocs de code avec \`\`\`language

## Informations techniques

- **Format de sortie :** PDF/A4
- **Résolution :** 300 DPI
- **Encodage :** UTF-8
- **Taille estimée :** 800-1200 Ko pour un mémoire de 40-50 pages

## Support

Pour toute question ou problème, consultez la documentation :

- wkhtmltopdf : https://wkhtmltopdf.org/
- pdfkit : https://pypi.org/project/pdfkit/
- Python Markdown : https://python-markdown.github.io/

---

**Auteure :** Imène  
**Date :** 2024-2025  
**Entreprise :** Tornade.io
