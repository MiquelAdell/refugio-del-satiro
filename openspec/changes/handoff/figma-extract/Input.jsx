import { Cross } from './Cross.jsx';
import { ImageIcon } from './ImageIcon.jsx';
import { TitleIcon } from './TitleIcon.jsx';

// figma node: 367:50718 Input (8 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state);

export function Input(_p = {}) {
  const props = { ..._p, label: _p.label ?? "Label", state: _p.state ?? "bar" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      gap: 24,
      padding: "3px 12px 3px 12px",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
        }}>{props.label}</span>
      </div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      padding: "3px 12px 3px 12px",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{props.text1 ?? "|"}</span>
      </div>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 46,
        top: 1,
        width: 21,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      padding: "3px 12px 3px 12px",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
      </div>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 46,
        top: 1,
        width: 21,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      padding: "3px 12px 3px 12px",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{props.text1 ?? "Input text"}</span>
      </div>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 46,
        top: 1,
        width: 21,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      gap: 24,
      padding: "3px 12px 3px 12px",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <ImageIcon color={"black"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(190,0,0)",
          flexShrink: 0,
        }}>{props.label}</span>
      </div>
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      padding: "3px 12px 3px 12px",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <ImageIcon color={"black"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{props.text1 ?? "Input text"}</span>
      </div>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 46,
        top: 1,
        width: 21,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body6 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 120,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      gap: 24,
      padding: "3px 12px 3px 12px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "center",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(190,0,0)",
          flexShrink: 0,
        }}>{props.label}</span>
      </div>
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: 211.625,
      height: 120,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 0.500px rgb(239,239,239), 0px 0px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "row",
      padding: "3px 12px 3px 12px",
      justifyContent: "space-between",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        width: 151,
        height: 110,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "4px 0px 4px 0px",
        alignItems: "flex-start",
        boxSizing: "border-box",
        flexShrink: 0,
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <TitleIcon color={"dimgrey"} />}</div>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          gap: 10,
          padding: "4px 0px 4px 0px",
          alignItems: "flex-start",
          boxSizing: "border-box",
          flexGrow: 1,
          alignSelf: "stretch",
        }}>
          <span style={{
            position: "relative",
            fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
            fontSize: 12,
            lineHeight: "100%",
            color: "rgb(51,51,51)",
            flexGrow: 1,
            alignSelf: "stretch",
            whiteSpace: "nowrap",
          }}>{props.text1 ?? "Input text"}</span>
        </div>
      </div>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 46,
        top: 1,
        width: 21,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __impls = {
    // figma: State=Defaul
    "state=defaul": __body0,
    // figma: State=Bar
    "state=bar": __body1,
    // figma: State=NoBar
    "state=nobar": __body2,
    // figma: State=Input
    "state=input": __body3,
    // figma: State=Image Default
    "state=image default": __body4,
    // figma: State=Image Input
    "state=image input": __body5,
    // figma: State=Default multiline
    "state=default multiline": __body6,
    // figma: State=Input multiline
    "state=input multiline": __body7,
  };
  return (__impls[__vkey(props)] ?? __body1)();
}
export default Input;
