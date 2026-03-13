# 🏰 Hogwarts 360° Viewer

A Three.js powered immersive 360° panoramic viewer built with vanilla HTML, CSS, and JavaScript.

---

## 📁 Folder Structure

```
hogwarts-360/
│
├── index.html        ← Main HTML shell + loader + UI overlay
├── style.css         ← All styles (loader, UI, controls, compass)
├── viewer.js         ← All Three.js logic + interactions + particles
│
└── images/
    └── image.jpg  ← Your panoramic image (place it here)
```

---

## 🚀 How to Run

**Option 1 — VS Code Live Server (recommended)**
1. Open the folder in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Done ✅

**Option 2 — Python server**
```bash
cd hogwarts-360
python -m http.server 3000
# open http://localhost:3000
```

**Option 3 — Node.js**
```bash
npx serve .
```

> ⚠️ You MUST use a local server — browsers block loading local images directly due to CORS.

---

## 🎮 Controls

| Action | Control |
|---|---|
| Look around | Click + Drag / Touch drag |
| Zoom in/out | Scroll wheel / Pinch |
| Navigate | Arrow keys |
| Toggle auto-rotate | ⟳ button |
| Reset view | ⌖ button |
| Fullscreen | ⛶ button |
| Keyboard zoom | + / - keys |
| Keyboard reset | R key |

---

## 🧠 How It Works (the key concept)

```
1. A sphere is created in 3D space (radius: 500 units)
2. The sphere's normals are FLIPPED inside-out using geometry.scale(-1, 1, 1)
3. Your image is mapped as a texture on the INSIDE of the sphere
4. The camera sits at the CENTER of the sphere
5. When you drag, the camera rotates — not the sphere
6. Result: you appear to be standing inside the scene, looking around 360°
```

---

## 🔄 Using a Real 360° Photo

For a true spherical 360 experience, replace `hogwarts.jpg` with an **equirectangular** panoramic image.

Free sources:
- https://polyhaven.com/hdris — free HDR panoramas
- Search "equirectangular" on Flickr (filter by Creative Commons)

The image should have a 2:1 aspect ratio (e.g. 4096×2048) for perfect spherical mapping.

---

## 🛠 Tech Stack

| Tech | Role |
|---|---|
| Three.js (r128) | 3D rendering via WebGL |
| SphereGeometry | The 360° sphere container |
| TextureLoader | Loading the image as a WebGL texture |
| Canvas 2D API | Ember particle system overlay |
| Vanilla JS | All interaction logic |
| Google Fonts (Cinzel) | UI typography |

---

## ➕ Ideas to Extend This

- Add hotspots (click a point → show info popup)
- Load multiple scenes and link them together (virtual tour)
- Add a minimap showing current viewing direction  
- Use device gyroscope on mobile (`DeviceOrientationEvent`)
- Wrap it in Next.js as a reusable `<PanoViewer />` component