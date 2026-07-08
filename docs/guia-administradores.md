# Guía para administradores — Ludoteca del Refugio del Sátiro

Esta guía explica cómo usar las páginas de administración de la Ludoteca
(https://www.refugiodelsatiro.es/ludoteca). Está pensada para las personas
de la junta o voluntarias que gestionan socios, préstamos y el contenido
de la web.

## 1. Quién es administrador y cómo entrar

No existe un acceso de administrador separado: se entra con la misma
pantalla que cualquier socio, en **Ludoteca → Iniciar sesión**
(`/ludoteca/login`), con tu email y contraseña.

Lo que te convierte en administrador es una marca en tu ficha de socio.
Esa marca no se puede activar desde la web: se asigna al importar el CSV
de socios (columna `admin` con valor `yes`) o la pone un desarrollador
directamente. Si necesitas que alguien pase a ser administrador, pide que
se actualice su ficha por una de esas dos vías.

Cuando entras como administrador, el menú **Ludoteca** muestra, además de
"Mis préstamos", un apartado **Administración** con dos opciones:

- **Miembros** → Gestión de socios (`/ludoteca/admin/members`)
- **Contenido** → Resincronizar contenido (`/ludoteca/admin/content`)

Tu nombre y el botón **Cerrar sesión** aparecen en la cabecera. Si abres
una página de administración sin permisos verás "Acceso restringido".

## 2. Gestión de socios (Administración → Miembros)

Es la página principal de administración. Muestra una tabla con todos los
socios y sus datos básicos.

### La tabla

Columnas: **Nombre**, **Email**, **Nº Socio**, **Estado** (Activo /
Desactivado), **Préstamos activos** y **Acciones**. Puedes ordenar por
cualquier columna haciendo clic en su cabecera (clic de nuevo para
invertir el orden).

### Acciones por socio

- **Activar / Desactivar** — activa o desactiva la cuenta del socio.
  Útil cuando alguien deja de estar al día con la cuota o se da de baja.
- **Enviar enlace de acceso** — genera un enlace para que el socio
  establezca (o restablezca) su contraseña. Si el envío de correo está
  configurado, le llega por email y verás "Correo enviado a…". Si no,
  la página muestra el enlace con un botón **Copiar** para que se lo
  hagas llegar tú (WhatsApp, email manual, etc.). El enlace caduca a las
  48 horas y solo sirve una vez.
- **Editar** — abre un diálogo para actualizar dos campos: **Última
  cuota** (fecha del último pago, texto libre, p. ej. `5/02/2022`) y
  **Género**. Estos dos campos alimentan la página pública de validación
  de socios (ver sección 5), así que conviene mantenerlos al día. El
  resto de datos (nombre, email, teléfono…) no se editan aquí: se
  actualizan reimportando el CSV.

### Crear un socio

El botón **Crear socio** abre un formulario. Campos obligatorios:
**Nombre**, **Apellidos** y **Email**. Opcionales: Apodo, Teléfono,
Nº Socio, Última cuota y Género.

Al guardar, la página muestra el **enlace de acceso** del nuevo socio con
un botón **Copiar**. Envíaselo para que establezca su contraseña y pueda
entrar. Si el email ya existe, el sistema lo rechaza (no se duplican
socios).

### Importar socios desde CSV

El botón **Importar CSV** permite subir la exportación en CSV de la hoja
de cálculo de socios. La primera fila debe ser exactamente esta cabecera:

```
Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin,Última cuota,Género
```

Reglas de la importación:

- Las filas sin **Email** se omiten.
- Si el email ya existe, **se actualizan los datos** del socio (no se
  duplica). Reimportar el CSV completo es la forma habitual de corregir
  nombres, teléfonos, cuotas, etc.
- Los **socios nuevos** reciben un enlace para establecer su contraseña;
  la página los lista tras la importación, cada uno con su botón
  **Copiar**.
- La columna `admin` con valor `yes` marca al socio como administrador.

El botón **?** junto a "Importar CSV" abre esta misma ayuda dentro de la
aplicación, con un botón **Descargar CSV de ejemplo**.

### Flujo típico de alta de un socio

1. Crear el socio (formulario o importación CSV).
2. Copiar o enviar su enlace de acceso.
3. El socio abre el enlace, establece su contraseña y ya puede iniciar
   sesión y pedir préstamos.

## 3. Préstamos

Los préstamos se gestionan desde el catálogo, no desde una página de
administración:

- Cualquier socio con sesión iniciada puede pulsar **Solicitar préstamo**
  en la ficha de un juego disponible, y devolver **sus propios**
  préstamos desde la ficha del juego o desde **Mis préstamos**.
- Como administrador, en la ficha de cualquier juego prestado verás el
  botón **Devolver** aunque el préstamo no sea tuyo. Es la forma de
  registrar la devolución cuando un socio entrega un juego en el local.
- La columna **Préstamos activos** de la tabla de socios te dice cuántos
  juegos tiene cada socio en préstamo en ese momento.

Cada juego solo puede tener un préstamo activo a la vez; mientras está
prestado, la ficha muestra quién lo tiene.

## 4. Resincronizar contenido (Administración → Contenido)

Las páginas informativas de la web (calendario, eventos, FAQ, etc.) se
editan en **Google Sites**, como siempre. El servidor guarda una copia
("mirror") de esas páginas y es esa copia la que ven los visitantes.

Esta página sirve para actualizar la copia bajo demanda:

- Pulsa **Iniciar resync** después de editar algo en Google Sites y que
  quieras publicar ya (además, hay una sincronización automática cada
  noche).
- El bloque de estado muestra cuándo empezó y terminó la última
  sincronización y cuántos eventos generó. El **Log** muestra el progreso
  en directo (páginas descargadas, imágenes, avisos, errores). Si aparece
  "Ya hay una sincronización en marcha", espera a que termine la que está
  en curso.

**Importante:** el resync actualiza la web en vivo inmediatamente, pero
los cambios no quedan guardados en el repositorio de código. Si el
proyecto se redespliega desde cero, se perderían. Avisa a la persona que
mantiene el código para que los persista (ejecuta el scraper en local y
hace commit).

## 5. Validación de socios (página pública)

En `/ludoteca/validacion` (también accesible desde los códigos QR
impresos) cualquiera puede introducir un número de socio y ver si esa
persona **ES** o **NO ES** socio·a, junto con la fecha de su última cuota.

No es una página de administración, pero se alimenta de los datos que tú
mantienes: el **Nº Socio**, la **Última cuota** y el **Género** de la
ficha de cada socio. Si la validación muestra datos desfasados, actualiza
la ficha desde Gestión de socios (botón **Editar**) o reimporta el CSV.

## 6. Qué NO se puede hacer desde la web

- **Editar el catálogo de juegos.** Los juegos de mesa y de rol se cargan
  por línea de comandos a partir de la colección de BoardGameGeek; no hay
  pantalla para añadir, editar o borrar juegos. Pide los cambios a la
  persona que mantiene el código.
- **Cambiar nombre, email o teléfono de un socio** desde el botón Editar
  (solo cambia Última cuota y Género). Para el resto de datos, corrige la
  hoja de cálculo de socios y reimporta el CSV.
- **Nombrar administradores** desde la web (ver sección 1).
- **Borrar socios.** Usa **Desactivar** para retirar el acceso.

## 7. Problemas frecuentes

- **Un socio no puede entrar** → usa **Enviar enlace de acceso** para que
  restablezca su contraseña. También existe la página "¿Has olvidado tu
  contraseña?" en la pantalla de inicio de sesión.
- **El enlace de acceso "no funciona"** → probablemente caducó (48 h) o
  ya se usó. Genera uno nuevo con **Enviar enlace de acceso**.
- **La importación dice "filas omitidas"** → esas filas no tenían email.
  Complétalo en la hoja de cálculo y reimporta.
- **He editado Google Sites y la web no cambia** → lanza un resync desde
  Administración → Contenido, o espera a la sincronización nocturna.
