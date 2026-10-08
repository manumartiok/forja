# FORJA

App de entrenamiento con mecánicas de videojuego: cada serie, kilómetro y minuto de movilidad da experiencia (XP). Con eso subís de nivel, mejorás atributos, desbloqueás habilidades y cumplís misiones. Sirve para gimnasio, calistenia, cardio, HIIT y movilidad/yoga.

## Cómo usarla

Requiere Node.js 18 o superior. No hay dependencias que instalar.

```bash
node server.js       # o doble clic en iniciar.bat
```

Después abrí <http://localhost:4000>.

La app funciona sin conexión y se puede **instalar en el celular**: en Chrome, menú → "Instalar app" o "Agregar a la pantalla principal".

## Mecánicas

- **XP por serie:** depende de la carga relativa a tu peso corporal, las repeticiones y la dificultad del ejercicio. También dan XP los segundos de isométricos, los minutos de cardio y de movilidad, los récords personales y completar la sesión.
- **Niveles y rangos:** Hierro → Bronce → Plata → Oro → Platino → Diamante → Mítico. El emblema del personaje suma estrellas, alas y corona a medida que subís de rango.
- **Clase:** depende del atributo que más entrenás: Titán (fuerza), Corredor (resistencia), Monje (movilidad), Acróbata (agilidad) o Guerrero (equilibrado).
- **Atributos:** Fuerza, Resistencia, Movilidad, Agilidad y Constancia. Cada uno tiene su propio nivel.
- **Habilidades:** 16 árboles con 92 nodos, por ejemplo de la primera flexión a la flexión a una mano, de colgarse de la barra al muscle-up, del pino contra la pared al front lever, de levantar medio peso corporal en banca a 1,5 veces, o de correr 1 km a una maratón. Se desbloquean solas cuando registrás la marca, y si lográs una avanzada, las anteriores del árbol cuentan por mérito.
- **Misiones:** 3 diarias y 3 semanales, elegidas según tus disciplinas y ajustadas a tu experiencia.
- **Racha:** semanas seguidas cumpliendo tu objetivo de días de entrenamiento. Se cuenta por semanas para que los días de descanso no la corten.
- **Logros:** 27 medallas.

## Control corporal

- Registro de peso, % de grasa y medidas (cintura, pecho, brazo), con gráfico de evolución y línea de peso objetivo.
- IMC, metabolismo basal y gasto diario estimado (fórmula de Mifflin-St Jeor).
- Estadísticas de entrenamiento: entrenamientos por semana, mapa de actividad, evolución de cada ejercicio (1RM estimado, repeticiones, tiempos, distancia y ritmo), récords e historial completo.

## Tus datos

Todo se guarda **solo en el navegador del dispositivo** (localStorage): no hay cuentas ni servidor. Desde **Perfil → Tus datos** podés exportar una copia en JSON e importarla en otro dispositivo.

## Publicarla gratis (GitHub Pages)

La carpeta `docs/` es la app completa (archivos estáticos):

1. Subí el repositorio a GitHub.
2. Andá a **Settings → Pages → Build and deployment**, elegí la rama `main` y la carpeta `/docs`, y guardá.
3. En uno o dos minutos queda publicada en `https://<usuario>.github.io/<repo>/`.

Si después cambiás archivos de la app, subí también la versión de la caché en `docs/sw.js` (`forja-v1` → `forja-v2`) para que los dispositivos que ya la tienen instalada se actualicen.

## Pruebas

```bash
npm test     # motor del juego: XP, niveles, récords, habilidades, misiones, rachas
```

## Estructura

```
docs/                    la app (se publica tal cual)
  index.html, sw.js, manifest.webmanifest, icons/, css/styles.css
  js/app.js              arranque y navegación
  js/engine.js           motor: XP, niveles, récords, habilidades, misiones, logros, rachas
  js/store.js            guardado local, exportar e importar
  js/actions.js          acciones (terminar entrenamiento, registrar peso, etc.)
  js/data/               ejercicios, árboles de habilidades, misiones, logros y rutinas
  js/views/              pantallas
server.js                servidor local para usarla en la PC
test/engine.test.js      pruebas del motor
```
