document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const player = document.getElementById('player');
    const sword = document.getElementById('sword');
    const gameContainer = document.getElementById('game-container');
    const levelElementsContainer = document.getElementById('level-elements');
    const messageArea = document.getElementById('message-area');
    const hudHp = document.getElementById('hud-hp');
    const hudKey = document.getElementById('hud-key');
    const fadeOverlay = document.getElementById('fade-overlay');

    // --- Constantes del Juego ---
    const PLAYER_SPEED = 2.5; // Ajusta si es necesario
    const PLAYER_WIDTH = player.offsetWidth;
    const PLAYER_HEIGHT = player.offsetHeight;
    const PLAYER_MAX_HP = 3;
    const INVINCIBILITY_DURATION = 1200; // ms de invencibilidad tras golpe
    const BLINK_INTERVAL = 150; // ms para parpadeo
    const ATTACK_DURATION = 250; // ms
    const ENEMY_HIT_DURATION = 150; // ms
    const INTERACTION_RANGE = 15;
    const FADE_TIME = 400; // ms (debe coincidir con CSS transition)

    // --- Estado del Juego ---
    let playerX = 50;
    let playerY = 50;
    let playerHP = PLAYER_MAX_HP;
    let facing = 'down';
    let isAttacking = false;
    let attackTimeout = null;
    let interactionTarget = null;
    let currentRoomIndex = 0;
    let enemies = [];
    let obstacles = [];
    let doors = []; // Array para puertas
    let hasKey = false; // Inventario simple
    let isInvincible = false;
    let invincibilityTimer = null;
    let blinkIntervalTimer = null;
    let isTransitioning = false;
    let gameOver = false;

    // --- Estado de Controles ---
    const keysPressed = { /* ... (igual que antes) ... */ };

    // --- Límites del Contenedor ---
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;

    // --- Definiciones de Salas (Actualizadas) ---
    const roomLayouts = [
        { // Sala 0: Inicio con llave y puerta bloqueada
            playerStart: { x: 50, y: 50 },
            obstacles: [
                { x: 150, y: 100, w: 100, h: 20 },
                { x: 50, y: 250, w: 20, h: 100 },
                { x: 300, y: 200, w: 20, h: 150 },
                { x: 0, y: containerHeight - 20, w: containerWidth, h: 20 }, // Pared inferior
                { x: containerWidth - 20, y: 0, w: 20, h: containerHeight }, // Pared derecha
            ],
            enemies: [
                { x: 250, y: 150, hp: 1, pattern: 'horizontal', speed: 1, range: 50 },
                { x: 400, y: 300, hp: 1, pattern: 'chase', speed: 0.8, range: 150 } // Enemigo perseguidor
            ],
            interactables: [
                 { id: 'key1', type: 'key', x: 450, y: 50, info: '¡Has encontrado una vieja llave! 🔑'}
            ],
            doors: [
                 // Puerta a la sala 1, bloqueada, arriba a la derecha
                 { x: containerWidth - 70, y: 10, w: 50, h: 15, targetRoomIndex: 1, locked: true }
            ]
        },
        { // Sala 1: Más enemigos y puerta de salida (sin bloquear)
            playerStart: { x: 50, y: containerHeight - PLAYER_HEIGHT - 30 }, // Entra por abajo izquierda (simulado)
            obstacles: [
                { x: 100, y: 100, w: 20, h: 250 },
                { x: 120, y: 100, w: 150, h: 20 },
                { x: 400, y: 50, w: 20, h: 150 },
                { x: 300, y: 300, w: 150, h: 20 },
                 { x: 0, y: 0, w: containerWidth, h: 20 }, // Pared superior
                 { x: 0, y: 0, w: 20, h: containerHeight }, // Pared izquierda
            ],
            enemies: [
                { x: 150, y: 150, hp: 1, pattern: 'vertical', speed: 1.5, range: 80 },
                { x: 350, y: 250, hp: 1, pattern: 'square_patrol', speed: 1, range: 60 }, // Patrulla cuadrada
                { x: 250, y: 400, hp: 1, pattern: 'chase', speed: 0.7, range: 120 }
            ],
             interactables: [],
             doors: [
                 // Puerta de salida (simulada, lleva a sala "ganadora")
                 { x: containerWidth - 20, y: containerHeight / 2 - 25, w: 15, h: 50, targetRoomIndex: 2, locked: false }
             ]
        },
        { // Sala 2: Sala "Has ganado" (vacía)
            playerStart: { x: containerWidth / 2 - PLAYER_WIDTH / 2, y: containerHeight / 2 - PLAYER_HEIGHT / 2 },
            obstacles: [],
            enemies: [],
            interactables: [],
            doors: []
        }
    ];

    // --- Funciones Auxiliares ---

    function showMessage(text, duration = 3000) { /* ... (igual) ... */ }
    function hideMessage() { /* ... (igual) ... */ }
    function getBoundingBox(element) { /* ... (igual) ... */ }
    function checkCollision(box1, box2) { /* ... (igual) ... */ }

    // --- Actualizar HUD ---
    function updateHUD() {
        // HP
        let hpHTML = 'HP: ';
        for (let i = 0; i < PLAYER_MAX_HP; i++) {
            hpHTML += `<span class="heart${i < playerHP ? '' : ' empty'}">♥</span>`;
        }
        hudHp.innerHTML = hpHTML;

        // Key
        hudKey.style.display = hasKey ? 'inline' : 'none';
    }

    // --- Daño al Jugador ---
    function takeDamage(amount) {
        if (isInvincible || gameOver) return;

        playerHP -= amount;
        playerHP = Math.max(0, playerHP); // No bajar de 0
        updateHUD();
        console.log(`Player took damage, HP: ${playerHP}`);

        if (playerHP <= 0) {
            handleGameOver();
            return;
        }

        // Iniciar invencibilidad y parpadeo
        isInvincible = true;
        player.classList.add('hit-invincible'); // Clase para opacidad/efecto

        // Parpadeo
        let blinkOn = false;
        blinkIntervalTimer = setInterval(() => {
            blinkOn = !blinkOn;
            player.style.opacity = blinkOn ? '0.6' : '1'; // Alternar opacidad
        }, BLINK_INTERVAL);

        // Limpiar invencibilidad después de la duración
        clearTimeout(invincibilityTimer);
        invincibilityTimer = setTimeout(() => {
            isInvincible = false;
            clearInterval(blinkIntervalTimer); // Detener parpadeo
            player.classList.remove('hit-invincible');
            player.style.opacity = '1'; // Asegurar opacidad normal
            console.log("Invincibility ended");
        }, INVINCIBILITY_DURATION);
    }

    // --- Game Over ---
     function handleGameOver() {
         if (gameOver) return;
         gameOver = true;
         isTransitioning = true; // Bloquea otras acciones
         console.log("GAME OVER");
         showMessage("¡HAS PERDIDO!", 0); // Mensaje persistente

         // Crear pantalla de Game Over
         const gameOverScreen = document.createElement('div');
         gameOverScreen.id = 'game-over';
         gameOverScreen.innerHTML = `
             GAME OVER
             <button id="restart-button">Reiniciar</button>
         `;
         gameContainer.appendChild(gameOverScreen);

         document.getElementById('restart-button').addEventListener('click', () => {
             // Recargar la página para reiniciar (simple)
             window.location.reload();
         });

         // Detener timers importantes si los hubiera (ej. ataque)
         clearTimeout(attackTimeout);
         clearTimeout(invincibilityTimer);
         clearInterval(blinkIntervalTimer);
     }


    // --- Generación de Salas (Actualizada para puertas) ---
    function loadRoom(roomIndex, entryPoint = null) { // entryPoint opcional para posicionar al entrar por puerta
        const layout = roomLayouts[roomIndex];
        if (!layout) {
            console.error(`Sala ${roomIndex} no definida.`);
            // Podríamos ir a una sala por defecto o mostrar error
             if (roomIndex === roomLayouts.length) { // Si era la última sala + 1 (ganar)
                 handleGameWin(); // Lógica de victoria
                 return;
             }
            isTransitioning = false; // Desbloquear si falla
            return;
        }
        currentRoomIndex = roomIndex;

        // 1. Limpiar elementos anteriores
        levelElementsContainer.innerHTML = '';
        enemies = [];
        obstacles = [];
        doors = []; // Limpiar array de puertas
        interactionTarget = null;
        hideMessage();

        // 2. Posicionar jugador
        if (entryPoint) { // Si se entra por una puerta específica
             // Calcular posición basada en la puerta de entrada
             // Simple: colocar cerca del borde opuesto a donde estaría la puerta
             // Ejemplo: Si la puerta de entrada estaba a la derecha, aparecer a la izquierda
             // Esto necesita más lógica si las puertas no están en los bordes
            playerX = entryPoint.x;
            playerY = entryPoint.y;
        } else { // Carga inicial o por testeo
             playerX = layout.playerStart.x;
             playerY = layout.playerStart.y;
        }
         // Asegurar que el jugador no aparezca dentro de un obstáculo (básico)
         playerX = Math.max(0, Math.min(containerWidth - PLAYER_WIDTH, playerX));
         playerY = Math.max(0, Math.min(containerHeight - PLAYER_HEIGHT, playerY));

        updatePlayerVisuals();

        // 3. Crear Obstáculos
        layout.obstacles.forEach(obsData => { /* ... (igual) ... */ });

        // 4. Crear Enemigos (Añadir data-pattern)
        layout.enemies.forEach((enemyData, index) => {
            const enemyEl = document.createElement('div');
            enemyEl.className = 'enemy';
            enemyEl.style.left = `${enemyData.x}px`;
            enemyEl.style.top = `${enemyData.y}px`;
            enemyEl.dataset.id = `enemy-${index}`;
            enemyEl.dataset.pattern = enemyData.pattern; // Guardar patrón para CSS y lógica
            levelElementsContainer.appendChild(enemyEl);

            enemies.push({
                id: `enemy-${index}`,
                element: enemyEl,
                x: enemyData.x,
                y: enemyData.y,
                w: 0, // Se calcularán después
                h: 0,
                hp: enemyData.hp,
                pattern: enemyData.pattern,
                speed: enemyData.speed,
                direction: 1,
                range: enemyData.range,
                startX: enemyData.x, // Para patrones relativos
                startY: enemyData.y,
                hitTimer: null,
                chaseTarget: player, // Referencia al jugador para chase
                // Estado para patrol
                patrolState: 0, // 0: right, 1: down, 2: left, 3: up
                patrolDistanceMoved: 0,
            });
        });
        // Calcular W/H real después de añadir al DOM
        enemies.forEach(enemy => {
             enemy.w = enemy.element.offsetWidth;
             enemy.h = enemy.element.offsetHeight;
        });


        // 5. Crear Interactuables (Llaves, etc.)
        layout.interactables.forEach(itemData => {
            const itemEl = document.createElement('div');
            itemEl.id = itemData.id || `item-${Math.random().toString(36).substr(2, 9)}`;
            itemEl.className = `interactable ${itemData.type || ''}`; // Añadir clase 'key'
            itemEl.style.left = `${itemData.x}px`;
            itemEl.style.top = `${itemData.y}px`;
            itemEl.dataset.info = itemData.info;
            itemEl.dataset.type = itemData.type || 'generic'; // Guardar tipo
            levelElementsContainer.appendChild(itemEl);
        });

        // 6. Crear Puertas
        layout.doors.forEach(doorData => {
            const doorEl = document.createElement('div');
            doorEl.className = `door ${doorData.locked ? 'locked' : ''}`;
            doorEl.style.left = `${doorData.x}px`;
            doorEl.style.top = `${doorData.y}px`;
            doorEl.style.width = `${doorData.w}px`;
            doorEl.style.height = `${doorData.h}px`;
            doorEl.dataset.targetRoom = doorData.targetRoomIndex;
            doorEl.dataset.locked = doorData.locked; // 'true' o 'false'
            levelElementsContainer.appendChild(doorEl);
            doors.push(doorEl); // Guardar referencia
        });

        console.log(`Sala ${currentRoomIndex} cargada.`);

        // Si es la sala de victoria, mostrar mensaje
        if (currentRoomIndex === roomLayouts.length -1 && roomLayouts[currentRoomIndex].enemies.length === 0) {
            handleGameWin();
        }
    }

     // --- Lógica de Victoria ---
     function handleGameWin() {
         if (gameOver) return; // No ganar si ya has perdido
         gameOver = true; // Reutilizamos la bandera para detener el juego
         isTransitioning = true;
         showMessage("¡HAS GANADO!", 0);
         console.log("GAME WIN");
         // Podrías añadir una pantalla de victoria similar a la de Game Over
     }


    // --- Transición entre Salas (Fade) ---
    function transitionToRoom(targetRoomIndex, entryPoint = null) {
        if (isTransitioning || gameOver) return;

        isTransitioning = true;
        fadeOverlay.classList.add('active'); // Inicia fade out

        setTimeout(() => {
            // A mitad del fade (pantalla negra), carga la nueva sala
            loadRoom(targetRoomIndex, entryPoint);

            // Inicia fade in (quitando la clase 'active')
            fadeOverlay.classList.remove('active');

             // Un pequeño delay extra antes de permitir moverse de nuevo
             setTimeout(() => {
                // Solo reanudar si no es game over o win
                if (!gameOver) {
                     isTransitioning = false;
                }
             }, FADE_TIME / 2); // Espera un poco más después de quitar el overlay

        }, FADE_TIME); // Espera la duración del fade out
    }


    // --- Lógica de Movimiento del Jugador (Sin cambios grandes) ---
    function handleMovement() {
         if (isAttacking || isTransitioning || gameOver) return; // No moverse en estos estados
         // ... resto de la lógica de movimiento y colisión ...
         // (La lógica de colisión con deslizamiento ya estaba bien)
         // ...

         // Importante: Colisión con Enemigos
         const playerBox = { x: playerX, y: playerY, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
         enemies.forEach(enemy => {
             if (enemy.hp <= 0 || !enemy.element) return;
             const enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
             if (checkCollision(playerBox, enemyBox)) {
                 takeDamage(1); // Recibe 1 punto de daño al tocar enemigo
             }
         });
    }

    // --- Lógica de Ataque (Sin cambios grandes) ---
    function attack() {
        if (isAttacking || isTransitioning || gameOver) return;
         // ... resto de la lógica de ataque y colisión con enemigos ...
    }
    function getSwordBoundingBox() { /* ... (igual) ... */ }


    // --- Lógica de Enemigos (Patrones nuevos) ---
    function updateEnemies() {
         if (isTransitioning || gameOver) return; // No mover enemigos durante transición o game over

        enemies.forEach(enemy => {
            if (enemy.hp <= 0 || !enemy.element) return;

            let dx = 0;
            let dy = 0;
            const prevX = enemy.x; // Guardar posición anterior para revertir en colisión
            const prevY = enemy.y;

            // Movimiento basado en patrón
            switch (enemy.pattern) {
                case 'horizontal':
                case 'vertical':
                    // Lógica existente (movimiento lineal con rebote)
                     if (enemy.pattern === 'horizontal') {
                         dx = enemy.speed * enemy.direction;
                         enemy.x += dx;
                         if (enemy.x >= enemy.startX + enemy.range || enemy.x <= enemy.startX - enemy.range || enemy.x <= 0 || enemy.x + enemy.w >= containerWidth) {
                             enemy.direction *= -1;
                             enemy.x = Math.max(0, Math.min(containerWidth - enemy.w, enemy.x));
                         }
                     } else { // vertical
                         dy = enemy.speed * enemy.direction;
                         enemy.y += dy;
                          if (enemy.y >= enemy.startY + enemy.range || enemy.y <= enemy.startY - enemy.range || enemy.y <= 0 || enemy.y + enemy.h >= containerHeight) {
                              enemy.direction *= -1;
                              enemy.y = Math.max(0, Math.min(containerHeight - enemy.h, enemy.y));
                          }
                     }
                    break;

                case 'chase':
                    const distX = playerX - enemy.x;
                    const distY = playerY - enemy.y;
                    const distance = Math.sqrt(distX * distX + distY * distY);

                    if (distance > 5 && distance < enemy.range) { // Perseguir si está en rango y no encima
                        dx = (distX / distance) * enemy.speed;
                        dy = (distY / distance) * enemy.speed;
                        enemy.x += dx;
                        enemy.y += dy;
                    } else {
                        // Opcional: Podría volver a una posición inicial o quedarse quieto fuera de rango
                    }
                    break;

                case 'square_patrol':
                    const moveAmount = enemy.speed;
                    switch (enemy.patrolState) {
                        case 0: dx = moveAmount; break; // Mover derecha
                        case 1: dy = moveAmount; break; // Mover abajo
                        case 2: dx = -moveAmount; break; // Mover izquierda
                        case 3: dy = -moveAmount; break; // Mover arriba
                    }
                    enemy.x += dx;
                    enemy.y += dy;
                    enemy.patrolDistanceMoved += moveAmount;

                    if (enemy.patrolDistanceMoved >= enemy.range) { // 'range' aquí es el lado del cuadrado
                        enemy.patrolDistanceMoved = 0;
                        enemy.patrolState = (enemy.patrolState + 1) % 4;
                        // Ajustar posición para evitar deriva (opcional)
                         // enemy.x = Math.round(enemy.x / TILE_SIZE) * TILE_SIZE; // Si usaras tiles
                    }
                    break;
            }

            // Colisión de enemigos con obstáculos (revertir y cambiar dirección si aplica)
            const enemyNextBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
            let collided = false;
            obstacles.forEach(obsEl => {
                 const obsBox = getBoundingBox(obsEl);
                 if (checkCollision(enemyNextBox, obsBox)) {
                     collided = true;
                 }
            });
             // Colisión con puertas (tratarlas como obstáculos para enemigos)
             doors.forEach(doorEl => {
                 const doorBox = getBoundingBox(doorEl);
                 if (checkCollision(enemyNextBox, doorBox)) {
                     collided = true;
                 }
             });


            if(collided) {
                 enemy.x = prevX; // Revertir movimiento
                 enemy.y = prevY;
                 // Cambiar dirección para patrones simples
                 if (enemy.pattern === 'horizontal' || enemy.pattern === 'vertical') {
                      enemy.direction *= -1;
                 }
                 // Para chase o patrol, podría necesitar lógica más compleja (intentar rodear)
                 // Por ahora, simplemente se detiene contra el obstáculo este frame
                 if (enemy.pattern === 'square_patrol') {
                     enemy.patrolDistanceMoved = 0; // Resetear distancia
                     enemy.patrolState = (enemy.patrolState + 1) % 4; // Girar
                 }
             }

            // Actualizar posición visual
            enemy.element.style.left = `${enemy.x}px`;
            enemy.element.style.top = `${enemy.y}px`;
        });
    }

    // --- Lógica de Interacción (Actualizada para puertas y llaves) ---
    function checkInteraction() {
        if (isTransitioning || gameOver) return;

        let foundTarget = null;
        const playerInteractionBox = {
            x: playerX - INTERACTION_RANGE,
            y: playerY - INTERACTION_RANGE,
            w: PLAYER_WIDTH + 2 * INTERACTION_RANGE,
            h: PLAYER_HEIGHT + 2 * INTERACTION_RANGE
        };

        // 1. Buscar Interactuables normales (llaves, etc.)
        const interactableElements = levelElementsContainer.querySelectorAll('.interactable');
        interactableElements.forEach(itemEl => {
            if (itemEl.style.display === 'none') return;
            const itemBox = getBoundingBox(itemEl);
            itemEl.classList.remove('near');
            if (!foundTarget && checkCollision(playerInteractionBox, itemBox)) {
                 foundTarget = itemEl;
                 itemEl.classList.add('near');
            }
        });

        // 2. Buscar Puertas (tienen prioridad si están más cerca? o igual?)
         doors.forEach(doorEl => {
             const doorBox = getBoundingBox(doorEl);
             doorEl.classList.remove('near');
             // Damos prioridad a la puerta si no hay otro interactuable encontrado aún, o si está "más" en colisión?
             // Por simplicidad, si colisiona y no hay otro, es el objetivo.
             if (!foundTarget && checkCollision(playerInteractionBox, doorBox)) {
                 foundTarget = doorEl;
                 doorEl.classList.add('near'); // Resaltado diferente para puertas
             }
         });


        // Actualizar mensaje y estado interactionTarget
         if (foundTarget && interactionTarget !== foundTarget) {
             // Quitar 'near' del objetivo anterior si existía y no es el nuevo
             if(interactionTarget && interactionTarget !== foundTarget) {
                interactionTarget.classList.remove('near');
             }
             interactionTarget = foundTarget;
             showMessage("Pulsa 'E' para interactuar", 0);
         } else if (!foundTarget && interactionTarget) {
             interactionTarget.classList.remove('near');
             interactionTarget = null;
             if (messageArea.textContent.includes("Pulsa 'E'")) {
                 hideMessage();
             }
         } else if (!interactionTarget && messageArea.textContent.includes("Pulsa 'E'")) {
             hideMessage();
         }
    }


    function interact() {
        if (!interactionTarget || isTransitioning || gameOver) return;

        // Es una Puerta?
        if (interactionTarget.classList.contains('door')) {
            const isLocked = interactionTarget.dataset.locked === 'true';
            const targetRoom = parseInt(interactionTarget.dataset.targetRoom, 10);

            if (isLocked) {
                if (hasKey) {
                    // Desbloquear la puerta
                    interactionTarget.classList.remove('locked');
                    interactionTarget.dataset.locked = 'false';
                    showMessage("¡Has abierto la puerta!", 3000);
                    // Opcional: Sonido de desbloqueo
                    // ¡No transiciones todavía! Solo la desbloqueas. El *siguiente* interact la usará.
                    // Podríamos hacer que transicione directamente:
                     console.log(`Puerta desbloqueada, transicionando a sala ${targetRoom}`);
                     // Calcular un punto de entrada simple para la nueva sala
                     // Ej: si la puerta está arriba, empezar abajo en la nueva sala
                     let entry = calculateEntryPoint(interactionTarget, targetRoom);
                     transitionToRoom(targetRoom, entry);

                } else {
                    showMessage("Necesitas una llave para abrir esta puerta.", 3000);
                    // Opcional: Sonido de "bloqueado"
                }
            } else {
                // Puerta no bloqueada, transicionar
                 console.log(`Puerta abierta, transicionando a sala ${targetRoom}`);
                 let entry = calculateEntryPoint(interactionTarget, targetRoom);
                 transitionToRoom(targetRoom, entry);
            }
        }
        // Es un Interactuable normal?
        else if (interactionTarget.classList.contains('interactable')) {
            const itemType = interactionTarget.dataset.type;
            const message = interactionTarget.dataset.info || "¡Has interactuado con algo!";
            showMessage(message, 4000);

            if (itemType === 'key') {
                hasKey = true;
                updateHUD();
                // Opcional: Sonido de conseguir item
            }

            interactionTarget.style.display = 'none'; // "Recoger"
            interactionTarget.classList.remove('near');
            interactionTarget = null;
            if (messageArea.textContent.includes("Pulsa 'E'")) { hideMessage(); }
        }
    }

     // Función simple para calcular dónde aparecer en la nueva sala
     function calculateEntryPoint(doorElement, targetRoomIndex) {
         const doorBox = getBoundingBox(doorElement);
         const buffer = 5; // Pequeño espacio desde el borde
         let entryX = playerX; // Por defecto, mantener posición relativa si es posible
         let entryY = playerY;

         // Lógica básica: si la puerta está cerca de un borde, aparecer en el borde opuesto
         if (doorBox.x < buffer * 5) { // Puerta a la izquierda
             entryX = containerWidth - PLAYER_WIDTH - buffer;
         } else if (doorBox.x + doorBox.w > containerWidth - buffer * 5) { // Puerta a la derecha
             entryX = buffer;
         }

          if (doorBox.y < buffer * 5) { // Puerta arriba
             entryY = containerHeight - PLAYER_HEIGHT - buffer;
         } else if (doorBox.y + doorBox.h > containerHeight - buffer * 5) { // Puerta abajo
             entryY = buffer;
         }

         // Si la puerta está en medio, la lógica anterior podría no funcionar bien.
         // Podríamos usar la definición de la sala destino para una entrada específica.
         // Por ahora, esta aproximación es suficiente.

         // Asegurarse de que no esté fuera de límites
         entryX = Math.max(0, Math.min(containerWidth - PLAYER_WIDTH, entryX));
         entryY = Math.max(0, Math.min(containerHeight - PLAYER_HEIGHT, entryY));

         return { x: entryX, y: entryY };
     }


    // --- Actualización Visual del Jugador ---
    function updatePlayerVisuals() {
        player.style.left = `${playerX}px`;
        player.style.top = `${playerY}px`;
        player.dataset.facing = facing;
    }

    // --- Game Loop ---
    function gameLoop() {
        if (gameOver) { // Detener el bucle si es game over
             // requestAnimationFrame(gameLoop); // Comentado para detener
             return;
        }


        // 1. Input y Movimiento Jugador (incluye colisión jugador-enemigo -> takeDamage)
        handleMovement();

        // 2. Actualizar Enemigos (movimiento y colisión con obstáculos)
        updateEnemies();

        // 3. Comprobar Interacciones Cercanas
        checkInteraction();

        // 4. Actualizar Visuales Jugador
        updatePlayerVisuals(); // Visuales básicos

        // 5. Solicitar siguiente frame
        requestAnimationFrame(gameLoop);
    }

    // --- Event Listeners (Teclado) ---
    document.addEventListener('keydown', (event) => {
         if (isTransitioning) return; // Ignorar input durante transiciones
         // ... (resto de keydown, quitando la 'r' si quieres)
         // Asegúrate de que el 'attack' e 'interact' también comprueben !isTransitioning y !gameOver
         if (keysPressed.hasOwnProperty(event.key)) {
             keysPressed[event.key] = true;
         }
         switch (event.key) {
             case ' ': attack(); break;
             case 'e': case 'E': interact(); break;
             // case 'r': case 'R': transitionToRoom(currentRoomIndex + 1); break; // Quitar o mantener para debug
         }
    });
     document.addEventListener('keyup', (event) => {
         // ... (igual que antes)
         if (keysPressed.hasOwnProperty(event.key)) {
             keysPressed[event.key] = false;
         }
     });

    // --- Inicialización ---
    updateHUD(); // Poner HP inicial
    loadRoom(0); // Carga la primera sala
    showMessage(`¡V3! HP, Llaves, Puertas, Enemigos!`, 5000);
    gameLoop(); // Inicia el bucle del juego
});