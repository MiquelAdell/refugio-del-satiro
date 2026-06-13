import poweredByBggSvg from "../assets/powered-by-bgg-rgb.svg";
import "./PoweredByBgg.css";

export function PoweredByBgg() {
  return (
    <div className="powered-by-bgg">
      <a
        href="https://boardgamegeek.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Con datos de BoardGameGeek"
      >
        <img
          src={poweredByBggSvg}
          alt="Con datos de BoardGameGeek"
          width={200}
        />
      </a>
    </div>
  );
}
