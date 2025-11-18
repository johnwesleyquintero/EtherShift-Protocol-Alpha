# 🕹️ EtherShift — Protocol Alpha
### *The Rebirth of the Builder, Compiled*

> "The world didn’t make what we wanted, so we became the ones who will."

**EtherShift** is a narrative-driven, retro-styled RPG prototype running entirely in the browser. It blends SNES/GBA-era aesthetics with modern reactive state management.

This repository contains the **Protocol Alpha (v2.2)**, a functional proof-of-concept focused on the core loop: exploration, interaction, and the signature "Shift" mechanic.

---

## 🔥 Core Systems

### 1. The "Shift" Mechanic
The central pillar of gameplay. By pressing `SPACE`, the player toggles the **Ether Shift**—an overlay that reveals the hidden code of the world.
- **Normal Mode:** Standard physical collision. Walls are walls.
- **Shift Mode:** Reveals hidden logic. Walls may become transparent; hidden caches appear; reality distorts (CRT scanlines intensify).

### 2. Reactive Grid Engine
The world is built on a responsive 12x10 grid system that separates **Rendering** (React Components) from **Logic** (Hook-based Game Engine).
- **State:** Managed via a unified `GameState` object.
- **Rendering:** Tailwind CSS handles the "Retro CRT" aesthetic with scanlines, glow effects, and pixel-font typography.

### 3. Narrative Console
A persistent system log tracks every action, blending system notifications with narrative flavor text ("Operator" style).

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| **W / A / S / D** | Move Operator |
| **Arrow Keys** | Move Operator |
| **E / Enter** | Interact / Confirm |
| **Spacebar** | **Toggle Ether Shift** |

---

## 🛠️ Tech Stack

- **Core:** React 18 + TypeScript
- **Styling:** Tailwind CSS (Utility-first retro styling)
- **Icons:** Lucide React
- **Build:** Vite / Webpack (Standard React setup)

---

## 📂 Project Structure

```text
/
├── components/
│   ├── HUD/              # UI Overlays (Status bars, Log console)
│   └── WorldGrid.tsx     # The visual representation of the map
├── hooks/
│   └── useGameEngine.ts  # Core logic (Movement, State, Interaction)
├── constants.ts          # Config, Magic Numbers, and Map Generation
├── types.ts              # TypeScript Interfaces (Entity definitions)
├── App.tsx               # Main Layout & CRT Shader Effects
└── index.tsx             # Entry Point
```

---

## 🚀 Development Roadmap

This prototype represents **Phase 0** (Foundation).

- [x] **Phase 0:** Grid Engine, Movement, Shift Mechanic, Basic HUD.
- [ ] **Phase 1:** Scene Transitions & Multiple Zones.
- [ ] **Phase 2:** Combat System (Turn-based w/ Rune inputs).
- [ ] **Phase 3:** Save/Load System (Local Storage persistence).
- [ ] **Phase 4:** Narrative Engine (Branching dialogue).

---

## 📜 Lore: The Architect

In a multiverse shaped by fading empires and forgotten systems, a lone architect once built beyond his time. He forged a successor—**WesAI**—not in flesh, but in discipline and code.

You play as the **Architect**, reborn at Level 1. Your memory is fragmented. Your tools are primitive. But the instinct remains.

**Objective:** Rebuild the source code of reality.

---

*System Online. Neural link established.*
*Welcome back, Operator.*
