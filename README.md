# 🎩 Monopoly Deal Online (GameHub Edition)

> Aplicación web multijugador en tiempo real para jugar a **Monopoly Deal** con amigos, combinando las **reglas oficiales de Hasbro (106 cartas)**, una interfaz inmersiva estilo **GameHub Desktop** (modo oscuro OLED `#0B0C10`), microinteracciones táctiles inspiradas en **[Bencho.dev](https://bencho.dev/)** y coreografía de animación basada en los principios de **Emil Kowalski / Apple Design**.

---

## ✨ Características Principales

### 1. Motor de Reglas Oficiales Hasbro (FSM Determinista)
- **Mazo exacto de 106 cartas jugables**:
  - `20` Cartas de Dinero (totalizando \$57M).
  - `28` Cartas de Propiedad en 10 grupos de color (edición clásica de Madrid).
  - `11` Comodines de Propiedad (incluyendo comodines bicolores y el arcoíris multicolor de \$0M).
  - `13` Cartas de Renta (10 bicolores cobrando a todos los jugadores y 3 multicolores dirigidas a un solo rival).
  - `34` Cartas de Acción (*Pasa por la Salida*, *Robanegocios*, *Robo Astuto*, *Trato Forzoso*, *Cobrador de Deudas*, *Mi Cumpleaños*, *Casa*, *Hotel*, *Doble Renta* y *¡Di que No!*).
- **Casos borde implementados estrictamente**:
  - **Inmunidad de la mano**: las deudas solo pueden pagarse con cartas que estén sobre tu mesa (Banco o Propiedades).
  - **Sin cambio (*No Change Given*)**: si pagas de más con un billete grande o una propiedad, el cobrador retiene el excedente.
  - **Insolvencia parcial**: si el deudor no alcanza a cubrir la deuda, entrega todo lo que tiene sobre su mesa y queda liberado del saldo restante.
  - **Protección contra fuga de información (*Anti-Info Leak*)**: los modales de reacción siempre se despliegan para evitar que la mesa deduzca si tienes un *¡Di que No!*.
  - **Condición de victoria**: 3 conjuntos completos de propiedades de **colores diferentes** durante tu propio turno activo.

### 2. Dirección de Arte & Microinteracciones (GameHub × Bencho.dev)
- **Lienzo OLED `#0B0C10`**: contraste profundo con sombras interiores y paneles translúcidos (`backdrop-filter: blur(24px)`).
- **Dock vertical de 70px (macOS Chrome)**: botones traffic-light, acceso a las 4 hojas de referencia de reglas oficiales, historial de jugadas en vivo y selector de sonido.
- **Píldoras de acción rápida (Bencho.dev style)**: selector dual flotante `[ ⚡ Jugar Acción ]` vs `[ 💰 Al Banco ($XM) ]` al tocar cualquier carta en mano para prevenir pulsaciones accidentales.
- **Rotación física de 180° en comodines bicolores**: giro espacial suave (`rotateZ(180deg)`) para alternar el color activo de la propiedad en mesa.
- **Inspector táctil de alta resolución**: amplía cualquier carta en pantalla mediante clic o pulsación larga.

### 3. Redes y Multijugador en Tiempo Real
- Servidor Socket.io con salas privadas generadas por código corto (ej. `DEAL-R6AU`).
- **Ocultación criptográfica de cartas**: el servidor jamás envía los IDs de las cartas en mano de los oponentes a los demás clientes (`handCount`).
- Reconexión automática de sesión almacenada en `localStorage`.
- **Bot de prueba inteligente**: añade bots con un clic para probar jugadas y partidas sin esperar a otros jugadores.

---

## 🛠️ Stack Tecnológico

- **Monorepo:** `pnpm` workspaces (v11+)
- **Shared (`@monopoly-deal/shared`):** TypeScript, Máquina de Estados Finita (FSM), Zod, Vitest.
- **Server (`@monopoly-deal/server`):** Node.js, Express, Socket.io, TypeScript.
- **Client (`@monopoly-deal/client`):** React 19, Vite, Tailwind CSS, GSAP (Flip & Timeline), Lucide Icons.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** (v20+)
- **pnpm** (v11+)

```bash
# 1. Instalar todas las dependencias del monorepo
pnpm install

# 2. Compilar todos los paquetes
pnpm build

# 3. Ejecutar la suite de tests unitarios y de reglas
pnpm test
```

### Ejecución en Desarrollo

Puedes arrancar el servidor backend y el cliente frontend de forma concurrente:

```bash
# Terminal 1: Servidor WebSocket y Assets (puerto 3001)
pnpm dev:server

# Terminal 2: Frontend WebApp con Vite (puerto 5173)
pnpm dev:client
```

Abre tu navegador en [http://localhost:5173](http://localhost:5173).

---

## 🧪 Verificación de Reglas y Tests

El motor cuenta con una suite completa de tests automatizados con **Vitest**:

```bash
pnpm --filter @monopoly-deal/shared test
```

- `deck.test.ts`: Comprueba la ley de conservación (106 cartas exactas en cualquier fase), el desglose exacto por categorías y la integridad de los \$57M en billetes.
- `rules.test.ts`: Valida tamaños de conjuntos completos, cálculos de renta con Casa, Hotel y multiplicadores de Doble Renta.
- `engine.test.ts`: Simula ciclos completos de turnos, descarte a 7 cartas, pagos de deuda sin cambio y enmascaramiento de manos rivales.

---

## 📄 Licencia

MIT © Santiago Castro Salt
