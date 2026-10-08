type Props = {
  starCount?: number;
};

/**
 * Fond étoilé CSS-only. Visible uniquement sur le thème moonskin
 * (`html.moonskin`). Pas de JS au premier affichage.
 *
 * Une seule couche d’étoiles statique, débris figés.
 * Pas de filter/blur (coûteux, surtout dans Brave).
 */
export function CosmicBackground(_props: Props) {
  return (
    <div className="cb-root cb-fixed" aria-hidden="true">
      <div className="cb-stars" />
      <div className="cb-debris cb-debris--1" />
      <div className="cb-debris cb-debris--2" />
      <div className="cb-vignette" />
    </div>
  );
}
