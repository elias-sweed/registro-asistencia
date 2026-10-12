# Registro de Asistencia · Practicantes

Aplicación web (React + TypeScript + Vite + Tailwind + Supabase) para registrar la
asistencia de los practicantes de una Institución Educativa.

## Flujo

1. **Login** — se exige correo electrónico y contraseña (con botón para ver/ocultar la clave).
   Si es la primera vez, se crea la cuenta.
2. **Confirmación por correo** — al crear la cuenta se guarda el correo y la contraseña en la
   pestaña y se muestra la pantalla «¡Cuenta creada!» con el enlace que llegó a Gmail.
   Al confirmar el correo, Supabase devuelve al usuario a la aplicación ya con la sesión iniciada.
3. **Modal de bienvenida** — al entrar se muestra un modal de carga con «¡Que tengas excelente día!»
   por ~2.6 s.
4. **Formulario** — nombres, apellidos, programa/rol, ciclo, turno y fecha y hora
   automáticas, más la casilla obligatoria «Asistió y marcó».

   | Programa / Rol | Ciclos           |
   | -------------- | ---------------- |
   | SENATI         | 1 al 6           |
   | UCV            | 1 al 10          |
   | Docente API    | no aplica        |
5. **Diapositiva de confirmación** — para registrar hay que arrastrar el control
   **«Desliza para registrar»** hasta el extremo (o con las flechas del teclado y `Fin`).
   Muestra el spinner mientras guarda y un check dorado al terminar.
6. **Celebración** — al confirmar se abre un cartel con el texto ASCII **«BIEN HECHO»**
   (WebGL, se inclina hacia el cursor, se desarma al pasar por encima y hace ondas al hacer
   clic), el nombre del practicante y el programa. Se cierra a los 7 s, con `Esc` o al pulsar
   fuera.
7. **Toast** — al guardar aparece `Asistencia registrada {nombres}`. Tras confirmar la cuenta
   por correo se muestra además `¡Cuenta creada con éxito! Bienvenido {correo}`.

## Una sola asistencia por dispositivo

El bloqueo se aplica **en la base de datos**, no en el navegador: aunque el practicante cree
otra cuenta con otro correo o abra la página en otro navegador, desde la misma conexión solo
se acepta un registro.

1. Ejecuta `supabase/ip-unica.sql` en el SQL Editor.
2. El navegador obtiene la IP pública (`api.ipify.org`, 4 s de espera) y la envía a la función
   `registrar_asistencia()`.
3. La función guarda la IP en `public.registros_ip`; si ya existe, lanza `IP_YA_REGISTRADA`
   y sale un **modal rojo** con la palabra **ERROR** en `FuzzyText` y la IP usada.

### Horario por turno

El **turno Tarde** solo puede marcar a partir de las **12:00**, usando la hora del
dispositivo (`new Date().getHours()`). Si alguien selecciona Tarde antes de las 12, el
registro se rechaza en el navegador y también en la base de datos (la función recibe
`p_hora` y lanza `FUERA_DE_HORARIO`). El modal explica la regla y muestra la hora actual del
equipo.

### Recomendacion para el bloqueo por IP

La clave es la IP, no el dispositivo. En la práctica:

- **Datos móviles** → cada celular tiene IP propia, funciona bien.
- **Wi-Fi del colegio** → varios practicantes comparten IP y solo uno podría registrar.

Si ese es tu caso, lo más limpio es una **tabla de IPs de la institución exentas** del
bloqueo, en vez de cambiar la clave por `ip + correo` (que sí se puede esquivar cambiando de
correo).

> **Atención:** la clave es la IP, no el dispositivo. Varios practicantes detrás del mismo
> router (mismo laboratorio o el mismo wifi del colegio) comparten IP, y solo uno podría
> registrar. Si en tu institución elaluzgar por red es el caso, hay que cambiar la clave de
> `registros_ip` (por ejemplo a `ip + correo`) o pasar la detección a una Edge Function con
> huellas del navegador.

Todos los campos son obligatorios y se validan en el cliente y en la base de datos.

## Estilo

Tema **negro vintage premium** con textura de papel, detalles en oro y tipografía
**Playfair Display** (títulos) + **Lora** (texto). El escudo se usa en
`src/assets/logo/logo.png` y de fondo hay un lienzo WebGL con **rayos de luz dorados**
(`LightRays` de React Bits, sobre `ogl`).

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

- Deja activado **«Confirm email»** para que el practicante valide su cuenta desde Gmail.
- Configura un SMTP propio (opcional pero recomendado) para que los correos no lleguen al
  buzón de pruebas de Supabase, que solo permite unos pocos envíos por hora.

En **Authentication → URL Configuration** agrega `http://localhost:5173` en *Site URL* y en
*Redirect URLs*: así, al confirmar el correo desde Gmail el usuario vuelve a la aplicación.

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
  components/ModalBloqueo.tsx  modal rojo de error (IP repetida / fuera de horario)
  components/SplitFlapText.tsx    tablero de letras (React Bits)
  components/CampoClave.tsx      contraseña con ver/ocultar
  components/Escudo.tsx          escudo y ornamentos
  components/FondoRayos.tsx     fondo WebGL con rayos de luz
  components/LightRays.tsx      rayos (React Bits)
  components/SlideCommit.tsx    control deslizante de confirmación (React Bits)
  components/Toast.tsx           notificaciones
  context/                       sesión de Supabase
  lib/cuentaPendiente.ts         cuenta recién creada por confirmar
  lib/                           cliente Supabase, tipos y constantes
  pages/Login.tsx                acceso con correo y contraseña
  pages/Registro.tsx             formulario de asistencia
  pages/SinConfigurar.tsx        aviso si falta el .env
supabase/schema.sql                script de creación de tablas
supabase/migracion-programas.sql   migración de ciclos I-IV a programas SENATI/UCV/Docente API
supabase/ip-unica.sql              bloqueo de un registro por IP
```