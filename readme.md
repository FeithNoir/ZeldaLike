# Mini Aventura Zelda-like Web 🎮

Un pequeño proyecto web que recrea la sensación básica de un nivel de aventura 2D inspirado en clásicos como "The Legend of Zelda: A Link to the Past" de SNES, utilizando únicamente tecnologías web estándar (HTML, CSS y JavaScript).

<!-- ![Gameplay GIF/Screenshot](link_to_image.png) -->
*(Aquí iría genial una captura de pantalla o un GIF animado del juego en acción)*

## ✨ Características Implementadas

*   **Movimiento del Jugador:** Control del personaje en 4 direcciones (con soporte diagonal) usando teclado (Flechas y WASD).
*   **Ataque:** Ataque de barrido con espada pulsando la barra espaciadora.
*   **Sistema de Vidas (HP):** El jugador tiene 3 corazones y pierde vida al tocar enemigos. Incluye un breve periodo de invencibilidad visual (parpadeo) tras recibir daño.
*   **Enemigos:** Entidades enemigas con diferentes patrones de movimiento:
    *   Movimiento horizontal/vertical simple con rebote.
    *   Persecución (`chase`) al jugador dentro de un rango.
    *   Patrulla en cuadrado (`square_patrol`).
*   **Combate Básico:** Derrota enemigos golpeándolos con la espada.
*   **Múltiples Salas:** El juego se estructura en diferentes "salas" o niveles definidos en código.
*   **Transiciones entre Salas:** Efecto de fundido (fade) al pasar de una sala a otra.
*   **Objetos Interactuables:** Posibilidad de recoger objetos (ej: Llave 🔑).
*   **Puertas Bloqueadas:** Puertas que requieren tener la llave para poder abrirlas e interactuar para pasar a la siguiente sala.
*   **HUD Simple:** Interfaz básica que muestra los puntos de vida (HP) restantes y si se posee la llave.
*   **Colisiones:** Detección de colisiones entre:
    *   Jugador y obstáculos/paredes (con intento de deslizamiento).
    *   Jugador y enemigos (para recibir daño).
    *   Espada y enemigos (para infligir daño).
    *   Jugador y objetos/puertas (para interacción).
*   **Estado de Juego:** Implementación de estados básicos como "Game Over" y "Victoria".

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Para la estructura básica de la página y los elementos del juego.
*   **CSS3:** Para el estilo visual, posicionamiento, animaciones básicas (ataque, parpadeo) y la transición de fundido.
*   **JavaScript (ES6+):** Para toda la lógica del juego, incluyendo:
    *   Manejo del estado del juego (posición, HP, inventario).
    *   Bucle principal del juego (`requestAnimationFrame`).
    *   Manejo de input del teclado.
    *   Detección de colisiones.
    *   Movimiento de entidades (jugador y enemigos).
    *   Generación dinámica de niveles (obstáculos, enemigos, puertas).
    *   Lógica de interacción.

## ⚙️ Cómo Jugar Localmente

1.  **Clona o descarga el repositorio:**
    ```bash
    git clone https://github.com/FeithNoir/nombre-del-repositorio.git
    # o descarga el ZIP
    ```
2.  **Navega a la carpeta del proyecto:**
    ```bash
    cd nombre-del-repositorio
    ```
3.  **Abre el archivo `index.html`** en tu navegador web preferido (Firefox, Chrome, Edge, etc.).

¡Y listo para jugar!

## ⌨️ Controles

*   **Flechas Arriba/Abajo/Izquierda/Derecha** o **W/S/A/D**: Mover al jugador.
*   **Barra Espaciadora**: Atacar con la espada.
*   **E**: Interactuar con objetos cercanos (recoger llaves, abrir puertas).

**Objetivo:** Explora las salas, encuentra la llave y úsala para abrir la puerta bloqueada y avanzar. ¡Evita o derrota a los enemigos para sobrevivir!

## 🚀 Cosas por Implementar (To-Do)

*   [ ] **Gráficos con Sprites:** Reemplazar los bloques de color por imágenes de sprites para un look más auténtico.
*   [ ] **Sonido:** Añadir efectos de sonido (ataque, golpe, recoger objeto, música de fondo).
*   [ ] **Más Tipos de Enemigos:** Con IA más compleja (patrullas definidas, ataques a distancia, etc.).
*   [ ] **Más Items e Inventario:** Bombas, arco, rupias (moneda), etc., y un sistema para gestionarlos.
*   [ ] **Puzzles Simples:** Mecanismos activados por interruptores, bloques que empujar, etc.
*   [ ] **Jefes (Bosses):** Enemigos más grandes y complejos al final de ciertas secciones.
*   [ ] **Sistema de Guardado/Carga:** Persistencia del progreso del jugador (usando `localStorage`, por ejemplo).
*   [ ] **Mapa Desplazable (Scrolling):** En lugar de salas estáticas, un mapa más grande por el que la cámara se mueva.
*   [ ] **Refactorización:** Organizar el código JavaScript en Clases (Player, Enemy, Game, Level) para mejor mantenibilidad.
*   [ ] **Mejoras en Colisiones:** Sistema de colisiones más preciso, especialmente en esquinas y con múltiples objetos.
*   [ ] **Arreglo de errores:** Solucionar algunos bugs que puedan surgir.
*   [ ] **Menú Principal y Pausa.**

## 👤 Autor

*   **Feith Noir**
*   **GitHub:** [FeithNoir](https://github.com/FeithNoir)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles (si existiera, si no, puedes añadir esta línea simplemente).