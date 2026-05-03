import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-production.jpg";

export function ParallaxHeroBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Parallax layers move at different speeds
  const farY = scrollY * 0.15;
  const midY = scrollY * 0.35;
  const nearY = scrollY * 0.6;
  const farScale = 1 + scrollY * 0.0002;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-950">
      {/* Far layer: hero image, slow drift + subtle zoom */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${-farY}px, 0) scale(${farScale})`,
          transition: "transform 0.05s linear",
        }}
      >
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-[120%] object-cover opacity-40"
        />
      </div>

      {/* Mid layer: animated gradient orbs */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${-midY}px, 0)` }}
      >
        <div className="absolute top-1/4 left-1/3 w-[40rem] h-[40rem] rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-2/3 right-1/4 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      {/* Near layer: dark vignette + grain */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${-nearY}px, 0)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/75 to-slate-950/95" />
      </div>

      {/* Static top-and-bottom fade for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />
    </div>
  );
}
