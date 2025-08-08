# 3D Bathroom Scene

A 3D interactive bathroom scene created with Three.js (version 0.160.0) featuring realistic fixtures and materials.

## Features

- **Room Dimensions**: 102" × 32" × 108" (length × width × height)
- **Walls**: Sherwin-Williams 'Secret Garden' green
- **Floor**: Medium brown wood finish
- **Trim**: White baseboards and door frames

## Fixtures Included

1. **Vanity**: 24" × 22.5" × 34" warm wood vanity with:
   - Three drawers with black round knobs
   - White countertop with integrated sink
   - Black three-piece faucet
   - Warm wood texture

2. **Mirror**: 26" × 30" wavy frame mirror above vanity (height adjustable)

3. **Vanity Light**: Black bar with two bell-shaped glass shades and warm lighting (height adjustable)

4. **Toilet**: 15" × 29" white toilet with tank, seat, and lid

5. **Cabinet**: 25" × 11.8" × 10" wood cabinet above toilet with:
   - Fluted texture doors
   - Two doors with black round knobs
   - Light wood finish matching vanity

6. **Door**: 28" × 80" white door on the 102" wall, hinged to swing toward vanity

7. **Towel Ring**: Black circular towel ring mounted on wall

8. **Baseboards**: White trim along all walls

## Controls

- **Mouse**: Rotate camera around the scene
- **Scroll**: Zoom in/out
- **Right-click + drag**: Pan the view

## Setup

1. Ensure you have a web server running
2. Open `index.html` in your browser
3. The scene will load with OrbitControls enabled

## Technical Details

- Built with Three.js 0.160.0
- Uses custom orbit-style controls for camera interaction
- Physically based rendering (MeshStandard/Physical), ACES tone mapping, soft shadows
- Optional PBR textures and HDRI loaded from `assets/`

## File Structure

```
bathroom-3d/
├── index.html          # Main HTML file
├── bathroom.js         # Three.js scene and logic
├── assets/             # Place PBR textures and HDRI here
└── README.md           # This file
``` 