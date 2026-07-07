// figma node: 367:50729 Title icon (3 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "color=" + __venc(p.color);

export function TitleIcon(_p = {}) {
  const props = { ..._p, color: _p.color ?? "default" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 24,
      height: 24,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      color: "rgb(0,0,0)",
      ...props.style,
    }}>
      <svg width={12} height={13} viewBox="0 0 12 13" fill="none" style={{
        position: "relative",
        width: 12,
        height: 13,
        flexShrink: 0,
      }}>
        <path d={"M 7 0 C 7 -0.552 6.552 -1 6 -1 C 5.448 -1 5 -0.552 5 0 L 7 0 Z M 5 13 C 5 13.552 5.448 14 6 14 C 6.552 14 7 13.552 7 13 L 5 13 Z M 0 -1 C -0.552 -1 -1 -0.552 -1 0 C -1 0.552 -0.552 1 0 1 L 0 -1 Z M 12 1 C 12.552 1 13 0.552 13 0 C 13 -0.552 12.552 -1 12 -1 L 12 1 Z M 5 0 L 5 13 L 7 13 L 7 0 L 5 0 Z M 0 1 L 12 1 L 12 -1 L 0 -1 L 0 1 Z"} fill="currentColor" fillRule="nonzero" />
      </svg>
    </div>
  );
  const __impls = {
    // figma: Color=Default
    "color=default": __body0,
    // figma: Color=DimGrey
    "color=dimgrey": __body0,
    // figma: Color=TextColor
    "color=textcolor": __body0,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default TitleIcon;
