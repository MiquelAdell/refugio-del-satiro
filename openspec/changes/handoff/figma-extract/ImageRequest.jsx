// figma node: 156:32313 Image Request (12 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "game=" + __venc(p.game) + '|' + "size=" + __venc(p.size);

export function ImageRequest(_p = {}) {
  const props = { ..._p, game: _p.game ?? "carcassonne 1", size: _p.size ?? "complete" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 267.586,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-ab471bcab293fa30" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 267.586,
      }} />
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-ab471bcab293fa30-fcb5873f" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 271.355,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-b92f1200af58c92e" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 271.355,
      }} />
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-b92f1200af58c92e-0e448502" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 286.667,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-fffab501b56543bd" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 286.667,
      }} />
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-fffab501b56543bd-e1984f8d" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __body6 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 281.678,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-278e56a3c0173d25" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 281.678,
      }} />
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-278e56a3c0173d25-71225768" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __body8 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 287.334,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-a36e8c35c01eca1e" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 287.334,
      }} />
    </div>
  );
  const __body9 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-a36e8c35c01eca1e-efae61c0" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __body10 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 308.951,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-838fdfa2bd6328f8" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 308.951,
      }} />
    </div>
  );
  const __body11 = () => (
    <div className={props.className} style={{
      width: 200,
      height: 200,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-838fdfa2bd6328f8-6215098b" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }} />
    </div>
  );
  const __impls = {
    // figma: Game=Carcassone 5, Size=Complete
    "game=carcassone 5|size=complete": __body0,
    // figma: Game=Carcassone 5, Size=Square
    "game=carcassone 5|size=square": __body1,
    // figma: Game=Carcassonne 3, Size=Complete
    "game=carcassonne 3|size=complete": __body2,
    // figma: Game=Carcassonne 3, Size=Square
    "game=carcassonne 3|size=square": __body3,
    // figma: Game=Carcassonne 4, Size=Complete
    "game=carcassonne 4|size=complete": __body4,
    // figma: Game=Carcassonne 4, Size=Square
    "game=carcassonne 4|size=square": __body5,
    // figma: Game=Carcassonne 1, Size=Complete
    "game=carcassonne 1|size=complete": __body6,
    // figma: Game=Carcassonne 1, Size=Square
    "game=carcassonne 1|size=square": __body7,
    // figma: Game=Carcassonne 2, Size=Complete
    "game=carcassonne 2|size=complete": __body8,
    // figma: Game=Carcassonne 2, Size=Square
    "game=carcassonne 2|size=square": __body9,
    // figma: Game=Fantasy World, Size=Complete
    "game=fantasy world|size=complete": __body10,
    // figma: Game=Fantasy World, Size=Square
    "game=fantasy world|size=square": __body11,
  };
  return (__impls[__vkey(props)] ?? __body6)();
}
export default ImageRequest;
