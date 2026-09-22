type Props = {
  starCount?: number;
  cometIntervalMs?: number;
};

/**
 * Fond étoilé CSS-only. Visible uniquement sur le thème moonskin
 * (`html.moonskin`). Pas de JS au premier affichage.
 */
export function CosmicBackground(_props: Props) {
  return (
    <div className="cb-root cb-fixed" aria-hidden="true">
      <div className="cb-nebula" />
      <div className="cb-star-layer cb-star-layer--1" />
      <div className="cb-star-layer cb-star-layer--2" />
      <div className="cb-star-layer cb-star-layer--3" />
      <div className="cb-comets" aria-hidden="true">
        <div className="cb-comet-fixed cb-comet-fixed--1" />
        <div className="cb-comet-fixed cb-comet-fixed--2" />
        <div className="cb-comet-fixed cb-comet-fixed--3" />
      </div>
      <div className="cb-debris cb-debris--1" />
      <div className="cb-debris cb-debris--2" />
      <div className="cb-debris cb-debris--3" />
      <div className="cb-vignette" />
    </div>
  );
}
