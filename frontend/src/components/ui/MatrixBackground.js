import { useEffect, useRef } from "react";

const SYMBOLS = ["₿","Ξ","◎","⬡","Z","S","∞","Ω","Δ","⚡","◈","➠","✦","◆","λ","∑","⬢","✧"];

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

    const floaters = Array.from({ length: 28 }, (_, i) => ({
      x:        Math.random() * W,
      y:        Math.random() * H,
      sym:      SYMBOLS[i % SYMBOLS.length],
      size:     12 + Math.random() * 22,
      vx:       (Math.random() - 0.5) * 0.25,
      vy:       -0.08 - Math.random() * 0.18,
      alpha:    0.03 + Math.random() * 0.07,
      color:    Math.random() > 0.5 ? "0,255,209" : "132,88,255",
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.005,
    }));

    let animId;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      floaters.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.font = f.size + "px 'Rajdhani', monospace";
        ctx.fillStyle = "rgba(" + f.color + "," + f.alpha + ")";
        ctx.fillText(f.sym, 0, 0);
        ctx.restore();
        f.x += f.vx;
        f.y += f.vy;
        f.rotation += f.rotSpeed;
        if (f.y < -40)    { f.y = H + 10; f.x = Math.random() * W; }
        if (f.x < -40)    { f.x = W + 10; }
        if (f.x > W + 40) { f.x = -10; }
      });
      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position:"fixed", top:0, left:0,
      width:"100vw", height:"100vh",
      zIndex:0, pointerEvents:"none",
    }} />
  );
}
