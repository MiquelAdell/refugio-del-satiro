import { Star } from './Star.jsx';

// figma node: 122:66921 Star rate - static (5 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "stars=" + __venc(p.stars);

export function StarRateStatic(_p = {}) {
  const props = { ..._p, stars: _p.stars ?? "1" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 140,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      padding: "10px 10px 10px 10px",
      justifyContent: "center",
      alignItems: "center",
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
        }}>{props.icon1 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <Star filled={"no"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon3 ?? <Star filled={"no"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon4 ?? <Star filled={"no"} withHover={false} />}</div>
      <Star
        style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        filled={"no"}
        withHover={false}
      />
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 140,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      padding: "10px 10px 10px 10px",
      justifyContent: "center",
      alignItems: "center",
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
        }}>{props.icon1 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon3 ?? <Star filled={"no"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon4 ?? <Star filled={"no"} withHover={false} />}</div>
      <Star
        style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        filled={"no"}
        withHover={false}
      />
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 140,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      padding: "10px 10px 10px 10px",
      justifyContent: "center",
      alignItems: "center",
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
        }}>{props.icon1 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon3 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon4 ?? <Star filled={"no"} withHover={false} />}</div>
      <Star
        style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        filled={"no"}
        withHover={false}
      />
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 140,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      padding: "10px 10px 10px 10px",
      justifyContent: "center",
      alignItems: "center",
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
        }}>{props.icon1 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon3 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon4 ?? <Star filled={"yes"} withHover={false} />}</div>
      <Star
        style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        filled={"no"}
        withHover={false}
      />
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 140,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      padding: "10px 10px 10px 10px",
      justifyContent: "center",
      alignItems: "center",
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
        }}>{props.icon1 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon2 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon3 ?? <Star filled={"yes"} withHover={false} />}</div>
      <div style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}>{props.icon4 ?? <Star filled={"yes"} withHover={false} />}</div>
      <Star
        style={{
          position: "relative",
          width: 24,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        filled={"yes"}
        withHover={false}
      />
    </div>
  );
  const __impls = {
    // figma: Stars=1
    "stars=1": __body0,
    // figma: Stars=2
    "stars=2": __body1,
    // figma: Stars=3
    "stars=3": __body2,
    // figma: Stars=4
    "stars=4": __body3,
    // figma: Stars=5
    "stars=5": __body4,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default StarRateStatic;
