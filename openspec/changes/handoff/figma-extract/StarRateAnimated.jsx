import { Star } from './Star.jsx';
import { StarRateStatic } from './StarRateStatic.jsx';

// figma node: 465:61451 Star rate - animated (5 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "stars=" + __venc(p.stars);

export function StarRateAnimated(_p = {}) {
  const props = { ..._p, stars: _p.stars ?? "5" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <StarRateStatic
        style={{
          position: "relative",
          width: 140,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        icon1={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon2={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon3={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon4={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        stars={"1"}
      />
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <StarRateStatic
        style={{
          position: "relative",
          width: 140,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        icon1={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon2={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon3={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon4={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        stars={"2"}
      />
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <StarRateStatic
        style={{
          position: "relative",
          width: 140,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        icon1={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon2={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon3={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon4={<Star filled={"no"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        stars={"3"}
      />
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <StarRateStatic
        style={{
          position: "relative",
          width: 140,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        icon1={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon2={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon3={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon4={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        stars={"4"}
      />
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: "fit-content",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      ...props.style,
    }}>
      <StarRateStatic
        style={{
          position: "relative",
          width: 140,
          flexShrink: 0,
          alignSelf: "stretch",
          height: "auto",
        }}
        icon1={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon2={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon3={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        icon4={<Star filled={"yes"} withHover={true} style={{ width: "100%", height: "100%" }} />}
        stars={"5"}
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
  return (__impls[__vkey(props)] ?? __body4)();
}
export default StarRateAnimated;
