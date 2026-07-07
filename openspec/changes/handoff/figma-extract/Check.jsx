// figma node: 267:80978 Check (5 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "color=" + __venc(p.color);

export function Check(_p = {}) {
  const props = { ..._p, color: _p.color ?? "black" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 24,
      height: 24,
      overflow: "hidden",
      position: "relative",
      color: "rgb(0,0,0)",
      ...props.style,
    }}>
      <svg width={16} height={11} viewBox="0 0 16 11" fill="none" style={{
        position: "absolute",
        left: 4,
        top: 6.5,
        width: 16,
        height: 11,
      }}>
        <path d={"M 0.705 5.402 C 0.313 5.012 -0.32 5.015 -0.71 5.406 C -1.099 5.798 -1.097 6.432 -0.705 6.821 L 0.705 5.402 Z M 4.923 11 L 4.218 11.71 C 4.608 12.097 5.238 12.097 5.628 11.71 L 4.923 11 Z M 16.705 0.71 C 17.097 0.32 17.099 -0.313 16.71 -0.705 C 16.32 -1.097 15.687 -1.099 15.295 -0.71 L 16.705 0.71 Z M -0.705 6.821 L 4.218 11.71 L 5.628 10.29 L 0.705 5.402 L -0.705 6.821 Z M 5.628 11.71 L 16.705 0.71 L 15.295 -0.71 L 4.218 10.29 L 5.628 11.71 Z"} fill="currentColor" fillRule="nonzero" />
      </svg>
    </div>
  );
  const __impls = {
    // figma: Color=Black
    "color=black": __body0,
    // figma: Color=DimGrey
    "color=dimgrey": __body0,
    // figma: Color=TextColor
    "color=textcolor": __body0,
    // figma: Color=GreenSuccess
    "color=greensuccess": __body0,
    // figma: Color=White
    "color=white": __body0,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Check;
