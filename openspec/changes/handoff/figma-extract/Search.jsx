// figma node: 31:543 Search (2 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "color=" + __venc(p.color);

export function Search(_p = {}) {
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
      <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{
        position: "absolute",
        left: 3,
        top: 3,
        width: 18,
        height: 18,
      }}>
        <path d={"M 7 2 C 4.239 2 2 4.239 2 7 C 2 9.761 4.239 12 7 12 C 8.381 12 9.63 11.441 10.535 10.535 C 11.441 9.63 12 8.381 12 7 C 12 4.239 9.761 2 7 2 Z M 0 7 C 0 3.134 3.134 0 7 0 C 10.866 0 14 3.134 14 7 C 14 8.572 13.481 10.024 12.606 11.192 L 17.707 16.293 C 18.098 16.683 18.098 17.317 17.707 17.707 C 17.317 18.098 16.683 18.098 16.293 17.707 L 11.192 12.606 C 10.024 13.481 8.572 14 7 14 C 3.134 14 0 10.866 0 7 Z"} fill="currentColor" fillRule="evenodd" />
      </svg>
    </div>
  );
  const __impls = {
    // figma: Color=Black
    "color=black": __body0,
    // figma: Color=DimGrey
    "color=dimgrey": __body0,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Search;
