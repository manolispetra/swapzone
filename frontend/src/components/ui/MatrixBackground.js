import { useEffect, useRef } from "react";

const CRYPTO_SYMBOLS = ["₿","Ξ","◎","⬡","∞","Z","S","W","0","1","Ω","Δ","λ","∑","⚡","◈","⟠","✦"];

export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const FONT_SIZE   = 14;
    const COLS        = Math.floor(W / FONT_SIZE);
    const drops       = Array(COLS).fill(1).map(() => Math.random() * -50);
    const speeds      = Array(COLS).fill(0).map(() => 0.3 + Math.random() * 0.5);
    const SYMBOLS     = "0123456789ABCDEF∑Ξ₿ΩΔ";

    // Floating crypto symbols
    const floaters = Array(18).fill(0).map((_, i) => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      sym:  CRYPTO_SYMBOLS[i % CRYPTO_SYMBOLS.length],
      size: 10 + Math.random() * 20,
      vx:   (Math.random() - 0.5) * 0.3,
      vy:   -0.1 - Math.random() * 0.2,
      alpha: 0.04 + Math.random() * 0.06,
    }));

    let animId;
    let frame = 0;

    function draw() {
      frame++;
      // Fade trail
      ctx.fillStyle = "rgba(10,10,10,0.06)";
      ctx.fillRect(0, 0, W, H);

      // Matrix rain
      ctx.font = `${FONT_SIZE}px 'Space Mono', monospace`;
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y < 0) { drops[i] += speeds[i]; continue; }

        // Head character — bright
        const headAlpha = 0.35;
        ctx.fillStyle = `rgba(0,255,209,${headAlpha})`;
        const ch = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        ctx.fillText(ch, i * FONT_SIZE, y);

        // Trail characters
        for (let t = 1; t < 4; t++) {
          const ty = y - t * FONT_SIZE;
          if (ty < 0) continue;
          const ta = headAlpha * (1 - t * 0.25);
          ctx.fillStyle = `rgba(0,200,160,${ta})`;
          ctx.fillText(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], i * FONT_SIZE, ty);
        }

        drops[i] += speeds[i];
        if (drops[i] * FONT_SIZE > H && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
        }
      }

      // Floating crypto symbols
      floaters.forEach(f => {
        ctx.font = `${f.size}px 'Rajdhani', sans-serif`;
        ctx.fillStyle = `rgba(132,88,255,${f.alpha})`;
        ctx.fillText(f.sym, f.x, f.y);
        f.x += f.vx;
        f.y += f.vy;
        if (f.y < -30)   { f.y = H + 10; f.x = Math.random() * W; }
        if (f.x < -30)   { f.x = W + 10; }
        if (f.x > W + 30){ f.x = -10; }
      });

      // Occasional horizontal scan line
      if (frame % 180 === 0) {
        const scanY = Math.random() * H;
        const grad = ctx.createLinearGradient(0, scanY, W, scanY);
        grad.addColorStop(0,   "rgba(0,255,209,0)");
        grad.addColorStop(0.5, "rgba(0,255,209,0.06)");
        grad.addColorStop(1,   "rgba(0,255,209,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY, W, 2);
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:  "fixed",
        top:       0,
        left:      0,
        width:     "100vw",
        height:    "100vh",
        zIndex:    0,
        pointerEvents: "none",
        opacity:   1,
      }}
    />
  );
}
