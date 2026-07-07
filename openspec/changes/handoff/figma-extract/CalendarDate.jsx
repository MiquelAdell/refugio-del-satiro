// figma node: 116:61962 Calendar Date (6 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state) + '|' + "hover=" + __venc(p.hover);

export function CalendarDate(_p = {}) {
  const props = { ..._p, state: _p.state ?? "unavilable", hover: _p.hover ?? false };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 30,
      height: 32,
      display: "flex",
      flexDirection: "row",
      gap: 8,
      padding: "16px 8px 16px 8px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }} />
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 30,
      height: 32,
      display: "flex",
      flexDirection: "row",
      gap: 8,
      padding: "16px 8px 16px 8px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        textAlign: "center",
        lineHeight: "16px",
        color: "rgb(109,109,109)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "1"}</span>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 30,
      height: 32,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      display: "flex",
      flexDirection: "row",
      gap: 8,
      padding: "16px 8px 16px 8px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        textAlign: "center",
        lineHeight: "16px",
        color: "rgb(109,109,109)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "1"}</span>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 30,
      height: 32,
      borderRadius: 4,
      display: "flex",
      flexDirection: "row",
      gap: 8,
      padding: "16px 8px 16px 8px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        textAlign: "center",
        lineHeight: "16px",
        color: "rgb(109,109,109)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "1"}</span>
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 30,
      height: 32,
      borderRadius: 4,
      boxShadow: "0px 2px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      gap: 8,
      padding: "16px 8px 16px 8px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        textAlign: "center",
        lineHeight: "16px",
        color: "rgb(109,109,109)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "1"}</span>
    </div>
  );
  const __impls = {
    // figma: State=None, Hover=No
    "state=none|hover=false": __body0,
    // figma: State=Unavilable,Hover=No
    "state=unavilable|hover=false": __body1,
    // figma: State=Avilable, Hover=No
    "state=avilable|hover=false": __body1,
    // figma: State=Avilable, Hover=Yes
    "state=avilable|hover=true": __body2,
    // figma: State=Selected, Hover=No
    "state=selected|hover=false": __body3,
    // figma: State=Selected, Hover=Yes
    "state=selected|hover=true": __body4,
  };
  return (__impls[__vkey(props)] ?? __body1)();
}
export default CalendarDate;
