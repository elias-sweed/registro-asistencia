# Registro de Asistencia · Practicantes

Aplicación web (React + TypeScript + Vite + Tailwind + Supabase) para registrar la
asistencia de los practicantes de una Institución Educativa.

## Flujo

1. **Login** — se exige correo electrónico y contraseña (con botón para ver/ocultar la clave).
   Si es la primera vez, se crea la cuenta.
2. **Ingreso** — la cuenta se crea con correo, contraseña y repetir contraseña. No hay
   confirmación por correo: al crear la cuenta ya entra al sistema.
3. **Modal de bienvenida** — al entrar se muestra un modal de carga con un tablero de letras
   por ~2.6 s.
4. **Formulario** — nombres, apellidos, programa/rol, ciclo, turno (Mañana o Tarde) y fecha y
   hora automáticas.

| Programa / Rol | Ciclos           |
| -------------- | ---------------- |
| SENATI         | 1 al 6           |
| UCV            | 1 al 10          |
| Docente API    | no aplica        |

Elige tu turno: **Mañana** o **Tarde**. No hay restricción de hora: se puede marcar a cualquier
momento y la fecha y hora se toman automáticamente al registrar.
5. **Diapositiva de confirmación** — para registrar hay que arrastrar el control
   **«Desliza para registrar»** hasta el extremo (o con las flechas del teclado y `Fin`).
   Muestra el spinner mientras guarda y un check dorado al terminar.
6. **Celebración** — al confirmar se abre un cartel con el texto ASCII **«BIEN HECHO»**
   (WebGL, se inclina hacia el cursor, se desarma al pasar por encima y hace ondas al hacer
   clic), el nombre del practicante y el programa. Se cierra a los 7 s, con `Esc` o al pulsar
   fuera.
7. **Toast** — al guardar aparece `Asistencia registrada {nombres}`.

## Una sola asistencia por cuenta y navegador

La asistencia se registra **una sola vez**. No hay bloqueo por IP: varios practicantes
compartiendo el mismo wifi pueden marcar sin problema.

1. Ejecuta `supabase/por-cuenta.sql` en el SQL Editor. Crea `public.registros_realizados`
   con una fila por cuenta y **migra los registros que ya existían**.
2. La función `registrar_asistencia()` valida contra esa tabla y lanza `YA_REGISTRADO` si la
   cuenta ya marcó.
3. En el navegador, `localStorage` guarda que ese navegador ya registró, así que el
   formulario se bloquea al instante.

Cuando el bloqueo se activa (por navegador o porque la cuenta ya tiene registro en la base,
aunque entres desde otro navegador) aparece un **modal rojo con la palabra ERROR** y el botón
**Volver al inicio** cierra la sesión y regresa al login.

### Horario

No hay restricción de hora. La fecha y hora se toman automáticamente en el momento del
registro, sin importar el turno ni la franja del día.

Todos los campos son obligatorios y se validan en el cliente y en la base de datos.

## Panel de administrador

`/admin` muestra el control de la asistencia. Si no hay sesión abierta, esa misma pantalla
pide el correo y la contraseña del administrador.

- **Tarjetas:** cuentas creadas, ya marcaron, sin marcar y las que marcaron hoy.
- **Gráficos interactivos:** todos se pueden apagar y encender con un clic, tanto en la
  figura como en su leyenda. Al ocultar elementos los porcentajes se recalculan sobre lo
  que queda visible, y aparece un enlace para volver a mostrarlos.
  - *Marcaron vs. sin marcar* y *Cuentas por programa* (donas con separación entre porciones).
  - *Cuentas por ciclo* (barras, con «3 de 5 marcaron»).
  - *Asistencia por turno* (barras, una por turno).
  - *Registros por día* (columnas, el día más reciente va resaltado).
- **Avance por programa:** una barra por programa con cuántos marcaron de cuántos son.
- **Tabla** con filtros *Estado* (Todos / Marcaron / Sin marcar) y *Día de la asistencia*
  (Hoy / Ayer / Antes de ayer / Últimos 7 días / Todo), cada opción con su contador.
  Muestra el nombre del practicante con su correo debajo, programa, ciclo, turno, estado,
  cuándo creó su cuenta y cuándo marcó asistencia. Las fechas se leen de un vistazo
  («Hoy · 09:15», «Ayer · 08:02») y usan la hora de **Lima**.
- **Dock inferior** para saltar a cada sección, actualizar y salir.

Las tarjetas y paneles del panel de administrador usan las clases `.panel-admin` y
`.panel-admin-fuerte`, más oscuras y difuminadas que las de las pantallas de acceso para que
las cifras se lean sin ruido de fondo.

### Configurar el acceso

1. Crea el usuario en **Supabase → Authentication → Users** (marca *Auto Confirm User*).
2. Ejecuta `supabase/admin.sql` en el SQL Editor.
3. Ejecuta `supabase/admin-arreglo.sql` (deja la comparación de correos sin distinguir
   mayúsculas) y revisa la consulta del final: **tu correo tiene que aparecer en la lista**.
4. Si no aparece, da de alta al administrador descomentando el bloque del punto 2:

```sql
insert into public.administradores (correo, nombre) values
  ('tucorreo@ie.edu.pe', 'Coordinador')
on conflict (correo) do update set activo = true, nombre = excluded.nombre;
```

Solo esos correos pueden ver el panel. Si un administrador entra por `/login` es enviado
automáticamente al dashboard, y nunca ve el formulario de asistencia.

Si una cuenta existe pero no tiene acceso, `/admin` lo explica y permite cambiar de cuenta sin
salir de la página.

## Estilo

Tema **negro vintage premium** con textura de papel, detalles en oro y tipografía
**Playfair Display** (títulos) + **Lora** (texto). El escudo se usa en
`src/assets/logo/logo.png` y el fondo de todas las pantallas es
`src/assets/fondo/bosqueTenue.jpg` con un velo oscuro encima. Las clases
`.fondo-ie`, `.velo-ie`, `.panel-vidrio`, `.campo-flotante` y `.etiqueta-flotante`
están en `src/index.css`.

## 1. Crear las tablas

Abre **Supabase → SQL Editor → New query**, pega el contenido de
[`supabase/schema.sql`](./supabase/schema.sql) y ejecuta con **Run**.

> Si ya habías ejecutado la versión anterior (ciclos I–IV), usa en su lugar
> [`supabase/migracion-programas.sql`](./supabase/migracion-programas.sql), que convierte los
> ciclos a números y agrega el campo `programa` conservando los registros existentes.

Crea:

| Tipo       | Uso                                    |
| ---------- | -------------------------------------- |
| `programa` | enum `SENATI`, `UCV`, `DOCENTE_API`    |
| `turno`    | enum `MANANA`, `TARDE`                  |
| `practicantes` | perfil del practicante (se crea sola al registrarse) |
| `asistencias`  | los registros de asistencia        |
| `vista_asistencias` | vista de control (solo `service_role`) |

El script además activa **Row Level Security**: cada practicante solo puede leer y escribir
sus propios registros.

## 2. Configurar Supabase

### 2.1 Autenticación

**Supabase → Authentication → Providers → Email**:

- **Desactiva «Confirm email»**. Así la cuenta queda activa al instante al crearla.

El registro es solo **correo + contraseña + repetir contraseña**. Sin correos, sin enlaces y
sin pantallas de espera: al crear la cuenta el practicante entra directo al formulario.

En **Authentication → URL Configuration** agrega tu dominio en *Redirect URLs*
(por ejemplo `https://tu-app.vercel.app/**`).

### 2.2 Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto (copia `.env.example`):

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

Los valores están en **Supabase → Project Settings → API**.

## 3. Ejecutar

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build de producción
npm run preview  # vista previa del build
npm run lint     # eslint
```

Si faltan las variables de entorno, la aplicación muestra una pantalla indicando qué
configurar.

## Estructura

```
src/
  assets/logo/logo.png           escudo de la I.E.
  components/BienvenidaModal.tsx modal de bienvenida
  components/ASCIIText.tsx        texto ASCII WebGL (React Bits)
  components/CelebracionRegistro.tsx cartel al registrar
  components/FuzzyText.tsx      texto vibrador (React Bits)
  components/Graficos.tsx      dona, barras y columnas del panel
  components/ModalBloqueo.tsx  modal rojo de error (IP repetida / fuera de horario)
  components/SplitFlapText.tsx    tablero de letras (React Bits)
  components/CampoClave.tsx      contraseña con ver/ocultar
  components/Escudo.tsx          escudo y ornamentos
  components/Dock.tsx            dock macOS del panel de administrador
  components/SlideCommit.tsx    control deslizante de confirmación (React Bits)
  components/Toast.tsx           notificaciones
  context/                       sesión de Supabase
  lib/                           cliente Supabase, validacion, constantes y fechas
  pages/Login.tsx                acceso con correo y contraseña
  pages/Registro.tsx             formulario de asistencia
  pages/Admin.tsx                panel de control
  pages/AccesoAdmin.tsx          acceso al panel
  pages/SinConfigurar.tsx        aviso si falta el .env
supabase/schema.sql                script de creación de tablas
supabase/migracion-programas.sql   migración de ciclos I-IV a programas SENATI/UCV/Docente API
supabase/por-cuenta.sql            un solo registro por cuenta (sin bloqueo por IP)
supabase/turnos.sql                agrega el turno MANANA y el parámetro p_turno al RPC
supabase/admin.sql                 panel de administrador
supabase/admin-arreglo.sql         acceso al panel sin distinguir mayúsculas + comprobación
```

## Instalar los scripts de la base de datos

En **Supabase → SQL Editor**, ejecuta en este orden:

1. `supabase/schema.sql` (solo si la base está vacía)
2. `supabase/migracion-programas.sql` (solo si venías de la versión con ciclos I–IV)
3. `supabase/por-cuenta.sql`
4. **`supabase/turnos.sql`** ← obligatorio para poder elegir Mañana o Tarde
5. `supabase/admin.sql`
6. **`supabase/admin-arreglo.sql`** ← revisa que tu correo aparezca en la lista del final