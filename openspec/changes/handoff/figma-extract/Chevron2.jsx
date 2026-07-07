// figma node: 116:64403 Chevron (4 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "direction=" + __venc(p.direction);

export function Chevron2(_p = {}) {
  const props = { ..._p, direction: _p.direction ?? "left" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 20,
      height: 20,
      overflow: "hidden",
      position: "relative",
      color: "rgb(31,31,31)",
      ...props.style,
    }}>
      <svg width={6.417} height={11.167} viewBox="0 0 6.417 11.167" fill="none" style={{
        position: "absolute",
        left: 6.833,
        top: 4.417,
        width: 6.417,
        height: 11.167,
      }}>
        <path d={"M 0.25 6.25 L 5 10.917 C 5.333 11.25 5.833 11.25 6.167 10.917 C 6.5 10.583 6.5 10.083 6.167 9.75 L 2.083 5.583 L 6.167 1.417 C 6.5 1.083 6.5 0.583 6.167 0.25 C 6 0.083 5.833 0 5.583 0 C 5.333 0 5.167 0.083 5 0.25 L 0.25 4.917 C -0.083 5.333 -0.083 5.833 0.25 6.25 C 0.25 6.167 0.25 6.167 0.25 6.25 Z"} fill="currentColor" fillRule="nonzero" />
      </svg>
    </div>
  );
  const __impls = {
    // figma: Direction=Left
    "direction=left": __body0,
    // figma: Direction=Up
    "direction=up": __body0,
    // figma: Direction=Down
    "direction=down": __body0,
    // figma: Direction=Right
    "direction=right": __body0,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Chevron2;
