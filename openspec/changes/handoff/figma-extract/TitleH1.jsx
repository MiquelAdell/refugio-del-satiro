// figma node: 22:520 Title H1
export function TitleH1(_p = {}) {
  const props = { ..._p, text: _p.text ?? "Title" };
  return (
    <div className={props.className} style={{
      width: "fit-content",
      overflow: "hidden",
      borderTop: "1px solid rgb(190,0,0)",
      borderRight: "1px solid rgb(190,0,0)",
      borderBottom: "12px solid rgb(190,0,0)",
      borderLeft: "1px solid rgb(190,0,0)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "5px 20px 5px 20px",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 16,
        textAlign: "center",
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text}</span>
    </div>
  );
}
export default TitleH1;
