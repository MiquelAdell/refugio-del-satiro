// figma node: 76:24294 List (3 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "color=" + __venc(p.color);

export function List(_p = {}) {
  const props = { ..._p, color: _p.color ?? "white" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 24,
      height: 24,
      overflow: "hidden",
      position: "relative",
      color: "rgb(0,0,0)",
      ...props.style,
    }}>
      <div style={{
        position: "absolute",
        left: 0,
        top: 3.484,
        width: 24,
        height: 17.032,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 17.032,
          overflow: "hidden",
        }}>
          <svg width={24} height={17.032} viewBox="0 0 24 17.032" fill="none" style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 24,
            height: 17.032,
          }}>
            <path d={"M 22.452 13.161 L 7.742 13.161 C 6.887 13.161 6.194 13.855 6.194 14.71 C 6.194 15.564 6.887 16.258 7.742 16.258 L 22.452 16.258 C 23.306 16.258 24 15.564 24 14.71 C 24 13.855 23.306 13.161 22.452 13.161 Z M 22.452 6.968 L 7.742 6.968 C 6.887 6.968 6.194 7.661 6.194 8.516 C 6.194 9.371 6.887 10.065 7.742 10.065 L 22.452 10.065 C 23.306 10.065 24 9.371 24 8.516 C 24 7.661 23.306 6.968 22.452 6.968 Z M 7.742 3.871 L 22.452 3.871 C 23.306 3.871 24 3.177 24 2.323 C 24 1.468 23.306 0.774 22.452 0.774 L 7.742 0.774 C 6.887 0.774 6.194 1.468 6.194 2.323 C 6.194 3.177 6.887 3.871 7.742 3.871 Z M 2.323 12.387 C 1.04 12.387 0 13.427 0 14.71 C 0 15.993 1.04 17.032 2.323 17.032 C 3.605 17.032 4.645 15.993 4.645 14.71 C 4.645 13.427 3.605 12.387 2.323 12.387 Z M 2.323 6.194 C 1.04 6.194 0 7.233 0 8.516 C 0 9.799 1.04 10.839 2.323 10.839 C 3.605 10.839 4.645 9.799 4.645 8.516 C 4.645 7.233 3.605 6.194 2.323 6.194 Z M 2.323 0 C 1.04 0 0 1.04 0 2.323 C 0 3.605 1.04 4.645 2.323 4.645 C 3.605 4.645 4.645 3.605 4.645 2.323 C 4.645 1.04 3.605 0 2.323 0 Z"} fill="currentColor" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 24,
      height: 24,
      overflow: "hidden",
      position: "relative",
      color: "rgb(255,255,255)",
      ...props.style,
    }}>
      <div style={{
        position: "absolute",
        left: 0,
        top: 3.484,
        width: 24,
        height: 17.032,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 17.032,
          overflow: "hidden",
        }}>
          <svg width={24} height={17.032} viewBox="0 0 24 17.032" fill="none" style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 24,
            height: 17.032,
          }}>
            <path d={"M 22.452 13.161 L 7.742 13.161 C 6.887 13.161 6.194 13.855 6.194 14.71 C 6.194 15.564 6.887 16.258 7.742 16.258 L 22.452 16.258 C 23.306 16.258 24 15.564 24 14.71 C 24 13.855 23.306 13.161 22.452 13.161 Z M 22.452 6.968 L 7.742 6.968 C 6.887 6.968 6.194 7.661 6.194 8.516 C 6.194 9.371 6.887 10.065 7.742 10.065 L 22.452 10.065 C 23.306 10.065 24 9.371 24 8.516 C 24 7.661 23.306 6.968 22.452 6.968 Z M 7.742 3.871 L 22.452 3.871 C 23.306 3.871 24 3.177 24 2.323 C 24 1.468 23.306 0.774 22.452 0.774 L 7.742 0.774 C 6.887 0.774 6.194 1.468 6.194 2.323 C 6.194 3.177 6.887 3.871 7.742 3.871 Z M 2.323 12.387 C 1.04 12.387 0 13.427 0 14.71 C 0 15.993 1.04 17.032 2.323 17.032 C 3.605 17.032 4.645 15.993 4.645 14.71 C 4.645 13.427 3.605 12.387 2.323 12.387 Z M 2.323 6.194 C 1.04 6.194 0 7.233 0 8.516 C 0 9.799 1.04 10.839 2.323 10.839 C 3.605 10.839 4.645 9.799 4.645 8.516 C 4.645 7.233 3.605 6.194 2.323 6.194 Z M 2.323 0 C 1.04 0 0 1.04 0 2.323 C 0 3.605 1.04 4.645 2.323 4.645 C 3.605 4.645 4.645 3.605 4.645 2.323 C 4.645 1.04 3.605 0 2.323 0 Z"} fill="currentColor" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
  const __impls = {
    // figma: Color=White
    "color=white": __body0,
    // figma: Color=Black
    "color=black": __body0,
    // figma: Color=AccentColor
    "color=accentcolor": __body1,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default List;
