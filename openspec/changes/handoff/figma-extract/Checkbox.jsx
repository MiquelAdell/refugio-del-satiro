import { Cross } from './Cross.jsx';

// figma node: 116:66458 Checkbox (4 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state);

export function Checkbox(_p = {}) {
  const props = { ..._p, state: _p.state ?? "unchecked" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 28,
      height: 28,
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(109,109,109)",
      display: "flex",
      flexDirection: "row",
      gap: 10,
      padding: "2px 2px 2px 2px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }} />
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(109,109,109)",
      display: "flex",
      flexDirection: "row",
      gap: 10,
      padding: "2px 2px 2px 2px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon1 ?? <Cross color={"black"} />}</div>
    </div>
  );
  const __impls = {
    // figma: State=Unchecked
    "state=unchecked": __body0,
    // figma: State=Unchecked Counter
    "state=unchecked counter": __body0,
    // figma: State=Checked
    "state=checked": __body1,
    // figma: State=Checke counter
    "state=checke counter": __body1,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Checkbox;
