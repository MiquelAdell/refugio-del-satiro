// figma node: 76:24304 Grid (3 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "color=" + __venc(p.color);

export function Grid(_p = {}) {
  const props = { ..._p, color: _p.color ?? "white" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 24,
      height: 24,
      overflow: "hidden",
      position: "relative",
      color: "rgb(0,0,0)",
      ...props.style,
    }}>
      <div style={{
        position: "absolute",
        left: 0,
        top: 1.091,
        width: 24,
        height: 21,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 21,
          overflow: "hidden",
        }}>
          <svg width={24} height={21} viewBox="0 0 24 21" fill="none" style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 24,
            height: 21,
          }}>
            <path d={"M 12 0 C 10.343 0 9 1.343 9 3 C 9 4.657 10.343 6 12 6 C 13.657 6 15 4.657 15 3 C 15 1.343 13.657 0 12 0 Z M 21 7.5 C 19.343 7.5 18 8.843 18 10.5 C 18 12.157 19.343 13.5 21 13.5 C 22.657 13.5 24 12.157 24 10.5 C 24 8.843 22.657 7.5 21 7.5 Z M 12 15 C 10.343 15 9 16.343 9 18 C 9 19.657 10.343 21 12 21 C 13.657 21 15 19.657 15 18 C 15 16.343 13.657 15 12 15 Z M 21 15 C 19.343 15 18 16.343 18 18 C 18 19.657 19.343 21 21 21 C 22.657 21 24 19.657 24 18 C 24 16.343 22.657 15 21 15 Z M 12 7.5 C 10.343 7.5 9 8.843 9 10.5 C 9 12.157 10.343 13.5 12 13.5 C 13.657 13.5 15 12.157 15 10.5 C 15 8.843 13.657 7.5 12 7.5 Z M 21 6 C 22.657 6 24 4.657 24 3 C 24 1.343 22.657 0 21 0 C 19.343 0 18 1.343 18 3 C 18 4.657 19.343 6 21 6 Z M 3 15 C 1.343 15 0 16.343 0 18 C 0 19.657 1.343 21 3 21 C 4.657 21 6 19.657 6 18 C 6 16.343 4.657 15 3 15 Z M 3 7.5 C 1.343 7.5 0 8.843 0 10.5 C 0 12.157 1.343 13.5 3 13.5 C 4.657 13.5 6 12.157 6 10.5 C 6 8.843 4.657 7.5 3 7.5 Z M 3 0 C 1.343 0 0 1.343 0 3 C 0 4.657 1.343 6 3 6 C 4.657 6 6 4.657 6 3 C 6 1.343 4.657 0 3 0 Z"} fill="currentColor" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
  const __impls = {
    // figma: Color=White
    "color=white": __body0,
    // figma: Color=Black
    "color=black": __body0,
    // figma: Color=AccentColor
    "color=accentcolor": __body0,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Grid;
