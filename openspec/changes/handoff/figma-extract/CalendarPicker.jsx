import { Calendar } from './Calendar.jsx';
import { Cross } from './Cross.jsx';
import { DatePicker } from './DatePicker.jsx';

// figma node: 116:61104 Calendar Picker (8 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "date=" + __venc(p.date) + '|' + "calendar=" + __venc(p.calendar) + '|' + "day=" + __venc(p.day);

export function CalendarPicker(_p = {}) {
  const props = { ..._p, date: _p.date ?? "unselected", calendar: _p.calendar ?? true, day: _p.day ?? "26-may", label: _p.label ?? "Fecha de recogida" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexGrow: 1,
      }}>{props.label}</span>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(255,255,255)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "25/05/2024"}</span>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
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
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
        flexGrow: 1,
      }}>{props.label}</span>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "26/05/2024"}</span>
      <div style={{
          position: "relative",
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon2 ?? <Cross color={"grey"} />}</div>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
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
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(255,255,255)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <DatePicker
        style={{
          position: "absolute",
          left: 0,
          top: 50,
          width: 264,
        }}
        state={"default"}
      />
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Selecciona una fecha..."}</span>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(255,255,255)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <DatePicker
        style={{
          position: "absolute",
          left: 0,
          top: 50,
          width: 264,
        }}
        state={"25-may"}
      />
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "25/05/2024"}</span>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
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
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <DatePicker
        style={{
          position: "absolute",
          left: 0,
          top: 50,
          width: 264,
        }}
        state={"default"}
      />
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Selecciona una fecha..."}</span>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: 264,
      height: 48,
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
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
          width: 24,
          height: 24,
          flexShrink: 0,
        }}>{props.icon1 ?? <Calendar color={"dimgrey"} />}</div>
      <DatePicker
        style={{
          position: "absolute",
          left: 0,
          top: 50,
          width: 264,
        }}
        state={"26-may"}
      />
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexGrow: 1,
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "26/05/2024"}</span>
      <span style={{
        position: "absolute",
        left: 60,
        top: 3,
        width: 68,
        height: 11,
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 8,
        lineHeight: "100%",
        color: "rgb(190,0,0)",
      }}>{props.label}</span>
    </div>
  );
  const __impls = {
    // figma: Date=Unselected, Calendar=No, Day=25-May
    "date=unselected|calendar=false|day=25-may": __body0,
    // figma: Date=Selected, Calendar=No, Day=25-May
    "date=selected|calendar=false|day=25-may": __body1,
    // figma: Date=Unselected, Calendar=No,Day=26-may
    "date=unselected|calendar=false|day=26-may": __body2,
    // figma: Date=Selected, Calendar=No, Day=26-may
    "date=selected|calendar=false|day=26-may": __body3,
    // figma: Date=Unselected, Calendar=Yes, Day=25-May
    "date=unselected|calendar=true|day=25-may": __body4,
    // figma: Date=Selected, Calendar=Yes, Day=25-May
    "date=selected|calendar=true|day=25-may": __body5,
    // figma: Date=Unselected, Calendar=Yes, Day=26-may
    "date=unselected|calendar=true|day=26-may": __body6,
    // figma: Date=Selected, Calendar=Yes, Day=26-may
    "date=selected|calendar=true|day=26-may": __body7,
  };
  return (__impls[__vkey(props)] ?? __body6)();
}
export default CalendarPicker;
