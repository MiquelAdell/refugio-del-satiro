import { Insignia } from './Insignia.jsx';

// figma node: 190:51743 Insignia complete (4 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state);

export function InsigniaComplete(_p = {}) {
  const props = { ..._p, title: _p.title ?? "Nombre insignia", description: _p.description ?? "Descripción", state: _p.state ?? "hover" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      position: "relative",
      color: "rgb(217,217,217)",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 64,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <Insignia type={"master"} />}</div>
      <div style={{
        position: "absolute",
        left: 26,
        top: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}>
        <div style={{
          position: "relative",
          maxWidth: 300,
          maxHeight: null,
          boxShadow: "0px 2px 2px 0px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          padding: "5px 5px 5px 5px",
          alignItems: "flex-start",
          boxSizing: "border-box",
          flexShrink: 0,
        }}>
          <span style={{
            position: "relative",
            fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
            fontSize: 12,
            lineHeight: "100%",
            color: "rgb(0,0,0)",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>{props.title}</span>
          <span style={{
            position: "relative",
            fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
            fontSize: 8,
            lineHeight: "100%",
            color: "rgb(0,0,0)",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>{props.description}</span>
        </div>
        <svg width={7} height={6} viewBox="0 0 7 6" fill="none" style={{
          position: "absolute",
          left: 2,
          top: -5,
          width: 7,
          height: 6,
        }}>
          <path d={"M 3.5 0 L 6.531 4.5 L 0.469 4.5 L 3.5 0 Z"} fill="currentColor" fillRule="nonzero" />
          <path d={"M 3.5 0 L 4.329 -0.559 L 3.5 -1.79 L 2.671 -0.559 L 3.5 0 Z M 6.531 4.5 L 6.531 5.5 L 8.41 5.5 L 7.36 3.941 L 6.531 4.5 Z M 0.469 4.5 L -0.36 3.941 L -1.41 5.5 L 0.469 5.5 L 0.469 4.5 Z M 2.671 0.559 L 5.702 5.059 L 7.36 3.941 L 4.329 -0.559 L 2.671 0.559 Z M 6.531 3.5 L 0.469 3.5 L 0.469 5.5 L 6.531 5.5 L 6.531 3.5 Z M 1.298 5.059 L 4.329 0.559 L 2.671 -0.559 L -0.36 3.941 L 1.298 5.059 Z"} fill="currentColor" fillRule="nonzero" />
        </svg>
      </div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 64,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <Insignia type={"master"} />}</div>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 364,
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          width: 64,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon1 ?? <Insignia type={"master"} />}</div>
      <div style={{
        position: "relative",
        maxWidth: 300,
        maxHeight: null,
        display: "flex",
        flexDirection: "column",
        padding: "5px 5px 5px 5px",
        alignItems: "flex-start",
        boxSizing: "border-box",
        flexGrow: 1,
      }}>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 16,
          lineHeight: "100%",
          color: "rgb(31,31,31)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>{props.title}</span>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>{props.description}</span>
      </div>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 382,
      display: "flex",
      flexDirection: "row",
      padding: "5px 0px 5px 0px",
      justifyContent: "center",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          width: 64,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon1 ?? <Insignia type={"master"} />}</div>
      <div style={{
        position: "relative",
        maxWidth: 300,
        maxHeight: null,
        display: "flex",
        flexDirection: "column",
        padding: "5px 5px 5px 5px",
        alignItems: "flex-start",
        boxSizing: "border-box",
        flexGrow: 1,
      }}>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 16,
          lineHeight: "100%",
          color: "rgb(31,31,31)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>{props.title}</span>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>{props.description}</span>
      </div>
    </div>
  );
  const __impls = {
    // figma: State=Hover
    "state=hover": __body0,
    // figma: State=Default
    "state=default": __body1,
    // figma: State=Shown
    "state=shown": __body2,
    // figma: State=Spotlight
    "state=spotlight": __body3,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default InsigniaComplete;
