// figma node: 190:51599 Insignia (10 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "type=" + __venc(p.type);

export function Insignia(_p = {}) {
  const props = { ..._p, type: _p.type ?? "winner" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-6168adad48ef03b1" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-e1f038faefacf580" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-64ab290e9521d807" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-14bebc0fda9a7348" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-41a38b66c58797c0" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      overflow: "hidden",
      borderRadius: 32,
      backgroundColor: "rgb(208,188,232)",
      display: "flex",
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-f2d6544101279e81" style={{
        position: "relative",
        width: 45,
        height: 45,
        flexShrink: 0,
      }} />
    </div>
  );
  const __body6 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      overflow: "hidden",
      borderRadius: 32,
      background: "linear-gradient(rgba(12,180,184,0.8),rgba(12,180,184,0.8)), linear-gradient(rgb(0,0,0),rgb(0,0,0))",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-001a04fc83c32b21" style={{
        position: "relative",
        width: 79.252,
        height: 64,
        flexShrink: 0,
      }} />
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      overflow: "hidden",
      borderRadius: 32,
      backgroundColor: "rgb(1,5,13)",
      display: "flex",
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-c20d6995ec424954" style={{
        position: "relative",
        width: 48,
        height: 48,
        flexShrink: 0,
      }} />
    </div>
  );
  const __body8 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      overflow: "hidden",
      borderRadius: 32,
      display: "flex",
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-a64364461e2ecb23" style={{
        position: "relative",
        width: 64,
        flexShrink: 0,
        alignSelf: "stretch",
      }} />
    </div>
  );
  const __body9 = () => (
    <div className={props.className} style={{
      width: 64,
      height: 64,
      position: "relative",
      ...props.style,
    }}>
      <div className="fig-asset-32161d5397cfe447" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 64,
        height: 64,
      }} />
    </div>
  );
  const __impls = {
    // figma: Type=Master
    "type=master": __body0,
    // figma: Type=Winner
    "type=winner": __body1,
    // figma: Type=1
    "type=1": __body2,
    // figma: Type=2
    "type=2": __body3,
    // figma: Type=3
    "type=3": __body4,
    // figma: Type=Cthulhu
    "type=cthulhu": __body5,
    // figma: Type=Alien
    "type=alien": __body6,
    // figma: Type=DnD
    "type=dnd": __body7,
    // figma: Type=Vampiro
    "type=vampiro": __body8,
    // figma: Type=Juegos de mesa
    "type=juegos de mesa": __body9,
  };
  return (__impls[__vkey(props)] ?? __body1)();
}
export default Insignia;
