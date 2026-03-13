/* ============================================================
   Hogwarts 360° Viewer
   Tech: Three.js (WebGL) — Sphere projection + drag controls
   ============================================================ */

(function () {
  "use strict";

  // ── Config ─────────────────────────────────────────────────
  const CONFIG = {
    imagePath: "images/plywood.png",
    sphereRadius: 500,
    fovDefault: 75,
    fovMin: 30,
    fovMax: 100,
    zoomStep: 10,            // FOV change per button click
    autoRotateSpeed: 0.08,   // degrees per frame
    dragSensitivity: 0.25,
    inertiaDamping: 0.92,
    initialYaw: 180,         // start facing the castle
    initialPitch: 0,
  };

  // ── State ───────────────────────────────────────────────────
  const state = {
    isDragging: false,
    autoRotate: true,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    yaw: CONFIG.initialYaw,
    pitch: CONFIG.initialPitch,
    fov: CONFIG.fovDefault,
    targetFov: CONFIG.fovDefault,
  };

  // ── DOM refs ────────────────────────────────────────────────
  const canvas      = document.getElementById("canvas");
  const loader      = document.getElementById("loader");
  const loaderBar   = document.getElementById("loaderBar");
  const hint        = document.getElementById("hint");
  const hintText    = document.getElementById("hintText");
  const btnAutoRot  = document.getElementById("btnAutoRotate");
  const btnReset    = document.getElementById("btnReset");
  const btnFull     = document.getElementById("btnFullscreen");
  const btnZoomIn   = document.getElementById("btnZoomIn");
  const btnZoomOut  = document.getElementById("btnZoomOut");
  const compassRing = document.getElementById("compassRing");

  // ── Three.js setup ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CONFIG.fovDefault,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 0.001); // tiny offset to avoid gimbal

  // ── Sphere (inside-out) ─────────────────────────────────────
  const geometry = new THREE.SphereGeometry(CONFIG.sphereRadius, 64, 32);
  // Flip normals so we see the inside of the sphere
  geometry.scale(-1, 1, 1);

  const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const sphere   = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // ── Load texture with progress ──────────────────────────────
  const loadingManager = new THREE.LoadingManager();

  loadingManager.onProgress = (url, loaded, total) => {
    const pct = Math.round((loaded / total) * 100);
    loaderBar.style.width = pct + "%";
  };

  loadingManager.onLoad = () => {
    loaderBar.style.width = "100%";
    setTimeout(() => {
      loader.classList.add("hidden");
      // Hide hint after 5 seconds
      setTimeout(() => hint.classList.add("fade-out"), 5000);
    }, 600);
  };

  const texLoader = new THREE.TextureLoader(loadingManager);
  texLoader.load(
    CONFIG.imagePath,
    (texture) => {
      texture.minFilter = THREE.LinearFilter;
      material.map = texture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
    },
    (xhr) => {
      // progress is handled by loadingManager
    },
    (err) => {
      hintText.textContent =
        "Could not load image — place the image in /images/";
      loaderBar.style.background = "#e8541a";
      loaderBar.style.width = "100%";
      setTimeout(() => loader.classList.add("hidden"), 1500);
    }
  );

  // ── Camera update from yaw/pitch ────────────────────────────
  function updateCamera() {
    // Clamp pitch so you can't flip upside down
    state.pitch = Math.max(-85, Math.min(85, state.pitch));

    const yawRad   = THREE.MathUtils.degToRad(state.yaw);
    const pitchRad = THREE.MathUtils.degToRad(state.pitch);

    // Convert spherical to cartesian — camera always at origin looking outward
    const target = new THREE.Vector3(
      Math.cos(pitchRad) * Math.sin(yawRad),
      Math.sin(pitchRad),
      Math.cos(pitchRad) * Math.cos(yawRad)
    );

    camera.lookAt(target);

    // Update compass — rotate opposite to yaw
    compassRing.style.transform = `rotate(${-state.yaw}deg)`;
  }

  // ── Smooth FOV zoom ─────────────────────────────────────────
  function updateFov() {
    state.fov += (state.targetFov - state.fov) * 0.1;
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
  }

  // ── Animation loop ──────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    if (state.autoRotate && !state.isDragging) {
      state.yaw += CONFIG.autoRotateSpeed;
    }

    // Apply inertia when not dragging
    if (!state.isDragging) {
      state.yaw   += state.velocityX;
      state.pitch += state.velocityY;
      state.velocityX *= CONFIG.inertiaDamping;
      state.velocityY *= CONFIG.inertiaDamping;
    }

    updateCamera();
    updateFov();
    renderer.render(scene, camera);
  }

  animate();

  // ── Mouse / Touch drag ──────────────────────────────────────
  function onPointerDown(e) {
    state.isDragging = true;
    state.velocityX  = 0;
    state.velocityY  = 0;
    const pt = e.touches ? e.touches[0] : e;
    state.lastX = pt.clientX;
    state.lastY = pt.clientY;
  }

  function onPointerMove(e) {
    if (!state.isDragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - state.lastX;
    const dy = pt.clientY - state.lastY;

    state.velocityX = -dx * CONFIG.dragSensitivity;
    state.velocityY =  dy * CONFIG.dragSensitivity;

    state.yaw   -= dx * CONFIG.dragSensitivity;
    state.pitch +=  dy * CONFIG.dragSensitivity;

    state.lastX = pt.clientX;
    state.lastY = pt.clientY;
  }

  function onPointerUp() {
    state.isDragging = false;
  }

  // Scroll / pinch zoom
  function onWheel(e) {
    e.preventDefault();
    state.targetFov = Math.max(
      CONFIG.fovMin,
      Math.min(CONFIG.fovMax, state.targetFov + e.deltaY * 0.05)
    );
  }

  // Touch pinch zoom
  let lastPinchDist = 0;
  function onTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist) {
        state.targetFov = Math.max(
          CONFIG.fovMin,
          Math.min(CONFIG.fovMax, state.targetFov - (dist - lastPinchDist) * 0.1)
        );
      }
      lastPinchDist = dist;
    }
  }

  canvas.addEventListener("mousedown",  onPointerDown);
  canvas.addEventListener("mousemove",  onPointerMove);
  canvas.addEventListener("mouseup",    onPointerUp);
  canvas.addEventListener("mouseleave", onPointerUp);
  canvas.addEventListener("touchstart", onPointerDown, { passive: true });
  canvas.addEventListener("touchmove",  onTouchMove,   { passive: false });
  canvas.addEventListener("touchmove",  onPointerMove, { passive: true });
  canvas.addEventListener("touchend",   onPointerUp);
  canvas.addEventListener("wheel",      onWheel, { passive: false });

  // ── Control buttons ─────────────────────────────────────────
  btnAutoRot.addEventListener("click", () => {
    state.autoRotate = !state.autoRotate;
    btnAutoRot.classList.toggle("active", state.autoRotate);
    hintText.textContent = state.autoRotate
      ? "Auto-rotate on · Drag to explore"
      : "Auto-rotate off · Drag to explore";
    hint.classList.remove("fade-out");
    setTimeout(() => hint.classList.add("fade-out"), 3000);
  });

  btnAutoRot.classList.add("active"); // default on

  btnReset.addEventListener("click", () => {
    state.yaw       = CONFIG.initialYaw;
    state.pitch     = CONFIG.initialPitch;
    state.targetFov = CONFIG.fovDefault;
    state.velocityX = 0;
    state.velocityY = 0;
  });

  // ── Zoom buttons ─────────────────────────────────────────────
  // Zoom in = smaller FOV (narrow field = things look bigger)
  // Zoom out = larger FOV (wide field = things look smaller)
  btnZoomIn.addEventListener("click", () => {
    state.targetFov = Math.max(CONFIG.fovMin, state.targetFov - CONFIG.zoomStep);
  });

  btnZoomOut.addEventListener("click", () => {
    state.targetFov = Math.min(CONFIG.fovMax, state.targetFov + CONFIG.zoomStep);
  });

  btnFull.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // ── Resize ──────────────────────────────────────────────────
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // ── Keyboard controls ────────────────────────────────────────
  window.addEventListener("keydown", (e) => {
    const speed = 2;
    if (e.key === "ArrowLeft")  state.yaw   += speed;
    if (e.key === "ArrowRight") state.yaw   -= speed;
    if (e.key === "ArrowUp")    state.pitch += speed;
    if (e.key === "ArrowDown")  state.pitch -= speed;
    if (e.key === "+") state.targetFov = Math.max(CONFIG.fovMin, state.targetFov - 5);
    if (e.key === "-") state.targetFov = Math.min(CONFIG.fovMax, state.targetFov + 5);
    if (e.key === "r" || e.key === "R") {
      state.yaw   = CONFIG.initialYaw;
      state.pitch = CONFIG.initialPitch;
    }
  });

})();