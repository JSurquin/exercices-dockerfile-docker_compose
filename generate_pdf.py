#!/usr/bin/env python3
"""
Script de génération de PDF pour le mémoire FEDE d'Imène
Génère un PDF professionnel avec en-tête, pied de page et table des matières
Utilise WeasyPrint (alternative moderne à wkhtmltopdf)
"""

import markdown
from weasyprint import HTML, CSS
from datetime import datetime
import os


def add_header_footer_css():
    """Retourne le CSS pour l'en-tête, le pied de page et le style général"""
    return """
    @page {
        size: A4;
        margin: 3cm 2.5cm 3cm 2.5cm;
        
        @top-center {
            content: "Mémoire Professionnel FEDE - Imène - Tornade.io";
            font-size: 9pt;
            font-family: Arial, sans-serif;
            color: #666;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        @bottom-center {
            content: "Page " counter(page);
            font-size: 9pt;
            font-family: Arial, sans-serif;
            color: #666;
        }
    }
    
    /* Page de couverture sans en-tête ni pied de page */
    @page :first {
        @top-center { content: none; }
        @bottom-center { content: none; }
    }
    
    body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #333;
        text-align: justify;
    }
    
    h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #1a1a1a;
        margin-top: 40px;
        margin-bottom: 20px;
        page-break-before: always;
        border-bottom: 2px solid #0066cc;
        padding-bottom: 10px;
        page-break-after: avoid;
    }
    
    h1:first-of-type {
        page-break-before: avoid;
    }
    
    h2 {
        font-size: 18pt;
        font-weight: bold;
        color: #0066cc;
        margin-top: 30px;
        margin-bottom: 15px;
        page-break-after: avoid;
    }
    
    h3 {
        font-size: 14pt;
        font-weight: bold;
        color: #333;
        margin-top: 20px;
        margin-bottom: 10px;
        page-break-after: avoid;
    }
    
    h4 {
        font-size: 12pt;
        font-weight: bold;
        color: #555;
        margin-top: 15px;
        margin-bottom: 10px;
        page-break-after: avoid;
    }
    
    p {
        margin-bottom: 10px;
        text-indent: 0;
        orphans: 3;
        widows: 3;
    }
    
    ul, ol {
        margin-bottom: 15px;
        margin-left: 20px;
    }
    
    li {
        margin-bottom: 5px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 11pt;
        page-break-inside: avoid;
    }
    
    th {
        background-color: #0066cc;
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: bold;
    }
    
    td {
        padding: 8px;
        border: 1px solid #ddd;
    }
    
    tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    
    code {
        font-family: 'Courier New', monospace;
        background-color: #f5f5f5;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10pt;
    }
    
    pre {
        background-color: #f5f5f5;
        padding: 15px;
        border-left: 4px solid #0066cc;
        overflow-x: auto;
        margin: 15px 0;
        border-radius: 5px;
        page-break-inside: avoid;
    }
    
    pre code {
        background-color: transparent;
        padding: 0;
    }
    
    blockquote {
        border-left: 4px solid #ccc;
        padding-left: 15px;
        margin: 15px 0;
        font-style: italic;
        color: #666;
    }
    
    hr {
        border: none;
        border-top: 1px solid #ccc;
        margin: 30px 0;
    }
    
    .cover-page {
        text-align: center;
        padding-top: 100px;
        page-break-after: always;
    }
    
    .cover-page h1 {
        font-size: 32pt;
        border: none;
        page-break-before: avoid;
        page-break-after: avoid;
    }
    
    .cover-page .subtitle {
        font-size: 16pt;
        color: #666;
        margin-top: 20px;
        line-height: 1.8;
    }
    
    .cover-page .author-info {
        margin-top: 80px;
        font-size: 14pt;
        line-height: 2;
    }
    
    a {
        color: #0066cc;
        text-decoration: none;
    }
    
    a:hover {
        text-decoration: underline;
    }
    
    /* Éviter les coupures de page malheureuses */
    h1, h2, h3, h4, h5, h6 {
        page-break-inside: avoid;
    }
    
    img {
        max-width: 100%;
        page-break-inside: avoid;
    }
    """


def create_cover_page():
    """Crée la page de couverture"""
    current_date = datetime.now()
    months_fr = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ]
    formatted_date = f"{months_fr[current_date.month-1]} {current_date.year}"
    
    return f"""
    <div class="cover-page">
        <h1>MÉMOIRE PROFESSIONNEL FEDE</h1>
        <div class="subtitle">
            En quoi le "brand-driven development", porté par des profils<br>
            hybrides technique-design, devient-il un levier stratégique<br>
            de différenciation pour concevoir des plateformes digitales performantes ?
        </div>
        <div class="author-info">
            <p><strong>Présenté par :</strong> Imène</p>
            <p><strong>Fonction :</strong> Développeuse Full Stack</p>
            <p><strong>Entreprise d'accueil :</strong> Tornade.io</p>
            <p><strong>Année universitaire :</strong> 2024-2025</p>
            <p><strong>Date :</strong> {formatted_date}</p>
        </div>
    </div>
    """


def convert_markdown_to_html(markdown_file):
    """Convertit le fichier Markdown en HTML avec extensions"""
    with open(markdown_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    # Configuration des extensions markdown
    md = markdown.Markdown(extensions=[
        'extra',
        'codehilite',
        'tables',
        'toc',
        'nl2br',
        'sane_lists'
    ])
    
    # Conversion
    html_content = md.convert(markdown_content)
    
    return html_content


def generate_pdf(markdown_file, output_pdf):
    """
    Génère le PDF à partir du fichier Markdown
    
    Args:
        markdown_file: Chemin vers le fichier .md
        output_pdf: Chemin du fichier PDF de sortie
    """
    print(f"📄 Lecture du fichier Markdown: {markdown_file}")
    
    # Convertir Markdown en HTML
    html_content = convert_markdown_to_html(markdown_file)
    
    print("🎨 Application du style CSS...")
    
    # Ajouter les styles CSS
    css = add_header_footer_css()
    
    # Créer la page de couverture
    cover = create_cover_page()
    
    # Assembler le HTML complet
    full_html = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mémoire Professionnel FEDE - Imène</title>
        <style>
            {css}
        </style>
    </head>
    <body>
        {cover}
        {html_content}
    </body>
    </html>
    """
    
    print("📦 Génération du PDF en cours...")
    
    try:
        # Créer un fichier HTML temporaire
        temp_html = 'temp_memoire.html'
        with open(temp_html, 'w', encoding='utf-8') as f:
            f.write(full_html)
        
        # Générer le PDF avec WeasyPrint
        HTML(temp_html).write_pdf(
            output_pdf,
            stylesheets=[CSS(string=css)]
        )
        
        # Supprimer le fichier temporaire
        if os.path.exists(temp_html):
            os.remove(temp_html)
        
        print(f"✅ PDF généré avec succès: {output_pdf}")
        file_size = os.path.getsize(output_pdf) / (1024 * 1024)  # Taille en Mo
        print(f"📊 Taille du fichier: {file_size:.2f} Mo")
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération du PDF: {e}")
        raise


def main():
    """Fonction principale"""
    print("=" * 60)
    print("🎓 GÉNÉRATEUR DE PDF - MÉMOIRE PROFESSIONNEL FEDE")
    print("=" * 60)
    print()
    
    # Fichiers
    markdown_file = 'MEMOIRE_FEDE_IMENE_TORNADE.md'
    output_pdf = 'MEMOIRE_FEDE_IMENE_TORNADE.pdf'
    
    # Vérifier que le fichier Markdown existe
    if not os.path.exists(markdown_file):
        print(f"❌ Erreur: Le fichier {markdown_file} n'existe pas.")
        return
    
    # Générer le PDF
    try:
        generate_pdf(markdown_file, output_pdf)
        print()
        print("=" * 60)
        print("🎉 Génération terminée avec succès!")
        print(f"📄 Fichier créé: {output_pdf}")
        print("=" * 60)
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ La génération a échoué")
        print("=" * 60)


if __name__ == '__main__':
    main()
