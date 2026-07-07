import { Cross } from './Cross.jsx';
import { Search } from './Search.jsx';

// figma node: 31:552 Search (2 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state);

export function Search2(_p = {}) {
  const props = { ..._p, state: _p.state ?? "placholder", placeholder: _p.placeholder ?? "Placeholder...", inputText: _p.inputText ?? "Input text" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 720,
      height: 48,
      overflow: "hidden",
      borderRadius: 4,
      boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        display: "flex",
        flexDirection: "row",
        gap: 24,
        padding: "3px 12px 3px 12px",
        alignItems: "center",
        boxSizing: "border-box",
        flexGrow: 1,
        alignSelf: "stretch",
      }}>
        <div style={{
          position: "relative",
          width: 124,
          height: 24,
          flexShrink: 0,
        }}>
          <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 24,
              height: 24,
            }}>{props.icon1 ?? <Search color={"dimgrey"} />}</div>
          <span style={{
            position: "absolute",
            left: 48,
            top: 4,
            width: 76,
            height: 16,
            fontFamily: "Oswald, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
            fontSize: 80,
            lineHeight: "100%",
            color: "rgb(0,0,0)",
          }}>{props.placeholder}</span>
        </div>
      </div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 720,
      height: 48,
      overflow: "hidden",
      borderRadius: 4,
      boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        boxShadow: "inset 0 0 0 0.500px rgb(239,239,239)",
        display: "flex",
        flexDirection: "row",
        padding: "3px 12px 3px 12px",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
        flexGrow: 1,
        alignSelf: "stretch",
      }}>
        <div style={{
          position: "relative",
          width: 375.5,
          display: "flex",
          flexDirection: "row",
          gap: 24,
          alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{
              position: "relative",
              width: 24,
              height: 24,
              flexShrink: 0,
            }}>{props.icon1 ?? <Search color={"dimgrey"} />}</div>
          <span style={{
            position: "relative",
            fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
            fontSize: 12,
            lineHeight: "100%",
            color: "rgb(51,51,51)",
            flexShrink: 0,
          }}>{props.inputText}</span>
        </div>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon2 ?? <Cross color={"black"} />}</div>
      </div>
    </div>
  );
  const __impls = {
    // figma: State=Placholder
    "state=placholder": __body0,
    // figma: State=Search
    "state=search": __body1,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default Search2;
