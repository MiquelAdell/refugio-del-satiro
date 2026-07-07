import { Button } from './Button.jsx';
import { CalendarDate } from './CalendarDate.jsx';
import { Chevron2 } from './Chevron2.jsx';

// figma node: 116:61090 Date Picker (3 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "state=" + __venc(p.state);

export function DatePicker(_p = {}) {
  const props = { ..._p, state: _p.state ?? "default" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 264,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      padding: "20px 20px 20px 20px",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-start",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text1 ?? "Mayo"}</span>
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text2 ?? "2024"}</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                flexShrink: 0,
              }}>{props.icon1 ?? <Chevron2 direction={"left"} />}</div>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                transform: "matrix(-1,0,0,-1,0,0)",
                flexShrink: 0,
              }}>{props.icon2 ?? <Chevron2 direction={"down"} />}</div>
          </div>
        </div>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text3 ?? "Lun"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text4 ?? "Mar"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Mie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Jue</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Vie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Sab</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Dom</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon3 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon4 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"2"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"3"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"4"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"5"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"6"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"7"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"8"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"9"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"10"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"11"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"12"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"13"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"14"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"15"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"16"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"17"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"18"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"19"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"20"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"21"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"22"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"23"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"24"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"25"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"26"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"27"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"28"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"29"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"30"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"31"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: "relative",
        width: 220,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Confirmar"}
          type={"disabled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 264,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      padding: "20px 20px 20px 20px",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-start",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text1 ?? "Mayo"}</span>
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text2 ?? "2024"}</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                flexShrink: 0,
              }}>{props.icon1 ?? <Chevron2 direction={"left"} />}</div>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                transform: "matrix(-1,0,0,-1,0,0)",
                flexShrink: 0,
              }}>{props.icon2 ?? <Chevron2 direction={"down"} />}</div>
          </div>
        </div>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text3 ?? "Lun"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text4 ?? "Mar"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Mie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Jue</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Vie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Sab</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Dom</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon3 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon4 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"2"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"3"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"4"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"5"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"6"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"7"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"8"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"9"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"10"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"11"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"12"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"13"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"14"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"15"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"16"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"17"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"18"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"19"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"20"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"21"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"22"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"23"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"24"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"25"}
                state={"selected"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"26"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"27"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"28"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"29"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"30"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"31"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: "relative",
        width: 220,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Confirmar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 264,
      borderRadius: 8,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(239,239,239)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      padding: "20px 20px 20px 20px",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-start",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text1 ?? "Mayo"}</span>
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              gap: 4,
              alignItems: "flex-start",
              flexShrink: 0,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "20px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text2 ?? "2024"}</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                flexShrink: 0,
              }}>{props.icon1 ?? <Chevron2 direction={"left"} />}</div>
            <div style={{
                position: "relative",
                width: 20,
                height: 20,
                transform: "matrix(-1,0,0,-1,0,0)",
                flexShrink: 0,
              }}>{props.icon2 ?? <Chevron2 direction={"down"} />}</div>
          </div>
        </div>
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-start",
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text3 ?? "Lun"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}>{props.text4 ?? "Mar"}</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Mie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Jue</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(31,31,31)",
                flexShrink: 0,
              }}>Vie</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Sab</span>
            </div>
            <div style={{
              position: "relative",
              backgroundColor: "rgb(255,255,255)",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: "8px 2px 8px 2px",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              flexGrow: 1,
            }}>
              <span style={{
                position: "relative",
                width: 28,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
                fontSize: 12,
                textAlign: "center",
                lineHeight: "16px",
                color: "rgb(190,0,0)",
                flexShrink: 0,
              }}>Dom</span>
            </div>
          </div>
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-start",
            flexShrink: 0,
            alignSelf: "stretch",
          }}>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon3 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <div style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}>{props.icon4 ?? <CalendarDate state={"none"} hover={false} />}</div>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"2"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"3"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"4"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"5"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"6"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"7"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"8"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"9"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"10"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"11"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"12"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"13"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"14"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"15"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"16"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"17"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"18"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"19"}
                state={"avilable"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"20"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"21"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"22"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"23"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"24"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"25"}
                state={"avilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"26"}
                state={"selected"}
                hover={false}
              />
            </div>
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              flexShrink: 0,
              alignSelf: "stretch",
            }}>
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"27"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"28"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"29"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"30"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                text1={"31"}
                state={"unavilable"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
              <CalendarDate
                style={{
                  position: "relative",
                  height: 32,
                  flexGrow: 1,
                  width: "auto",
                }}
                state={"none"}
                hover={false}
              />
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: "relative",
        width: 220,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", flexGrow: 1, width: "auto" }}
          buttonText={"Confirmar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
    </div>
  );
  const __impls = {
    // figma: State=Default
    "state=default": __body0,
    // figma: State=25-May
    "state=25-may": __body1,
    // figma: State=26-May
    "state=26-may": __body2,
  };
  return (__impls[__vkey(props)] ?? __body0)();
}
export default DatePicker;
