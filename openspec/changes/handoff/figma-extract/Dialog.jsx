import { Button } from './Button.jsx';
import { CalendarPicker } from './CalendarPicker.jsx';
import { Check } from './Check.jsx';
import { Checkbox } from './Checkbox.jsx';
import { Cross } from './Cross.jsx';
import { GameImage } from './GameImage.jsx';
import { Icons } from './Icons.jsx';
import { ImageRequest } from './ImageRequest.jsx';
import { Input } from './Input.jsx';
import { InsigniaComplete } from './InsigniaComplete.jsx';
import { Search2 } from './Search2.jsx';
import { StarRateAnimated } from './StarRateAnimated.jsx';

// figma node: 108:55890 Dialog (14 variants)
const __venc = (v) => String(v).replace(/[%|=]/g, encodeURIComponent);
const __vkey = (p) => "type=" + __venc(p.type) + '|' + "breakpoint=" + __venc(p.breakpoint);

export function Dialog(_p = {}) {
  const props = { ..._p, description: _p.description ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacus nisi, consequat at vehicula sed, euismod quis nisl. Aliquam rhoncus nec felis in posuere. Fusce sodales tortor eros. Etiam molestie urna ac imperdiet congue. Aenean ut mi finibus, laoreet sem sit amet, dignissim ex. Sed at arcu ut velit ultrices bibendum. Ut risus leo, vulputate finibus malesuada dictum, faucibus eget diam. Mauris eu nisl quis libero iaculis lacinia. Ut convallis turpis lorem, id lobortis turpis egestas et. Vivamus ut magna sed nibh cursus ornare.", title: _p.title ?? "Title", type: _p.type ?? "action", breakpoint: _p.breakpoint ?? "desktop" };
  const __body0 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Segoe UI\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontWeight: 600,
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.title}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Segoe UI\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontWeight: 600,
        fontSize: 14,
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.description}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 91, flexShrink: 0 }}
          buttonText={"Close"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 111, flexShrink: 0 }}
          buttonText={"Continue"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body1 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
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
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 110, flexShrink: 0 }}
          buttonText={"Continue"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body2 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "¡Hola!, tenías una reserva hoy..."}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "pre-wrap",
      }}>{"Recuerda que hoy habías reservado el siguiente juego. ¿Has podido recogerlo?"}{"\n"}{"\n"}{"Recuerda que en caso que no lo recojas hoy, "}<span style={{ fontWeight: 700, fontSize: 12 }}>{"tu reserva de será cancelada"}</span>{" y el juego quedará libre para otras reservas."}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
            position: "relative",
            width: 100,
            height: 100,
            flexShrink: 0,
          }}>
          <GameImage
            style={{ transform: "scale(0.500, 0.500)", transformOrigin: "0 0" }}
            game={"diamant"}
            size={"complete"}
          />
        </div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 24,
          textAlign: "center",
          lineHeight: "100%",
          color: "rgb(0,0,0)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{props.text2 ?? "Diamant"}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 223, flexShrink: 0 }}
          buttonText={"Aun no, posponer a las 20:00"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 110, flexShrink: 0 }}
          buttonText={"Sí, ¡ya lo tengo!"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body3 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "¡Gracias por jugar!"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text2 ?? "¿Te ha gustado el juego?"}</span>
      <Input
        style={{
          position: "relative",
          height: 120,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}
        label={"Añadir comentario"}
        state={"default multiline"}
      />
      <div style={{
          position: "relative",
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.starRate ?? <StarRateAnimated stars={"1"} />}</div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 152, flexShrink: 0 }}
          buttonText={"No devolver aun"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 181, flexShrink: 0 }}
          buttonText={"Confirmar devolución"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body4 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "¿La actualización es correcta?"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text2 ?? "Si hubiera algun cambio que no sea correcto, revisar los datos de la BGG y RPGG antes de confirmar."}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 96, flexShrink: 0 }}
          buttonText={"Cerrar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 117, flexShrink: 0 }}
          buttonText={"Confirmar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body5 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "¿Estás seguro de querer eliminar?"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text2 ?? "Si eliminas el registro de evento, se cancelaran todas las reservas de juegos para el evento."}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 122, flexShrink: 0 }}
          buttonText={"Sí, eliminar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body6 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Sincronización completada"}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <Check color={"greensuccess"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexGrow: 1,
        }}>{props.text2 ?? "Se ha completado correctamente la sincronización."}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 110, flexShrink: 0 }}
          buttonText={"Continue"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon2 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body7 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Error en la sincronización"}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
            position: "relative",
            width: 24,
            height: 24,
            flexShrink: 0,
          }}>{props.icon1 ?? <Cross color={"rederror"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexGrow: 1,
        }}>{props.text2 ?? "Ha habido un error en sincronizar los contenidos. Vuelve a intentarlo más tarde."}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 110, flexShrink: 0 }}
          buttonText={"Cerrar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon2 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body8 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Solicitar préstamo"}</span>
      <div style={{
          position: "relative",
          height: 48,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.datePicker ?? <CalendarPicker date={"unselected"} calendar={false} day={"25-may"} />}</div>
      <div style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "10px 10px 10px 10px",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        boxSizing: "border-box",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
            position: "relative",
            width: 28,
            height: 28,
            flexShrink: 0,
          }}>{props.icon1 ?? <Checkbox state={"unchecked"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(0,0,0)",
          flexGrow: 1,
        }}>{props.text2 ?? "Me comprometo a ir a buscar el juego que pido en préstamo el día indicado y, en caso contrario, se me cancele la reserva. También me responsabilizo que el juego vuelva, así como de cuidarlo y devolverlo cuando haya disfrutado de este o El Refugio del Sátiro lo necesite para alguna de sus jornadas."}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 117, flexShrink: 0 }}
          buttonText={"Confirmar"}
          type={"disabled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon2 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body9 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Solicitar préstamo"}</span>
      <div style={{
          position: "relative",
          height: 48,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}>{props.datePicker ?? <CalendarPicker date={"unselected"} calendar={false} day={"25-may"} />}</div>
      <div style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        padding: "10px 10px 10px 10px",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        boxSizing: "border-box",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>{props.icon1 ?? <Checkbox state={"checked"} />}</div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          lineHeight: "100%",
          color: "rgb(51,51,51)",
          flexGrow: 1,
        }}>{props.text2 ?? "Me comprometo a ir a buscar el juego que pido en préstamo el día indicado y, en caso contrario, se me cancele la reserva. También me responsabilizo que el juego vuelva, así como de cuidarlo y devolverlo cuando haya disfrutado de este o El Refugio del Sátiro lo necesite para alguna de sus jornadas."}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 117, flexShrink: 0 }}
          buttonText={"Confirmar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon2 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body10 = () => (
    <div className={props.className} style={{
      width: 613,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "¿Ya tienes el juego o quieres cancelar la reserva?"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(51,51,51)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "pre-wrap",
      }}>{"¿Ya has recogido el juego o quieres cancelar la reserva?"}{"\n"}{"En caso que quieras"}<span style={{ fontWeight: 700, fontSize: 12 }}>{" cancelar la reserva"}</span>{", se le cederá la opción a la siguiente persona que lo haya solicitado. Si la lista de espera estuviera vacía, podrías volver a reservarlo para pedir en préstamo cuando quieras."}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 175, flexShrink: 0 }}
          buttonText={"Mantengo la reserva"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 162, flexShrink: 0 }}
          buttonText={"Cancelo la reserva"}
          type={"outline"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 156, flexShrink: 0 }}
          buttonText={"Ya tengo el juego"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 581,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body11 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Solicitar nuevo juego"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text2 ?? "Se ha solicitado el siguiente juego, ¿estás conforme?"}</span>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>
        <div style={{
            position: "relative",
            width: 100,
            height: 154.475,
            flexShrink: 0,
          }}>
          <ImageRequest
            style={{ transform: "scale(0.500, 0.500)", transformOrigin: "0 0" }}
            game={"fantasy world"}
            size={"complete"}
          />
        </div>
        <span style={{
          position: "relative",
          fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
          fontSize: 12,
          textAlign: "center",
          lineHeight: "100%",
          color: "rgb(0,0,0)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>{props.text3 ?? "Fantasy World"}</span>
      </div>
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 120, flexShrink: 0 }}
          buttonText={"Si, solicitar"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body12 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Añadir nueva insignia"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text2 ?? "Para añadir una nueva insígnia, pídesela a alguno de los responsables del evento en el que estés participando."}</span>
      <Search2
        style={{
          position: "relative",
          height: 48,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}
        placeholder={"Introducir código insigia..."}
        state={"placholder"}
      />
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 97, flexShrink: 0 }}
          buttonText={"Añadir"}
          type={"disabled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __body13 = () => (
    <div className={props.className} style={{
      width: 504,
      borderRadius: 10,
      backgroundColor: "rgb(255,255,255)",
      boxShadow: "inset 0 0 0 1px rgb(221,221,221), 0px 0px 5px 0px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "20px 32px 20px 32px",
      justifyContent: "center",
      alignItems: "flex-end",
      boxSizing: "border-box",
      position: "relative",
      ...props.style,
    }}>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 24,
        lineHeight: "100%",
        color: "rgb(34,34,34)",
        flexShrink: 0,
        alignSelf: "stretch",
        whiteSpace: "nowrap",
      }}>{props.text1 ?? "Añadir nueva insignia"}</span>
      <span style={{
        position: "relative",
        fontFamily: "\"Open Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        fontSize: 12,
        lineHeight: "100%",
        color: "rgb(0,0,0)",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>{props.text2 ?? "Para añadir una nueva insígnia, pídesela a alguno de los responsables del evento en el que estés participando."}</span>
      <Search2
        style={{
          position: "relative",
          height: 48,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}
        placeholder={"Introducir código insigia..."}
        inputText={"MasterRefugioSatiro"}
        state={"search"}
      />
      <InsigniaComplete
        style={{
          position: "relative",
          height: 80,
          flexShrink: 0,
          alignSelf: "stretch",
          width: "auto",
        }}
        title={"Máster estrella"}
        description={"Insígnia por haver participado como máster en todos los eventos del club proponiendo una partida de rol"}
        state={"shown"}
      />
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <Button
          style={{ position: "relative", width: 109, flexShrink: 0 }}
          buttonText={"Cancelar"}
          type={"noborder"}
          state={"default"}
          icon={false}
          size={"s"}
        />
        <Button
          style={{ position: "relative", width: 97, flexShrink: 0 }}
          buttonText={"Añadir"}
          type={"filled"}
          state={"default"}
          icon={false}
          size={"s"}
        />
      </div>
      <div style={{
          position: "absolute",
          left: 472,
          top: 20,
          width: 10,
          height: 10,
        }}>{props.icon1 ?? <Icons icon={"dismiss"} color={"black"} state={"fill"} style={{ transform: "scale(0.200, 0.200)", transformOrigin: "0 0" }} />}</div>
    </div>
  );
  const __impls = {
    // figma: Type=Action + close, Breakpoint=Desktop
    "type=action + close|breakpoint=desktop": __body0,
    // figma: Type=Action, Breakpoint=Desktop
    "type=action|breakpoint=desktop": __body1,
    // figma: Type=Confirm Reserved, Breakpoint=Desktop
    "type=confirm reserved|breakpoint=desktop": __body2,
    // figma: Type=Return Game, Breakpoint=Desktop
    "type=return game|breakpoint=desktop": __body3,
    // figma: Type=Confirm Sinc, Breakpoint=Desktop
    "type=confirm sinc|breakpoint=desktop": __body4,
    // figma: Type=Confirm Delete, Breakpoint=Desktop
    "type=confirm delete|breakpoint=desktop": __body5,
    // figma: Type=Success, Breakpoint=Desktop
    "type=success|breakpoint=desktop": __body6,
    // figma: Type=Error, Breakpoint=Desktop
    "type=error|breakpoint=desktop": __body7,
    // figma: Type=Solicitar préstamo, Breakpoint=Desktop
    "type=solicitar préstamo|breakpoint=desktop": __body8,
    // figma: Type=Confirmar préstamo, Breakpoint=Desktop
    "type=confirmar préstamo|breakpoint=desktop": __body9,
    // figma: Type=Cancelar préstamo, Breakpoint=Desktop
    "type=cancelar préstamo|breakpoint=desktop": __body10,
    // figma: Type=Solicitar juego, Breakpoint=Desktop
    "type=solicitar juego|breakpoint=desktop": __body11,
    // figma: Type=Añadir código insignia, Breakpoint=Desktop
    "type=añadir código insignia|breakpoint=desktop": __body12,
    // figma: Type=Añadir insignia, Breakpoint=Desktop
    "type=añadir insignia|breakpoint=desktop": __body13,
  };
  return (__impls[__vkey(props)] ?? __body1)();
}
export default Dialog;
