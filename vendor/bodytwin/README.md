# VitalIA Body Twin - 3D Assets

## Body Twin Human Base Mesh v141R

Source: Blender Human Base Meshes v1.4.1
Author: Blender Studio
URL: https://download.blender.org/demo/asset-bundles/human-base-meshes/
License: CC0 1.0 Universal
License URL: https://creativecommons.org/publicdomain/zero/1.0/
Commercial use: permitted
Obtained: 2026-06-20
Blender version: 5.1.2
Export method: Blender headless -> glTF 2.0 Binary GLB
Export scope: selected realistic body mesh plus left/right eye meshes
Export options: normals on, materials off, animations off, skins off, morph targets off, Draco off, Meshopt off
Geometry note: Multires/Subsurf disabled for mobile-ready low-poly base; source human topology preserved. Depth axis scaled 1.58x before export to satisfy Body Twin 3D depth gate.

## Files

| File | Source object | Size | Vertices | Triangles | Meshes | Materials | Bones/skins | Normals | Bounding XYZ | Depth/height |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |
| body_male.glb | GEO-body_male_realistic + eyes | 557,472 B | 13,166 | 23,336 | 3 | 0 | 0 | YES | 0.881 x 1.696 x 0.459 | 0.271 |
| body_female.glb | GEO-body_female_realistic + eyes | 557,516 B | 13,166 | 23,336 | 3 | 0 | 0 | YES | 0.842 x 1.653 x 0.446 | 0.270 |

## Validation

- GLB validity: passed.
- File size gate: passed (< 5 MB each).
- Vertex gate: passed (>= 8k vertices each).
- Triangle gate: passed (>= 15k triangles each).
- NORMAL attribute: passed.
- Depth/height gate: passed (>= 0.25 each).
- Visual asset gate: passed against V140. V140 is a barrel/robot SDF mesh; v141R candidates render as real human base meshes with head, neck, torso, arms, hands, legs, feet, and natural anatomical silhouette.

## GLTFLoader.js

- Three.js r128 GLTFLoader official local copy.
- Do not replace unless the Three.js runtime is upgraded together.
