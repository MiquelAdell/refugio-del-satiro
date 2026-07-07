import { Grid } from './Grid.jsx';
import { List } from './List.jsx';
import { SortASC } from './SortASC.jsx';
import { SortDES } from './SortDES.jsx';

// figma node: 76:24322 Icon buttons (12 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "type=" + __venc(p.type) + '|' + "icon=" + __venc(p.icon) + '|' + "hover=" + __venc(p.hover);

export function IconButtons(_p = {}) {
  const props = { ..._p, type: _p.type ?? "outline", icon: _p.icon ?? "grid", hover: _p.hover ?? true };
  const __body0 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <Grid color={"accentcolor"} />}</div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239), 0px 2px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <Grid color={"accentcolor"} />}</div>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <Grid color={"white"} />}</div>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <List color={"accentcolor"} />}</div>
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239), 0px 2px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <List color={"accentcolor"} />}</div>
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(190,0,0)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "10px 10px 10px 10px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <List color={"white"} />}</div>
    </div>
  );
  const __body6 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortASC color={"red"} />}</div>
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239), 0px 2px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortASC color={"red"} />}</div>
    </div>
  );
  const __body8 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortASC color={"white"} />}</div>
    </div>
  );
  const __body9 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortDES color={"red"} />}</div>
    </div>
  );
  const __body10 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(239,239,239)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239), 0px 2px 2px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortDES color={"red"} />}</div>
    </div>
  );
  const __body11 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderRadius: 4,
      backgroundColor: "rgb(190,0,0)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "6px 6px 6px 6px",
      alignItems: "flex-start",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
          position: "relative",
          height: 32,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.icon1 ?? <SortDES color={"white"} />}</div>
    </div>
  );
  const __impls = {
    // figma: Type=Outline, Icon=Grid, Hover=No
    "type=outline|icon=grid|hover=false": __body0,
    // figma: Type=Outline, Icon=Grid, Hover=Yes
    "type=outline|icon=grid|hover=true": __body1,
    // figma: Type=Filled, Icon=Grid, Hover=No
    "type=filled|icon=grid|hover=false": __body2,
    // figma: Type=Outline, Icon=List, Hover=No
    "type=outline|icon=list|hover=false": __body3,
    // figma: Type=Outline, Icon=List, Hover=Yes
    "type=outline|icon=list|hover=true": __body4,
    // figma: Type=Filled, Icon=List, Hover=No
    "type=filled|icon=list|hover=false": __body5,
    // figma: Type=Outline, Icon=Order ASC, Hover=No
    "type=outline|icon=order asc|hover=false": __body6,
    // figma: Type=Outline, Icon=Order ASC, Hover=Yes
    "type=outline|icon=order asc|hover=true": __body7,
    // figma: Type=Filled, Icon=Order ASC, Hover=No
    "type=filled|icon=order asc|hover=false": __body8,
    // figma: Type=Outline, Icon=Order DES, Hover=No
    "type=outline|icon=order des|hover=false": __body9,
    // figma: Type=Outline, Icon=Order DES, Hover=Yes
    "type=outline|icon=order des|hover=true": __body10,
    // figma: Type=Filled, Icon=Order DES, Hover=No
    "type=filled|icon=order des|hover=false": __body11,
  };
  return (__impls[__vkey(props)] ?? __body1)();
}
export default IconButtons;
