/* ============================================================
   EAGLOPEN — GRAVITYLAB ENGINE
   Mission: Touchdown — an interactive aerospace experience.
   The EAGLOPEN emblem becomes a descent capsule that lands on
   six worlds under real gravity, plus a Solar System survey
   mode. Vanilla JS, single canvas, zero dependencies.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("gl-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var wrap = canvas.parentElement;

  /* ---------- DOM refs ---------- */
  var hudBody = document.getElementById("gl-hud-body");
  var hudG = document.getElementById("gl-hud-g");
  var hudAlt = document.getElementById("gl-hud-alt");
  var hudVel = document.getElementById("gl-hud-vel");
  var hudTime = document.getElementById("gl-hud-time");
  var resultEl = document.getElementById("gl-result");
  var resultBadge = document.getElementById("gl-result-badge");
  var resultText = document.getElementById("gl-result-text");
  var hintEl = document.getElementById("gl-hint");
  var statusEl = document.getElementById("gl-status");
  var factEl = document.getElementById("gl-fact-text");
  var gmeterFill = document.getElementById("gl-gmeter-fill");
  var gmeterLabel = document.getElementById("gl-gmeter-label");
  var modePill = document.getElementById("gl-mode-pill");
  var consoleTitle = document.getElementById("gl-console-title");
  var dropBtn = document.getElementById("gl-drop");
  var orbitBtn = document.getElementById("gl-orbit-toggle");
  var landBtn = document.getElementById("gl-land");
  var worldBtns = Array.prototype.slice.call(document.querySelectorAll(".gl-world"));

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- World data (real surface gravity, m/s^2) ---------- */
  var WORLDS = {
    moon: {
      name: "The Moon", g: 1.62, rest: 0.42, vT: 0, gas: false, seed: 11,
      sky: ["#03050c", "#080d1a", "#141b2c"],
      ground: ["#9a9fac", "#5c6170", "#262b38"],
      dust: [200, 204, 214], terrain: "craters", decor: "earth", starAlpha: 1,
      fact: "The Moon&apos;s gravity is just <strong>0.17&times; Earth&apos;s</strong>. With no atmosphere to slow it down, the EAGLOPEN capsule falls in perfect silence &mdash; a hammer and a feather would land together, exactly as Apollo 15 proved in 1971."
    },
    mars: {
      name: "Mars", g: 3.71, rest: 0.4, vT: 60, gas: false, seed: 23,
      sky: ["#1c0f0c", "#4a2318", "#a05a35"],
      ground: ["#c4713f", "#8a4526", "#3d1d10"],
      dust: [214, 140, 90], terrain: "rocks", decor: "sun-small", starAlpha: 0.5,
      fact: "Mars pulls at <strong>0.38&times; Earth gravity</strong> through an atmosphere 100&times; thinner than ours &mdash; thick enough to burn up incoming landers, too thin to slow them. That&apos;s why NASA calls Mars landings &ldquo;seven minutes of terror.&rdquo;"
    },
    earth: {
      name: "Earth", g: 9.81, rest: 0.45, vT: 55, gas: false, seed: 37,
      sky: ["#0b1f3f", "#1b4573", "#e08a4a"],
      ground: ["#3f6d4e", "#2a4a37", "#12241c"],
      dust: [150, 170, 140], terrain: "hills", decor: "clouds", starAlpha: 0.35,
      fact: "Home baseline: <strong>9.81 m/s&sup2;</strong>. Earth&apos;s thick atmosphere gives falling objects a terminal velocity &mdash; drag balances gravity, which is the entire reason parachutes (and safe landings) are possible."
    },
    titan: {
      name: "Titan", g: 1.35, rest: 0.32, vT: 6, gas: false, seed: 53,
      sky: ["#2a1e08", "#6b4a12", "#b8862e"],
      ground: ["#8a6a34", "#5c451f", "#241a0a"],
      dust: [190, 160, 100], terrain: "dunes", decor: "saturn", starAlpha: 0.18,
      fact: "Titan is the aerospace engineer&apos;s dream: <strong>low gravity + an atmosphere denser than Earth&apos;s</strong>. Watch how slowly the capsule settles &mdash; ESA&apos;s Huygens probe drifted down for 2.5 hours. Here, you could fly by flapping strapped-on wings."
    },
    europa: {
      name: "Europa", g: 1.31, rest: 0.62, vT: 0, gas: false, seed: 71,
      sky: ["#040711", "#0a1226", "#1c2a4a"],
      ground: ["#c8d8ec", "#8aa2c4", "#3a4a6a"],
      dust: [210, 225, 245], terrain: "ice", decor: "jupiter", starAlpha: 1,
      fact: "Europa&apos;s icy crust hides a <strong>global liquid ocean</strong> with more water than all of Earth&apos;s seas combined. Gravity is lunar-light and the ice is hard &mdash; notice the higher bounce. NASA&apos;s Europa Clipper is on its way right now."
    },
    jupiter: {
      name: "Jupiter", g: 24.79, rest: 0.1, vT: 90, gas: true, seed: 89,
      sky: ["#170f0a", "#3a2416", "#7a4a2a"],
      ground: ["#c89a6a", "#a06a42", "#5a3a22"],
      dust: [220, 190, 150], terrain: "clouds", decor: "storm", starAlpha: 0.25,
      fact: "Jupiter has <strong>no surface at all</strong> &mdash; the capsule sinks into cloud tops at 2.5&times; Earth gravity. A 70 kg student would weigh 177 kg here. Below these clouds, pressure crushes hydrogen into a metallic ocean."
    }
  };
  var WORLD_KEYS = ["moon", "mars", "earth", "titan", "europa", "jupiter"];

  /* ---------- Solar System survey data ---------- */
  var SYSTEM = [
    { id: "mercury", name: "Mercury", g: 3.7, au: "0.39 AU", yr: "88 days", r: 3.2, orbit: 0.14, speed: 1.6, color: "#9c8f84", land: null,
      fact: "Mercury: <strong>3.7 m/s&sup2;</strong> &mdash; nearly identical to Mars despite being far smaller, because it&apos;s a dense ball of iron. Flyby survey only." },
    { id: "venus", name: "Venus", g: 8.87, au: "0.72 AU", yr: "225 days", r: 5, orbit: 0.2, speed: 1.17, color: "#d9b98a", land: null,
      fact: "Venus: <strong>0.9&times; Earth gravity</strong>, but its surface melts lead and crushes spacecraft within hours. No landing site for this mission." },
    { id: "earth", name: "Earth", g: 9.81, au: "1.00 AU", yr: "365 days", r: 5.4, orbit: 0.27, speed: 1, color: "#4a90c2", land: "earth", moon: true,
      fact: "Earth: our <strong>9.81 m/s&sup2;</strong> baseline &mdash; the only world where every EAGLOPEN engineer was trained. Descent available." },
    { id: "mars", name: "Mars", g: 3.71, au: "1.52 AU", yr: "687 days", r: 4.2, orbit: 0.35, speed: 0.81, color: "#c4713f", land: "mars",
      fact: "Mars: <strong>0.38&times; Earth gravity</strong> and the most-visited planet in the Solar System &mdash; every successful landing so far has been robotic. Descent available." },
    { id: "jupiter", name: "Jupiter", g: 24.79, au: "5.20 AU", yr: "11.9 yrs", r: 11, orbit: 0.5, speed: 0.44, color: "#c89a6a", land: "jupiter",
      fact: "Jupiter: the gravity king at <strong>24.79 m/s&sup2;</strong>. Its pull shields the inner planets by capturing comets. Cloud-top descent available." },
    { id: "saturn", name: "Saturn", g: 10.44, au: "9.58 AU", yr: "29.4 yrs", r: 9.4, orbit: 0.65, speed: 0.32, color: "#d9c08a", rings: true, land: null,
      fact: "Saturn: <strong>1.06&times; Earth gravity</strong> at the cloud tops, yet it&apos;s so light it would float in a bathtub big enough. Its moon Titan is on your landing list." },
    { id: "uranus", name: "Uranus", g: 8.87, au: "19.2 AU", yr: "84 yrs", r: 6.8, orbit: 0.79, speed: 0.23, color: "#8ac4d0", land: null,
      fact: "Uranus: <strong>0.9&times; Earth gravity</strong> and rolls around the Sun on its side &mdash; its seasons last 21 years each. Survey only." },
    { id: "neptune", name: "Neptune", g: 11.15, au: "30.1 AU", yr: "165 yrs", r: 6.6, orbit: 0.92, speed: 0.18, color: "#4a6fd0", land: null,
      fact: "Neptune: <strong>1.14&times; Earth gravity</strong> with the fastest winds ever measured &mdash; 2,100 km/h. It was discovered by mathematics before any telescope saw it." }
  ];
  var MOON_ORBIT = { name: "Moon", g: 1.62, r: 2, land: "moon" };

  /* ---------- Constants ---------- */
  var WORLD_METERS = 24;      // visible stage height below the drop ceiling
  var GROUND_FRAC = 0.8;      // ground line as fraction of canvas height
  var MAX_PARTICLES = reducedMotion ? 40 : 140;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- State ---------- */
  var W = 0, H = 0, ppm = 20, groundY = 0, emblemR = 34;
  var worldKey = "moon";
  var world = WORLDS[worldKey];
  var mode = "surface";       // 'surface' | 'orbit'
  var modeT = 0;              // 0 = surface, 1 = orbit
  var stars = [], terrain = [], orbitStars = [];
  var particles = [], rings = [];
  var shake = 0;
  var elapsed = 0;
  var running = false, inView = false, rafId = 0, lastTs = 0;
  var hudTick = 0;
  var autoDropped = false;
  var hintShown = true;
  var orbitAngles = SYSTEM.map(function (p, i) { return (i * 2.4) % (Math.PI * 2); });
  var moonAngle = 0;
  var hoverPlanet = -1, selectedPlanet = -1;

  var em = {
    x: 0, y: 0, vx: 0, vy: 0, ang: 0, angV: 0,
    state: "ready",           // ready | falling | settled | dragged
    t0: 0, fallTime: 0, squash: 0, entryHeat: 0
  };

  var drag = { on: false, px: 0, py: 0, lx: 0, ly: 0, vx: 0, vy: 0, lt: 0 };

  /* ---------- Emblem sprite (circular-clipped logo) ---------- */
  var emblemSprite = null;
  var logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.onload = buildEmblem;
  logo.onerror = buildEmblem;
  logo.src = "assets/images/hero/logo.jpg";

  function buildEmblem() {
    var size = 160;
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    var g = c.getContext("2d");
    g.save();
    g.beginPath();
    g.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
    g.clip();
    if (logo.complete && logo.naturalWidth > 0) {
      g.drawImage(logo, 0, 0, size, size);
    } else {
      g.fillStyle = "#1a1040";
      g.fillRect(0, 0, size, size);
      g.fillStyle = "#c7d5e8";
      g.font = "bold 64px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("E", size / 2, size / 2 + 4);
    }
    g.restore();
    // rim light
    g.beginPath();
    g.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    g.strokeStyle = "rgba(72, 202, 228, 0.9)";
    g.lineWidth = 3;
    g.stroke();
    emblemSprite = c;
  }

  /* ---------- Seeded RNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Scene generation ---------- */
  function buildScene() {
    var rnd = mulberry32(world.seed);
    stars = [];
    var n = Math.floor((W * H) / 6500);
    for (var i = 0; i < n; i++) {
      stars.push({
        x: rnd() * W, y: rnd() * groundY,
        r: 0.4 + rnd() * 1.1,
        tw: rnd() * Math.PI * 2,
        a: (0.3 + rnd() * 0.7) * world.starAlpha
      });
    }
    terrain = [];
    if (world.terrain === "craters") {
      for (i = 0; i < 7; i++) {
        terrain.push({ x: rnd() * W, y: groundY + 14 + rnd() * (H - groundY - 24), rx: 12 + rnd() * 34, ry: 4 + rnd() * 8 });
      }
    } else if (world.terrain === "rocks") {
      for (i = 0; i < 14; i++) {
        terrain.push({ x: rnd() * W, y: groundY + 8 + rnd() * (H - groundY - 14), s: 3 + rnd() * 9 });
      }
    } else if (world.terrain === "dunes" || world.terrain === "hills") {
      for (i = 0; i < 4; i++) {
        terrain.push({ y: groundY + 10 + i * ((H - groundY - 14) / 4), amp: 3 + rnd() * 5, ph: rnd() * Math.PI * 2, fr: 0.008 + rnd() * 0.01 });
      }
    } else if (world.terrain === "ice") {
      for (i = 0; i < 9; i++) {
        var sx = rnd() * W;
        terrain.push({ x1: sx, y1: groundY + rnd() * (H - groundY), x2: sx + (rnd() - 0.5) * 180, y2: groundY + rnd() * (H - groundY) });
      }
    }
    // orbit backdrop stars (fixed seed)
    var rnd2 = mulberry32(7);
    orbitStars = [];
    var n2 = Math.floor((W * H) / 5200);
    for (i = 0; i < n2; i++) {
      orbitStars.push({ x: rnd2() * W, y: rnd2() * H, r: 0.4 + rnd2() * 1.2, tw: rnd2() * Math.PI * 2, a: 0.25 + rnd2() * 0.75 });
    }
  }

  /* ---------- Layout ---------- */
  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(canvas.clientHeight || rect.height));
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    groundY = H * GROUND_FRAC;
    ppm = groundY / WORLD_METERS;
    emblemR = Math.max(22, Math.min(44, H * 0.075));
    buildScene();
    if (em.state === "ready") resetEmblem();
    draw(0);
  }

  function resetEmblem() {
    em.x = W / 2;
    em.y = H * 0.16;
    em.vx = 0; em.vy = 0;
    em.ang = 0; em.angV = 0;
    em.state = "ready";
    em.squash = 0;
    em.entryHeat = 0;
    elapsed = 0;
  }

  /* ---------- Mission helpers ---------- */
  function metersAlt() {
    return Math.max(0, (groundY - emblemR - em.y) / ppm);
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function setFact(html) {
    factEl.innerHTML = html;
  }

  function updateGMeter(g, name) {
    var maxG = 26;
    gmeterFill.style.width = Math.min(100, (g / maxG) * 100).toFixed(1) + "%";
    gmeterLabel.innerHTML = "g: <strong>" + g.toFixed(2) + " m/s&sup2;</strong> &middot; " + (g / 9.81).toFixed(2) + "&times; Earth";
    hudBody.textContent = name.toUpperCase();
    hudG.textContent = g.toFixed(2) + " m/s\u00b2";
  }

  function hideHint() {
    if (hintShown) {
      hintShown = false;
      hintEl.classList.add("is-hidden");
    }
  }

  function showResult(vImpact) {
    var hard = vImpact >= 15;
    resultEl.classList.toggle("is-hard", hard);
    resultBadge.textContent = hard ? "HARD IMPACT" : "TOUCHDOWN";
    resultText.innerHTML =
      "impact velocity: " + vImpact.toFixed(1) + " m/s<br />descent time: " + em.fallTime.toFixed(1) + " s";
    resultEl.classList.add("is-visible");
    setStatus(hard
      ? "impact at " + vImpact.toFixed(1) + " m/s \u2014 recommend retro-thrusters next time"
      : "touchdown confirmed at " + vImpact.toFixed(1) + " m/s \u2713");
  }

  /* ---------- World switching ---------- */
  function setWorld(key, silent) {
    worldKey = key;
    world = WORLDS[key];
    buildScene();
    resetEmblem();
    resultEl.classList.remove("is-visible");
    updateGMeter(world.g, world.name);
    setFact(world.fact);
    consoleTitle.textContent = "mission_touchdown.py \u2014 " + world.name.replace("The ", "").toUpperCase();
    canvas.setAttribute("aria-label",
      "Gravity simulation: the EAGLOPEN emblem descending onto " + world.name +
      " at " + world.g + " meters per second squared.");
    worldBtns.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-world") === key);
    });
    if (!silent) setStatus("relocated to " + world.name + " \u2014 standing by\u2026");
  }

  function dropEmblem(x, y) {
    if (mode !== "surface") return;
    if (typeof x === "number") {
      em.x = Math.max(emblemR, Math.min(W - emblemR, x));
      em.y = Math.min(y, groundY - emblemR * 2.2);
      em.y = Math.max(emblemR, em.y);
    } else {
      em.x = W / 2;
      em.y = H * 0.16;
    }
    em.vx = 0; em.vy = 0;
    em.angV = (Math.random() - 0.5) * 1.6;
    em.state = "falling";
    em.fallTime = 0;
    resultEl.classList.remove("is-visible");
    setStatus("descent in progress\u2026");
    hideHint();
  }

  /* ---------- Particles ---------- */
  function spawnDust(x, y, power) {
    var count = Math.min(MAX_PARTICLES - particles.length, Math.floor(8 + power * 3));
    var d = world.dust;
    for (var i = 0; i < count; i++) {
      var a = Math.PI + Math.random() * Math.PI; // upward fan
      var sp = (0.6 + Math.random()) * power * 0.35 * ppm * 0.12;
      particles.push({
        x: x + (Math.random() - 0.5) * emblemR,
        y: y,
        vx: Math.cos(a) * sp * (Math.random() < 0.5 ? 1 : -1),
        vy: Math.sin(a) * sp,
        r: 1 + Math.random() * 2.6,
        life: 1,
        decay: 0.9 + Math.random() * 1.4,
        col: d
      });
    }
    rings.push({ x: x, y: y, r: emblemR * 0.6, max: emblemR * (2 + power * 0.25), life: 1 });
  }

  /* ---------- Physics ---------- */
  function stepPhysics(dt) {
    if (em.state === "falling") {
      em.fallTime += dt;
      var gpx = world.g * ppm;
      var ay = gpx;
      // atmospheric drag toward terminal velocity
      if (world.vT > 0) {
        var vTpx = world.vT * ppm;
        ay -= gpx * (em.vy * Math.abs(em.vy)) / (vTpx * vTpx);
        em.vx *= 1 - Math.min(1, dt * 1.2);
      }
      em.vy += ay * dt;
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      em.ang += em.angV * dt;
      em.entryHeat = world.vT > 0 ? Math.min(1, Math.abs(em.vy) / ppm / 30) : 0;

      // walls
      if (em.x < emblemR) { em.x = emblemR; em.vx = Math.abs(em.vx) * 0.6; }
      if (em.x > W - emblemR) { em.x = W - emblemR; em.vx = -Math.abs(em.vx) * 0.6; }

      var floor = groundY - emblemR;
      if (em.y >= floor) {
        var vImp = Math.abs(em.vy) / ppm;
        if (world.gas) {
          // no solid surface: sink into cloud deck, buoyancy pushes back
          if (em.y > floor + emblemR * 0.9) {
            em.y = floor + emblemR * 0.9;
          }
          em.vy -= (em.y - floor) * 18 * dt;   // buoyant spring
          em.vy *= 1 - Math.min(1, dt * 3);    // heavy damping
          em.vx *= 1 - Math.min(1, dt * 3);
          if (Math.abs(em.vy) < 6 && em.fallTime > 0.4 && em.state === "falling") {
            if (vImp > 1.5) spawnDust(em.x, groundY, Math.min(20, vImp));
            em.state = "settled";
            showResult(vImp);
          }
        } else {
          em.y = floor;
          if (vImp > 1.2) {
            spawnDust(em.x, groundY, Math.min(20, vImp));
            if (!reducedMotion) shake = Math.min(1, vImp / 18);
            em.squash = Math.min(0.35, vImp * 0.02);
            em.vy = -em.vy * world.rest;
            em.vx *= 0.82;
            em.angV = em.vx / emblemR;
          } else {
            em.vy = 0;
            em.vx *= 0.6;
            if (Math.abs(em.vx) < 3) {
              em.vx = 0;
              em.state = "settled";
              em.angV = 0;
              showResult(Math.abs(em.fallVImpact || 0) || vImp);
            }
          }
          if (em.fallVImpact === undefined || vImp > em.fallVImpact) em.fallVImpact = vImp;
        }
      }
      // ceiling from a hard fling
      if (em.y < -emblemR * 3) { em.y = -emblemR * 3; em.vy = Math.abs(em.vy) * 0.4; }
    } else if (em.state === "settled" && !world.gas) {
      em.fallVImpact = undefined;
    } else if (em.state === "ready") {
      em.fallVImpact = undefined;
    }
    if (em.state !== "falling") em.entryHeat = 0;

    em.squash *= 1 - Math.min(1, dt * 6);

    // particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += world.g * ppm * 0.35 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > groundY + 4) { p.y = groundY + 4; p.vy *= -0.3; }
    }
    for (i = rings.length - 1; i >= 0; i--) {
      var rg = rings[i];
      rg.life -= dt * 1.6;
      rg.r += (rg.max - rg.r) * dt * 5;
      if (rg.life <= 0) rings.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 2.2);
  }

  /* ---------- Orbit-mode physics ---------- */
  function stepOrbit(dt) {
    var rate = reducedMotion ? 0.02 : 0.12;
    for (var i = 0; i < SYSTEM.length; i++) {
      orbitAngles[i] += SYSTEM[i].speed * rate * dt * 2;
    }
    moonAngle += dt * 1.1;
  }

  /* ---------- Drawing: surface scene ---------- */
  function drawSurface(t) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, world.sky[0]);
    sky.addColorStop(0.6, world.sky[1]);
    sky.addColorStop(1, world.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY + 2);

    // stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.a * (reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(t * 1.8 + s.tw));
      if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    drawDecor(t);

    // ground
    var gr = ctx.createLinearGradient(0, groundY, 0, H);
    gr.addColorStop(0, world.ground[0]);
    gr.addColorStop(0.35, world.ground[1]);
    gr.addColorStop(1, world.ground[2]);
    ctx.fillStyle = gr;
    ctx.fillRect(0, groundY, W, H - groundY);

    // horizon glow
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(0, groundY, W, 1.5);

    drawTerrain(t);
    drawAltScale();

    // shockwave rings
    for (i = 0; i < rings.length; i++) {
      var rgn = rings[i];
      ctx.globalAlpha = rgn.life * 0.5;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(rgn.x, rgn.y, rgn.r, rgn.r * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // dust particles
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life) * 0.85;
      ctx.fillStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + ",1)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawEmblem(t);
  }

  function drawDecor(t) {
    var cx, cy, r, g;
    if (world.decor === "earth") {
      cx = W * 0.82; cy = groundY * 0.28; r = Math.min(W, H) * 0.055;
      g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, "#7ab8e8");
      g.addColorStop(0.65, "#2a6aa8");
      g.addColorStop(1, "#123a5e");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy - r * 0.25, r * 0.5, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
    } else if (world.decor === "saturn") {
      cx = W * 0.78; cy = groundY * 0.3; r = Math.min(W, H) * 0.085;
      ctx.fillStyle = "#c9a86a";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(220,195,140,0.75)";
      ctx.lineWidth = r * 0.16;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.7, r * 0.4, -0.35, 0, Math.PI * 2); ctx.stroke();
    } else if (world.decor === "jupiter") {
      cx = W * 0.76; cy = groundY * 0.32; r = Math.min(W, H) * 0.12;
      g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      g.addColorStop(0, "#d9b088");
      g.addColorStop(1, "#8a5a38");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "rgba(120,70,40,0.5)";
      ctx.fillRect(cx - r, cy - r * 0.35, r * 2, r * 0.18);
      ctx.fillRect(cx - r, cy + r * 0.1, r * 2, r * 0.14);
      ctx.fillStyle = "rgba(200,90,60,0.6)";
      ctx.beginPath(); ctx.ellipse(cx + r * 0.35, cy + r * 0.38, r * 0.22, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (world.decor === "sun-small") {
      cx = W * 0.24; cy = groundY * 0.24; r = Math.min(W, H) * 0.028;
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
      g.addColorStop(0, "rgba(255,240,215,0.95)");
      g.addColorStop(0.3, "rgba(255,225,190,0.4)");
      g.addColorStop(1, "rgba(255,225,190,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff2dd";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    } else if (world.decor === "clouds") {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      var drift = reducedMotion ? 0 : (t * 5) % (W + 240);
      ctx.beginPath(); ctx.ellipse(((W * 0.2 + drift) % (W + 240)) - 120, groundY * 0.42, 90, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(((W * 0.65 + drift * 0.6) % (W + 240)) - 120, groundY * 0.28, 120, 17, 0, 0, Math.PI * 2); ctx.fill();
    } else if (world.decor === "storm") {
      var driftS = reducedMotion ? 0 : t * 8;
      ctx.fillStyle = "rgba(255,235,210,0.05)";
      for (var b = 0; b < 3; b++) {
        var yy = groundY * (0.3 + b * 0.18);
        ctx.beginPath();
        ctx.ellipse(((W * 0.3 + driftS * (1 + b * 0.4)) % (W + 300)) - 150, yy, 130, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTerrain(t) {
    var i, f;
    if (world.terrain === "craters") {
      for (i = 0; i < terrain.length; i++) {
        f = terrain[i];
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(f.x, f.y - 1, f.rx, f.ry, 0, Math.PI, Math.PI * 2); ctx.stroke();
      }
    } else if (world.terrain === "rocks") {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      for (i = 0; i < terrain.length; i++) {
        f = terrain[i];
        ctx.beginPath();
        ctx.moveTo(f.x - f.s, f.y + f.s * 0.4);
        ctx.lineTo(f.x - f.s * 0.3, f.y - f.s * 0.6);
        ctx.lineTo(f.x + f.s * 0.5, f.y - f.s * 0.3);
        ctx.lineTo(f.x + f.s, f.y + f.s * 0.4);
        ctx.closePath();
        ctx.fill();
      }
    } else if (world.terrain === "dunes" || world.terrain === "hills") {
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 1.5;
      for (i = 0; i < terrain.length; i++) {
        f = terrain[i];
        ctx.beginPath();
        for (var x = 0; x <= W; x += 14) {
          var y = f.y + Math.sin(x * f.fr + f.ph) * f.amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (world.terrain === "ice") {
      ctx.strokeStyle = "rgba(90,60,80,0.32)";
      ctx.lineWidth = 1.4;
      for (i = 0; i < terrain.length; i++) {
        f = terrain[i];
        ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      }
    } else if (world.terrain === "clouds") {
      // gas giant: soft animated cloud deck edge
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      var dr = reducedMotion ? 0 : t * 12;
      for (i = 0; i < 5; i++) {
        var cy2 = groundY + 8 + i * ((H - groundY - 12) / 5);
        ctx.beginPath();
        ctx.ellipse(((i * 173 + dr * (0.6 + i * 0.2)) % (W + 260)) - 130, cy2, 110, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawAltScale() {
    // scientific altitude ticks on the left edge
    ctx.strokeStyle = "rgba(72,202,228,0.25)";
    ctx.fillStyle = "rgba(72,202,228,0.45)";
    ctx.lineWidth = 1;
    ctx.font = "9px 'SF Mono', Consolas, monospace";
    ctx.textAlign = "left";
    for (var m = 0; m <= WORLD_METERS; m += 6) {
      var y = groundY - m * ppm;
      if (y < 8) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(m % 12 === 0 ? 14 : 8, y);
      ctx.stroke();
      if (m % 12 === 0 && m > 0) ctx.fillText(m + "m", 17, y + 3);
    }
  }

  function drawEmblem(t) {
    var bobY = em.state === "ready" && !reducedMotion ? Math.sin(t * 1.6) * 5 : 0;
    var ex = em.x;
    var ey = em.y + bobY;

    // drop-target guide while ready
    if (em.state === "ready") {
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = "rgba(72,202,228,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, ey + emblemR + 6);
      ctx.lineTo(ex, groundY - 3);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(72,202,228,0.5)";
      ctx.beginPath();
      ctx.ellipse(ex, groundY, emblemR * 1.15, emblemR * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ground contact shadow
    var altFrac = Math.max(0, Math.min(1, 1 - metersAlt() / WORLD_METERS));
    ctx.globalAlpha = 0.12 + altFrac * 0.3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(ex, groundY + 2, emblemR * (0.5 + altFrac * 0.7), emblemR * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // atmospheric entry heat trail
    if (em.entryHeat > 0.25) {
      var hg = ctx.createLinearGradient(ex, ey - emblemR * 3.2, ex, ey);
      hg.addColorStop(0, "rgba(255,140,50,0)");
      hg.addColorStop(1, "rgba(255,180,80," + (em.entryHeat * 0.55).toFixed(2) + ")");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(ex - emblemR * 0.7, ey);
      ctx.lineTo(ex, ey - emblemR * 3.2);
      ctx.lineTo(ex + emblemR * 0.7, ey);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(em.ang);
    var sq = em.squash;
    ctx.scale(1 + sq, 1 - sq);
    if (emblemSprite) {
      ctx.drawImage(emblemSprite, -emblemR, -emblemR, emblemR * 2, emblemR * 2);
    } else {
      ctx.fillStyle = "#1a1040";
      ctx.beginPath(); ctx.arc(0, 0, emblemR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- Drawing: solar system scene ---------- */
  function planetPos(i) {
    var maxR = Math.min(W, H) * 0.52;
    var p = SYSTEM[i];
    return {
      x: W / 2 + Math.cos(orbitAngles[i]) * p.orbit * maxR * (W > H ? 1.55 : 1),
      y: H / 2 + Math.sin(orbitAngles[i]) * p.orbit * maxR * 0.86
    };
  }

  function drawOrbit(t) {
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < orbitStars.length; i++) {
      var s = orbitStars[i];
      ctx.globalAlpha = s.a * (reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(t * 1.5 + s.tw));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    var maxR = Math.min(W, H) * 0.52;
    var stretchX = W > H ? 1.55 : 1;

    // orbit paths
    ctx.strokeStyle = "rgba(72,202,228,0.12)";
    ctx.lineWidth = 1;
    for (i = 0; i < SYSTEM.length; i++) {
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, SYSTEM[i].orbit * maxR * stretchX, SYSTEM[i].orbit * maxR * 0.86, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // sun
    var sg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 46);
    sg.addColorStop(0, "rgba(255,240,200,1)");
    sg.addColorStop(0.25, "rgba(255,205,120,0.9)");
    sg.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffe9b8";
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 11, 0, Math.PI * 2); ctx.fill();

    ctx.font = "10px 'SF Mono', Consolas, monospace";
    ctx.textAlign = "center";

    for (i = 0; i < SYSTEM.length; i++) {
      var p = SYSTEM[i];
      var pos = planetPos(i);
      var pr = p.r * Math.max(0.8, Math.min(1.3, W / 900));

      if (i === hoverPlanet || i === selectedPlanet) {
        ctx.strokeStyle = i === selectedPlanet ? "#d4b86a" : "rgba(72,202,228,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, pr + 7, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, pr, 0, Math.PI * 2); ctx.fill();

      if (p.rings) {
        ctx.strokeStyle = "rgba(220,195,140,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(pos.x, pos.y, pr * 1.9, pr * 0.55, -0.3, 0, Math.PI * 2); ctx.stroke();
      }
      if (p.moon) {
        var mx = pos.x + Math.cos(moonAngle) * (pr + 9);
        var my = pos.y + Math.sin(moonAngle) * (pr + 9);
        ctx.fillStyle = "#b8bcc8";
        ctx.beginPath(); ctx.arc(mx, my, MOON_ORBIT.r, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = i === selectedPlanet ? "#d4b86a" : "rgba(199,213,232,0.7)";
      ctx.fillText(p.name.toUpperCase(), pos.x, pos.y + pr + 16);
    }
  }

  /* ---------- Master draw ---------- */
  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var sx = 0, sy = 0;
    if (shake > 0 && !reducedMotion) {
      sx = (Math.random() - 0.5) * shake * 9;
      sy = (Math.random() - 0.5) * shake * 9;
    }

    if (modeT <= 0.001) {
      ctx.save(); ctx.translate(sx, sy);
      drawSurface(t);
      ctx.restore();
    } else if (modeT >= 0.999) {
      drawOrbit(t);
    } else {
      // seamless zoom crossfade between surface and orbital survey
      var e = modeT < 0.5 ? 2 * modeT * modeT : 1 - Math.pow(-2 * modeT + 2, 2) / 2;
      ctx.save();
      ctx.globalAlpha = 1 - e;
      ctx.translate(W / 2, H / 2);
      ctx.scale(1 + e * 0.7, 1 + e * 0.7);
      ctx.translate(-W / 2, -H / 2);
      drawSurface(t);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(W / 2, H / 2);
      var zo = 1.5 - e * 0.5;
      ctx.scale(zo, zo);
      ctx.translate(-W / 2, -H / 2);
      drawOrbit(t);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- HUD ---------- */
  function updateHUD() {
    if (mode === "surface") {
      hudAlt.textContent = metersAlt().toFixed(1) + " m";
      hudVel.textContent = (Math.abs(em.vy) / ppm).toFixed(1) + " m/s";
      hudTime.textContent = em.state === "falling" ? "T+" + em.fallTime.toFixed(1) + "s" : "\u2014";
    }
  }

  /* ---------- Main loop ---------- */
  function frame(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    elapsed += dt;

    // mode transition
    var target = mode === "orbit" ? 1 : 0;
    if (modeT !== target) {
      var speed = reducedMotion ? 8 : 1.6;
      modeT += (target > modeT ? 1 : -1) * dt * speed;
      modeT = Math.max(0, Math.min(1, modeT));
    }

    if (modeT < 1) stepPhysics(dt);
    if (modeT > 0) stepOrbit(dt);

    draw(elapsed);

    hudTick += dt;
    if (hudTick > 0.08) { hudTick = 0; updateHUD(); }

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !inView || document.hidden) return;
    running = true;
    lastTs = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  /* ---------- Mode switching ---------- */
  function enterOrbit() {
    mode = "orbit";
    selectedPlanet = -1;
    hoverPlanet = -1;
    landBtn.classList.remove("is-visible");
    modePill.textContent = "MODE: ORBITAL SURVEY";
    consoleTitle.textContent = "solar_system_survey.py \u2014 EAGLOPEN";
    orbitBtn.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i> Return to Surface';
    dropBtn.disabled = true;
    setStatus("orbital survey active \u2014 select a world");
    setFact("You are viewing the Solar System from above. <strong>Select any world</strong> to read its gravity profile &mdash; worlds marked for descent can be landed on. Orbital speeds follow Kepler&apos;s law: the closer to the Sun, the faster the orbit.");
    canvas.setAttribute("aria-label", "Solar System survey: eight planets orbiting the Sun. Select a planet to view its gravity profile.");
    hideHint();
  }

  function exitOrbit(landKey) {
    mode = "surface";
    modePill.textContent = "MODE: SURFACE";
    orbitBtn.innerHTML = '<i class="fas fa-satellite" aria-hidden="true"></i> Solar System';
    dropBtn.disabled = false;
    landBtn.classList.remove("is-visible");
    if (landKey) {
      setWorld(landKey, true);
      setStatus("descent trajectory locked \u2014 arriving at " + WORLDS[landKey].name);
      // dramatic arrival: drop as soon as the transition lands
      setTimeout(function () {
        if (mode === "surface") dropEmblem();
      }, reducedMotion ? 150 : 850);
    } else {
      setWorld(worldKey, true);
      setStatus("returned to surface operations \u2014 standing by\u2026");
    }
  }

  /* ---------- Pointer interaction ---------- */
  function canvasPoint(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", function (e) {
    var pt = canvasPoint(e);
    if (mode === "orbit" || modeT > 0.5) {
      // planet picking
      var best = -1, bestD = 26;
      for (var i = 0; i < SYSTEM.length; i++) {
        var pos = planetPos(i);
        var d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
        if (d < bestD + SYSTEM[i].r) { bestD = d; best = i; }
      }
      if (best >= 0) {
        selectedPlanet = best;
        var p = SYSTEM[best];
        setFact(p.fact + " &mdash; distance: <strong>" + p.au + "</strong> &middot; year: <strong>" + p.yr + "</strong>");
        updateGMeter(p.g, p.name);
        setStatus(p.land ? p.name + " selected \u2014 descent available" : p.name + " selected \u2014 flyby survey only");
        landBtn.classList.toggle("is-visible", !!p.land);
        if (p.land) landBtn.setAttribute("data-land", p.land);
      }
      return;
    }
    // surface mode: grab the emblem or reposition-drop
    var dEm = Math.hypot(pt.x - em.x, pt.y - em.y);
    if (dEm <= emblemR * 1.3) {
      drag.on = true;
      em.state = "dragged";
      em.vx = 0; em.vy = 0; em.angV = 0;
      drag.lx = pt.x; drag.ly = pt.y; drag.lt = performance.now();
      drag.vx = 0; drag.vy = 0;
      canvas.classList.add("is-grabbing");
      canvas.setPointerCapture(e.pointerId);
      resultEl.classList.remove("is-visible");
      hideHint();
    } else {
      dropEmblem(pt.x, pt.y);
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    var pt = canvasPoint(e);
    if (drag.on) {
      var now = performance.now();
      var dtm = Math.max(8, now - drag.lt);
      drag.vx = ((pt.x - drag.lx) / dtm) * 1000;
      drag.vy = ((pt.y - drag.ly) / dtm) * 1000;
      drag.lx = pt.x; drag.ly = pt.y; drag.lt = now;
      em.x = Math.max(emblemR, Math.min(W - emblemR, pt.x));
      em.y = Math.min(pt.y, groundY - emblemR);
      em.y = Math.max(emblemR * 0.5, em.y);
    } else if (mode === "orbit" && modeT > 0.5) {
      var best = -1, bestD = 24;
      for (var i = 0; i < SYSTEM.length; i++) {
        var pos = planetPos(i);
        var d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
        if (d < bestD + SYSTEM[i].r) { bestD = d; best = i; }
      }
      hoverPlanet = best;
      canvas.style.cursor = best >= 0 ? "pointer" : "crosshair";
    }
  });

  function endDrag(e) {
    if (!drag.on) return;
    drag.on = false;
    canvas.classList.remove("is-grabbing");
    em.state = "falling";
    em.fallTime = 0;
    em.vx = Math.max(-900, Math.min(900, drag.vx));
    em.vy = Math.max(-900, Math.min(900, drag.vy));
    em.angV = em.vx / emblemR * 0.5;
    setStatus("capsule released \u2014 descent in progress\u2026");
    if (e && e.pointerId !== undefined) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* ---------- Controls ---------- */
  worldBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-world");
      if (mode === "orbit") {
        exitOrbit(key);
      } else {
        setWorld(key);
      }
      hideHint();
    });
  });

  dropBtn.addEventListener("click", function () {
    dropEmblem();
  });

  orbitBtn.addEventListener("click", function () {
    if (mode === "surface") enterOrbit();
    else exitOrbit(null);
  });

  landBtn.addEventListener("click", function () {
    var key = landBtn.getAttribute("data-land");
    if (key) exitOrbit(key);
  });

  /* ---------- Lifecycle: only run while visible ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      inView = entry.isIntersecting;
      if (inView) {
        start();
        if (!autoDropped) {
          autoDropped = true;
          setTimeout(function () {
            if (mode === "surface" && em.state === "ready") dropEmblem();
          }, 700);
        }
      } else {
        stop();
      }
    });
  }, { threshold: 0.15 });
  io.observe(wrap);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  /* ---------- Boot ---------- */
  resize();
  setWorld("moon", true);
  setStatus("standing by\u2026");
  updateHUD();
})();
