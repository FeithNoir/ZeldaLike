document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos del DOM ---
  const player = document.getElementById("player");
  const sword = document.getElementById("sword");
  const gameContainer = document.getElementById("game-container");
  const levelElementsContainer = document.getElementById("level-elements");
  const messageArea = document.getElementById("message-area");
  const hudHp = document.getElementById("hud-hp");
  const hudKey = document.getElementById("hud-key");
  const fadeOverlay = document.getElementById("fade-overlay");

  // --- Constantes del Juego ---
  const PLAYER_SPEED = 2.5;
  const PLAYER_WIDTH = player.offsetWidth;
  const PLAYER_HEIGHT = player.offsetHeight;
  const PLAYER_MAX_HP = 3;
  const INVINCIBILITY_DURATION = 1200;
  const BLINK_INTERVAL = 150;
  const ATTACK_DURATION = 250;
  const ENEMY_HIT_DURATION = 150;
  const INTERACTION_RANGE = 15;
  const FADE_TIME = 400;

  // --- Estado del Juego ---
  let playerX = 50;
  let playerY = 50;
  let playerHP = PLAYER_MAX_HP;
  let facing = "down";
  let isAttacking = false;
  let attackTimeout = null;
  let interactionTarget = null;
  let currentRoomIndex = 0;
  let enemies = [];
  let obstacles = [];
  let doors = [];
  let hasKey = false;
  let isInvincible = false;
  let invincibilityTimer = null;
  let blinkIntervalTimer = null;
  let isTransitioning = false;
  let gameOver = false;

  // --- Estado de Controles (¡IMPORTANTE!) ---
  const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
  };

  // --- Límites del Contenedor ---
  const containerWidth = gameContainer.offsetWidth;
  const containerHeight = gameContainer.offsetHeight;

  // --- Definiciones de Salas ---
  const roomLayouts = [
    {
      // Sala 0: Inicio con llave y puerta bloqueada
      playerStart: { x: 50, y: 50 },
      obstacles: [
        { x: 150, y: 100, w: 100, h: 20 },
        { x: 50, y: 250, w: 20, h: 100 },
        { x: 300, y: 200, w: 20, h: 150 },
        // Bordes como obstáculos
        { x: 0, y: 0, w: containerWidth, h: 10 }, // Top
        { x: 0, y: containerHeight - 10, w: containerWidth, h: 10 }, // Bottom
        { x: 0, y: 0, w: 10, h: containerHeight }, // Left
        { x: containerWidth - 10, y: 0, w: 10, h: containerHeight }, // Right
      ],
      enemies: [
        { x: 250, y: 150, hp: 1, pattern: "horizontal", speed: 1, range: 50 },
        { x: 400, y: 300, hp: 1, pattern: "chase", speed: 0.8, range: 150 },
      ],
      interactables: [
        {
          id: "key1",
          type: "key",
          x: 450,
          y: 50,
          info: "¡Has encontrado una vieja llave! 🔑",
        },
      ],
      doors: [
        {
          x: containerWidth - 70,
          y: 10,
          w: 50,
          h: 15,
          targetRoomIndex: 1,
          locked: true,
        },
      ],
    },
    {
      // Sala 1: Más enemigos y puerta de salida
      playerStart: { x: 50, y: containerHeight - PLAYER_HEIGHT - 30 },
      obstacles: [
        { x: 100, y: 100, w: 20, h: 250 },
        { x: 120, y: 100, w: 150, h: 20 },
        { x: 400, y: 50, w: 20, h: 150 },
        { x: 300, y: 300, w: 150, h: 20 },
        // Bordes
        { x: 0, y: 0, w: containerWidth, h: 10 },
        { x: 0, y: containerHeight - 10, w: containerWidth, h: 10 },
        { x: 0, y: 0, w: 10, h: containerHeight },
        { x: containerWidth - 10, y: 0, w: 10, h: containerHeight },
      ],
      enemies: [
        { x: 150, y: 150, hp: 1, pattern: "vertical", speed: 1.5, range: 80 },
        {
          x: 350,
          y: 250,
          hp: 1,
          pattern: "square_patrol",
          speed: 1,
          range: 60,
        },
        { x: 250, y: 400, hp: 1, pattern: "chase", speed: 0.7, range: 120 },
      ],
      interactables: [],
      doors: [
        {
          x: containerWidth - 20,
          y: containerHeight / 2 - 25,
          w: 15,
          h: 50,
          targetRoomIndex: 2,
          locked: false,
        },
      ],
    },
    {
      // Sala 2: Sala "Has ganado"
      playerStart: {
        x: containerWidth / 2 - PLAYER_WIDTH / 2,
        y: containerHeight / 2 - PLAYER_HEIGHT / 2,
      },
      obstacles: [
        /* Podrías añadir bordes si quieres */
      ],
      enemies: [],
      interactables: [],
      doors: [],
    },
  ];

  // --- Funciones Auxiliares ---
  function showMessage(text, duration = 3000) {
    messageArea.textContent = text;
    messageArea.style.display = "block";
    if (duration > 0) {
      // Usar un temporizador específico para este mensaje
      const timerId = setTimeout(() => {
        // Solo ocultar si el mensaje NO ha cambiado mientras tanto
        if (messageArea.textContent === text) {
          hideMessage();
        }
      }, duration);
      // Guardar referencia al timer por si necesitamos cancelarlo
      messageArea.dataset.timerId = timerId;
    } else {
      // Si la duración es 0, borrar cualquier timer anterior
      clearTimeout(messageArea.dataset.timerId);
      messageArea.dataset.timerId = "";
    }
  }

  function hideMessage() {
    clearTimeout(messageArea.dataset.timerId); // Limpiar timer si existe
    messageArea.dataset.timerId = "";
    messageArea.style.display = "none";
    messageArea.textContent = "";
  }
  function getBoundingBox(element) {
    if (!element || !element.parentNode) return null;
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      w: element.offsetWidth,
      h: element.offsetHeight,
    };
  }
  function checkCollision(box1, box2) {
    if (!box1 || !box2) return false;
    return (
      box1.x < box2.x + box2.w &&
      box1.x + box1.w > box2.x &&
      box1.y < box2.y + box2.h &&
      box1.y + box1.h > box2.y
    );
  }

  // --- Actualizar HUD ---
  function updateHUD() {
    /* ... (igual que antes) ... */
  }

  // --- Daño al Jugador ---
  function takeDamage(amount) {
    /* ... (igual que antes) ... */
  }

  // --- Game Over ---
  function handleGameOver() {
    /* ... (igual que antes) ... */
  }

  // --- Generación de Salas ---
  function loadRoom(roomIndex, entryPoint = null) {
    // *** Asegurarse de que 'gameOver' no bloquee la carga inicial ***
    // const layout = roomLayouts[roomIndex]; // Esta línea puede ir después de comprobar el índice
    // if (!layout) { ... } // Esta comprobación puede ir después

    if (roomIndex >= roomLayouts.length) {
      console.log("Intentando cargar sala fuera de límites (¿Victoria?).");
      handleGameWin(); // Lógica de victoria si se pasa del último índice
      return; // Detener carga
    }
    if (roomIndex < 0) {
      console.error("Índice de sala inválido:", roomIndex);
      isTransitioning = false; // Asegurarse de desbloquear si falla
      return;
    }

    const layout = roomLayouts[roomIndex]; // Ahora obtenemos el layout
    currentRoomIndex = roomIndex;

    // 1. Limpiar elementos anteriores
    levelElementsContainer.innerHTML = "";
    enemies = [];
    obstacles = [];
    doors = [];
    interactionTarget = null;
    hideMessage();

    // 2. Posicionar jugador
    if (entryPoint) {
      playerX = entryPoint.x;
      playerY = entryPoint.y;
    } else {
      playerX = layout.playerStart.x;
      playerY = layout.playerStart.y;
    }
    playerX = Math.max(0, Math.min(containerWidth - PLAYER_WIDTH, playerX));
    playerY = Math.max(0, Math.min(containerHeight - PLAYER_HEIGHT, playerY));
    updatePlayerVisuals();

    // 3. Crear Obstáculos
    layout.obstacles.forEach((obsData) => {
      const obsEl = document.createElement("div");
      obsEl.className = "obstacle";
      obsEl.style.left = `${obsData.x}px`;
      obsEl.style.top = `${obsData.y}px`;
      obsEl.style.width = `${obsData.w}px`;
      obsEl.style.height = `${obsData.h}px`;
      levelElementsContainer.appendChild(obsEl);
      obstacles.push(obsEl);
    });

    // 4. Crear Enemigos
    layout.enemies.forEach((enemyData, index) => {
      const enemyEl = document.createElement("div");
      enemyEl.className = "enemy";
      enemyEl.style.left = `${enemyData.x}px`;
      enemyEl.style.top = `${enemyData.y}px`;
      enemyEl.dataset.id = `enemy-${index}`;
      enemyEl.dataset.pattern = enemyData.pattern;
      levelElementsContainer.appendChild(enemyEl);
      enemies.push({
        id: `enemy-${index}`,
        element: enemyEl,
        x: enemyData.x,
        y: enemyData.y,
        w: 0,
        h: 0,
        hp: enemyData.hp,
        pattern: enemyData.pattern,
        speed: enemyData.speed,
        direction: 1,
        range: enemyData.range,
        startX: enemyData.x,
        startY: enemyData.y,
        hitTimer: null,
        chaseTarget: player,
        patrolState: 0,
        patrolDistanceMoved: 0,
      });
    });
    enemies.forEach((enemy) => {
      enemy.w = enemy.element.offsetWidth;
      enemy.h = enemy.element.offsetHeight;
    });

    // 5. Crear Interactuables
    layout.interactables.forEach((itemData) => {
      const itemEl = document.createElement("div");
      itemEl.id =
        itemData.id || `item-${Math.random().toString(36).substr(2, 9)}`;
      itemEl.className = `interactable ${itemData.type || ""}`;
      itemEl.style.left = `${itemData.x}px`;
      itemEl.style.top = `${itemData.y}px`;
      itemEl.dataset.info = itemData.info;
      itemEl.dataset.type = itemData.type || "generic";
      levelElementsContainer.appendChild(itemEl);
    });

    // 6. Crear Puertas
    layout.doors.forEach((doorData) => {
      const doorEl = document.createElement("div");
      doorEl.className = `door ${doorData.locked ? "locked" : ""}`;
      doorEl.style.left = `${doorData.x}px`;
      doorEl.style.top = `${doorData.y}px`;
      doorEl.style.width = `${doorData.w}px`;
      doorEl.style.height = `${doorData.h}px`;
      doorEl.dataset.targetRoom = doorData.targetRoomIndex;
      doorEl.dataset.locked = doorData.locked;
      levelElementsContainer.appendChild(doorEl);
      doors.push(doorEl);
    });

    console.log(`Sala ${currentRoomIndex} cargada.`);

    // Comprobar victoria solo si NO es la sala inicial Y no hay enemigos
    // O si es una sala explícitamente de victoria (quizás añadir una propiedad 'isWinRoom' al layout)
    if (
      currentRoomIndex > 0 &&
      layout.enemies.length === 0 &&
      layout.interactables.length === 0 &&
      currentRoomIndex === roomLayouts.length - 1
    ) {
      // Mejor llamar a handleGameWin desde transitionToRoom si el target es >= roomLayouts.length
      // handleGameWin(); // No llamar aquí directamente, la transición se encarga
    }
  }

  // --- Lógica de Victoria ---
  function handleGameWin() {
    if (gameOver) return;
    gameOver = true;
    isTransitioning = true; // Bloquear todo
    showMessage("¡HAS GANADO!", 0);
    console.log("GAME WIN");
    // Podrías añadir pantalla de victoria aquí
  }

  // --- Transición entre Salas (Fade) ---
  function transitionToRoom(targetRoomIndex, entryPoint = null) {
    if (isTransitioning || gameOver) return;

    // Comprobar si el target es la sala de victoria
    if (targetRoomIndex >= roomLayouts.length) {
      handleGameWin(); // Llamar a la lógica de victoria directamente
      // Podrías añadir un fade out final aquí si quieres
      fadeOverlay.classList.add("active");
      return; // Detener la transición normal
    }

    isTransitioning = true;
    fadeOverlay.classList.add("active"); // Inicia fade out

    setTimeout(() => {
      // Carga la nueva sala mientras está oscuro
      loadRoom(targetRoomIndex, entryPoint);

      // Solo quitar overlay y reanudar si no es game over (aunque ya no debería serlo aquí)
      if (!gameOver) {
        // Inicia fade in
        fadeOverlay.classList.remove("active");

        // Un pequeño delay antes de permitir moverse de nuevo
        setTimeout(() => {
          isTransitioning = false;
        }, FADE_TIME / 2); // Espera un poco más
      }
    }, FADE_TIME);
  }

  // --- Lógica de Movimiento del Jugador (Corregida) ---
  function handleMovement() {
    // *** CORRECCIÓN: Asegurar que estas condiciones permitan el flujo si son falsas ***
    if (isAttacking || isTransitioning || gameOver) {
      return; // Detener si alguna de estas es verdadera
    }

    let dx = 0;
    let dy = 0;

    if (keysPressed.ArrowUp || keysPressed.w) dy -= PLAYER_SPEED;
    if (keysPressed.ArrowDown || keysPressed.s) dy += PLAYER_SPEED;
    if (keysPressed.ArrowLeft || keysPressed.a) dx -= PLAYER_SPEED;
    if (keysPressed.ArrowRight || keysPressed.d) dx += PLAYER_SPEED;

    // Normalizar movimiento diagonal (opcional pero recomendado)
    if (dx !== 0 && dy !== 0) {
      const factor = Math.sqrt(2);
      dx /= factor;
      dy /= factor;
    }

    // Actualizar dirección (facing) solo si hay movimiento SIGNIFICATIVO
    // (Evita cambiar facing si dx/dy son casi cero por la normalización)
    const threshold = 0.1;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Movimiento predominantemente horizontal
      if (dx > threshold) facing = "right";
      else if (dx < -threshold) facing = "left";
    } else {
      // Movimiento predominantemente vertical o igual
      if (dy > threshold) facing = "down";
      else if (dy < -threshold) facing = "up";
    }
    // Si no hay movimiento neto, no cambiar facing (se mantiene el último)
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      return; // No hay movimiento neto
    }

    let nextX = playerX + dx * PLAYER_SPEED; // Aplicar velocidad después de normalizar
    let nextY = playerY + dy * PLAYER_SPEED;

    // Colisión con límites del contenedor
    if (nextX < 0) nextX = 0;
    if (nextY < 0) nextY = 0;
    if (nextX + PLAYER_WIDTH > containerWidth)
      nextX = containerWidth - PLAYER_WIDTH;
    if (nextY + PLAYER_HEIGHT > containerHeight)
      nextY = containerHeight - PLAYER_HEIGHT;

    // Colisión con obstáculos y puertas (tratar puertas como obstáculos para movimiento)
    const playerNextBox = {
      x: nextX,
      y: nextY,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
    };
    let collisionX = false;
    let collisionY = false;
    const collisionCandidates = [...obstacles, ...doors]; // Comprobar contra ambos

    collisionCandidates.forEach((el) => {
      const elBox = getBoundingBox(el);
      // Comprobar colisión en la posición final propuesta
      if (checkCollision(playerNextBox, elBox)) {
        // Intentar mover solo en X
        const tempBoxX = {
          x: nextX,
          y: playerY,
          w: PLAYER_WIDTH,
          h: PLAYER_HEIGHT,
        };
        if (dx !== 0 && !checkCollision(tempBoxX, elBox)) {
          collisionY = true; // Bloquea Y, permite X
        }
        // Intentar mover solo en Y
        const tempBoxY = {
          x: playerX,
          y: nextY,
          w: PLAYER_WIDTH,
          h: PLAYER_HEIGHT,
        };
        if (dy !== 0 && !checkCollision(tempBoxY, elBox)) {
          collisionX = true; // Bloquea X, permite Y
        }
        // Si ambas colisionan individualmente O si no se intentaba mover en ese eje
        if (
          (checkCollision(tempBoxX, elBox) || dx === 0) &&
          (checkCollision(tempBoxY, elBox) || dy === 0)
        ) {
          collisionX = true; // Bloquea ambos
          collisionY = true;
        }
      }
    });

    // Aplicar movimiento basado en colisiones
    if (!collisionX) {
      playerX = nextX;
    }
    if (!collisionY) {
      playerY = nextY;
    }
    // Si hubo colisión en Y pero no en X, solo actualizamos X (ya hecho)
    if (collisionY && !collisionX) {
      // playerY = playerY; // No es necesario, ya no se actualizó
    }
    // Si hubo colisión en X pero no en Y, solo actualizamos Y (ya hecho)
    if (collisionX && !collisionY) {
      // playerX = playerX; // No es necesario
    }

    // Colisión con Enemigos (después de mover)
    const playerCurrentBox = {
      x: playerX,
      y: playerY,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
    };
    enemies.forEach((enemy) => {
      if (enemy.hp <= 0 || !enemy.element) return;
      const enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
      if (checkCollision(playerCurrentBox, enemyBox)) {
        takeDamage(1);
      }
    });

    // updatePlayerVisuals(); // Se llama en el loop principal
    // checkInteraction(); // Se llama en el loop principal
  }

  // --- Lógica de Ataque (Corregida) ---
  function attack() {
    // *** CORRECCIÓN: Comprobar estados correctamente ***
    if (isAttacking || isTransitioning || gameOver) {
      return; // No atacar si ya ataca, transiciona o game over
    }

    isAttacking = true;
    player.classList.add("attacking");
    player.dataset.facing = facing; // Asegura CSS correcto

    // Lógica de colisión del ataque
    const swordBox = getSwordBoundingBox();

    enemies.forEach((enemy) => {
      if (!enemy.element || enemy.hp <= 0 || !swordBox) return; // Añadida comprobación de swordBox

      const enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };

      if (checkCollision(swordBox, enemyBox) && !enemy.hitTimer) {
        enemy.hp -= 1;
        enemy.element.classList.add("hit");
        console.log(`Enemigo ${enemy.id} golpeado, HP: ${enemy.hp}`);

        enemy.hitTimer = setTimeout(() => {
          enemy.element.classList.remove("hit");
          enemy.hitTimer = null;
        }, ENEMY_HIT_DURATION);

        if (enemy.hp <= 0) {
          console.log(`Enemigo ${enemy.id} derrotado`);
          if (enemy.element.parentNode) {
            enemy.element.parentNode.removeChild(enemy.element);
            // Opcional: Marcar el elemento como null para que no se procese más
            enemy.element = null;
          }
          // Podríamos filtrar el array `enemies` aquí para optimizar
        }
      }
    });

    // Limpiar estado de ataque
    clearTimeout(attackTimeout);
    attackTimeout = setTimeout(() => {
      isAttacking = false;
      player.classList.remove("attacking");
      // sword.style.display = 'none'; // El CSS debería ocultarlo al quitar la clase 'attacking'
    }, ATTACK_DURATION);
  }

  function getSwordBoundingBox() {
    /* ... (igual que antes, pero asegurarse que solo se llama si isAttacking es true) ... */
    if (!isAttacking) return null;

    // Forzar al navegador a recalcular estilos para obtener la posición correcta de la espada
    // Esto puede ser costoso, pero asegura que la posición sea la actual del frame
    // player.offsetHeight; // Truco para forzar reflow (usar con cuidado)

    const swordRect = sword.getBoundingClientRect(); // Posición en pantalla
    const containerRect = gameContainer.getBoundingClientRect(); // Posición del contenedor

    // Si la espada no es visible (display: none), width/height serán 0
    if (swordRect.width === 0 || swordRect.height === 0) {
      return null;
    }

    return {
      x: swordRect.left - containerRect.left,
      y: swordRect.top - containerRect.top,
      w: swordRect.width,
      h: swordRect.height,
    };
  }

  // --- Lógica de Enemigos ---
  function updateEnemies() {
    /* ... (igual que antes, pero añadir chequeo !gameOver) ... */
    if (isTransitioning || gameOver) return;
    // ... resto de la lógica de enemigos ...
  }

  // --- Lógica de Interacción ---
  function checkInteraction() {
    /* ... (igual que antes, pero añadir chequeo !gameOver) ... */
    if (isTransitioning || gameOver) return;
    // ... resto de la lógica de checkInteraction ...
  }

  function interact() {
    /* ... (igual que antes, pero añadir chequeo !gameOver) ... */
    if (!interactionTarget || isTransitioning || gameOver) return;
    // ... resto de la lógica de interact ...
  }
  function calculateEntryPoint(doorElement, targetRoomIndex) {
    /* ... (igual que antes) ... */
  }

  // --- Actualización Visual del Jugador ---
  function updatePlayerVisuals() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
    player.dataset.facing = facing;
  }

  // --- Game Loop (Corregido) ---
  function gameLoop() {
    // *** CORRECCIÓN: Salir limpiamente si gameOver es true ***
    if (gameOver) {
      console.log("Game loop detenido por Game Over.");
      return; // Detiene la solicitud de nuevos frames
    }

    // Lógica principal del juego
    handleMovement();
    updateEnemies();
    checkInteraction();
    updatePlayerVisuals();

    // Solicitar el siguiente frame
    requestAnimationFrame(gameLoop);
  }

  // --- Event Listeners (Teclado - Corregido) ---
  document.addEventListener("keydown", (event) => {
    // *** CORRECCIÓN: Ignorar input si transiciona o game over ***
    if (isTransitioning || gameOver) return;

    if (keysPressed.hasOwnProperty(event.key)) {
      // Evitar que el navegador haga scroll con las flechas
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }
      keysPressed[event.key] = true;
    }

    // Acciones únicas (no mantener pulsado)
    switch (event.key) {
      case " ": // Barra espaciadora
        event.preventDefault(); // Evitar scroll si la página es larga
        attack();
        break;
      case "e":
      case "E":
        interact();
        break;
      // case 'r': case 'R': transitionToRoom(currentRoomIndex + 1); break; // Para debug
    }
  });

  document.addEventListener("keyup", (event) => {
    // No necesitamos bloquear keyup por transición o game over,
    // simplemente registramos que la tecla ya no está pulsada.
    if (keysPressed.hasOwnProperty(event.key)) {
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }
      keysPressed[event.key] = false;
    }
  });

  // --- Inicialización ---
  updateHUD();
  loadRoom(0); // Carga la primera sala
  showMessage(`¡V3.1! Movimiento arreglado. ¡A jugar!`, 5000);
  gameLoop(); // Inicia el bucle del juego
});
