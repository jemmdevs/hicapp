# HicApp - Aplicación de Seguimiento de Asistencia

HicApp es una aplicación web para el seguimiento de asistencia mediante códigos QR. Permite a los profesores crear clases y registrar la asistencia de los estudiantes a través de códigos QR únicos generados para cada estudiante.

## Características

- **Panel de administración para profesores**: Crear y gestionar clases, ver estadísticas de asistencia.
- **Registro y login de estudiantes**: Los estudiantes pueden crear cuentas y unirse a clases.
- **Códigos QR**: Los estudiantes generan códigos QR únicos para registrar su asistencia.
- **Lector de QR**: Los profesores escanean los códigos QR de los estudiantes para registrar su asistencia.
- **Estadísticas de asistencia**: Ver porcentajes de asistencia por clase y estudiante.

## Tecnologías

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: API Routes de Next.js
- **Base de datos**: MongoDB
- **Autenticación**: NextAuth.js
- **Códigos QR**: html5-qrcode (lectura), qrcode.react (generación)

## Requisitos previos

- Node.js 18.0 o superior
- MongoDB (local o remoto)

## Instalación

1. Clona el repositorio:
   ```
   git clone https://github.com/tu-usuario/hicapp.git
   cd hicapp
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Crea un archivo `.env.local` con las siguientes variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/hicapp
   NEXTAUTH_SECRET=tu-clave-secreta-para-nextauth
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Ejecuta el script de seed para crear la cuenta de profesor por defecto:
   ```
   npm run seed
   ```

5. Inicia el servidor de desarrollo:
   ```
   npm run dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Profesor
- Email: monroyprofesor@gmail.com
- Contraseña: monroyprofesor

1. Inicia sesión como profesor.
2. Crea una nueva clase desde el panel de administración.
3. Para registrar asistencia, selecciona la clase y haz clic en "Registrar asistencia".
4. Escanea los códigos QR de los estudiantes.

### Estudiante
1. Regístrate como nuevo estudiante.
2. Únete a una o varias clases.
3. Genera tu código QR de asistencia para cada clase.
4. Muestra tu código QR al profesor para registrar tu asistencia.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
