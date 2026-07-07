import { IconButtons } from './IconButtons.jsx';

// figma node: 76:24381 View selector (2 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "view=" + __venc(p.view);

export function ViewSelector(_p = {}) {
  const props = { ..._p, view: _p.view ?? "grid" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      gap: 5,
      alignItems: "flex-start",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon1 ?? <IconButtons type={"outline"} icon={"list"} hover={false} />}</div>
      <div style={{
          position: "relative",
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <IconButtons type={"filled"} icon={"grid"} hover={false} />}</div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      gap: 5,
      alignItems: "flex-start",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon1 ?? <IconButtons type={"filled"} icon={"list"} hover={false} />}</div>
      <div style={{
          position: "relative",
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <IconButtons type={"outline"} icon={"grid"} hover={false} />}</div>
    </div>
  );
  const __impls = {
    // figma: View=Grid
    "view=grid": __body0,
    // figma: View=List
    "view=list": __body1,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default ViewSelector;
