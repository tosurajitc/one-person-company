'use client'

import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// HeroGlowBackground
// Layer 1: slow drifting aurora glow + a light sweep that runs across the banner
// Layer 2: a neural network of drifting nodes; signals "fire" from node to node
// Layer 3: a breathing glow along the bottom edge (green core, faint orange rim)
//
// Drop it inside a `relative overflow-hidden` section, before the content.
// Content wrapper needs `relative` so it stays above this layer.
// Colours come from the page palette: leaf #a7f3c0, bottle #0a4836, orange #f97316.
// ─────────────────────────────────────────────────────────────

const LEAF = '167,243,192'
const LINK_DISTANCE = 150
const MAX_PULSES = 9
const MAX_HOPS = 6

export default function HeroGlowBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let nodes = []
    let pulses = []
    let raf = 0
    let running = false
    let lastTime = 0

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round(Math.min(90, Math.max(26, (w * h) / 15000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1 + Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2,
      }))
      pulses = []
    }

    function buildLinks() {
      const links = []
      const adj = nodes.map(() => [])
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.hypot(dx, dy)
          if (d < LINK_DISTANCE) {
            links.push([i, j, d])
            adj[i].push(j)
            adj[j].push(i)
          }
        }
      }
      return { links, adj }
    }

    function frame(time) {
      const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.05)
      lastTime = time
      ctx.clearRect(0, 0, w, h)

      // Move nodes
      if (!reduceMotion) {
        for (const n of nodes) {
          n.x += n.vx * dt * 60
          n.y += n.vy * dt * 60
          if (n.x < -10) n.x = w + 10
          if (n.x > w + 10) n.x = -10
          if (n.y < -10) n.y = h + 10
          if (n.y > h + 10) n.y = -10
        }
      }

      const { links, adj } = buildLinks()

      // Connections
      ctx.lineWidth = 1
      for (const [i, j, d] of links) {
        const alpha = (1 - d / LINK_DISTANCE) * 0.3
        ctx.strokeStyle = `rgba(${LEAF},${alpha})`
        ctx.beginPath()
        ctx.moveTo(nodes[i].x, nodes[i].y)
        ctx.lineTo(nodes[j].x, nodes[j].y)
        ctx.stroke()
      }

      // Nodes, gently breathing
      for (const n of nodes) {
        const breathe = 0.55 + 0.35 * Math.sin(time / 1200 + n.phase)
        ctx.fillStyle = `rgba(${LEAF},${breathe})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Signals travelling along connections
      if (!reduceMotion) {
        if (pulses.length < MAX_PULSES && links.length && Math.random() < 1.8 * dt) {
          const [a, b] = links[Math.floor(Math.random() * links.length)]
          pulses.push({ a, b, t: 0, hops: 0 })
        }

        pulses = pulses.filter((p) => {
          const A = nodes[p.a]
          const B = nodes[p.b]
          const dist = Math.hypot(B.x - A.x, B.y - A.y) || 1
          if (dist > LINK_DISTANCE * 1.25) return false

          p.t += (150 * dt) / dist
          if (p.t >= 1) {
            // Fire onward to a neighbour of the node we just reached
            const options = adj[p.b].filter((k) => k !== p.a)
            if (!options.length || p.hops >= MAX_HOPS) return false
            p.a = p.b
            p.b = options[Math.floor(Math.random() * options.length)]
            p.t = 0
            p.hops += 1
            return true
          }

          const x = A.x + (B.x - A.x) * p.t
          const y = A.y + (B.y - A.y) * p.t
          const g = ctx.createRadialGradient(x, y, 0, x, y, 12)
          g.addColorStop(0, `rgba(${LEAF},0.95)`)
          g.addColorStop(0.35, `rgba(${LEAF},0.35)`)
          g.addColorStop(1, `rgba(${LEAF},0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(x, y, 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.95)'
          ctx.beginPath()
          ctx.arc(x, y, 1.6, 0, Math.PI * 2)
          ctx.fill()
          return true
        })
      }

      if (running && !reduceMotion) raf = requestAnimationFrame(frame)
    }

    function start() {
      if (running || reduceMotion) return
      running = true
      lastTime = performance.now()
      raf = requestAnimationFrame(frame)
    }

    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    resize()
    if (reduceMotion) {
      frame(performance.now()) // one static frame
    }

    // Pause when the hero is scrolled out of view
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    )
    io.observe(canvas.parentElement)

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        if (reduceMotion) frame(performance.now())
      }, 150)
    }
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      io.disconnect()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="hg-root" aria-hidden="true">
      <div className="hg-aurora hg-aurora-a" />
      <div className="hg-aurora hg-aurora-b" />
      <div className="hg-sweep" />
      <canvas ref={canvasRef} className="hg-canvas" />
      <div className="hg-floor" />

      <style jsx global>{`
        .hg-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        /* Soft blobs of light drifting slowly behind everything */
        .hg-aurora {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          will-change: transform;
        }
        .hg-aurora-a {
          top: -20%;
          left: -8%;
          width: 46rem;
          height: 46rem;
          background: radial-gradient(circle, rgba(167, 243, 192, 0.32), rgba(167, 243, 192, 0) 65%);
          animation: hg-drift-a 22s ease-in-out infinite alternate;
        }
        .hg-aurora-b {
          bottom: -30%;
          right: -10%;
          width: 52rem;
          height: 52rem;
          background: radial-gradient(circle, rgba(16, 120, 88, 0.55), rgba(16, 120, 88, 0) 65%);
          animation: hg-drift-b 28s ease-in-out infinite alternate;
        }

        /* A broad band of light that runs across the banner */
        .hg-sweep {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 55%;
          left: -55%;
          background: linear-gradient(
            100deg,
            rgba(167, 243, 192, 0) 0%,
            rgba(167, 243, 192, 0.13) 45%,
            rgba(201, 242, 216, 0.2) 50%,
            rgba(167, 243, 192, 0.13) 55%,
            rgba(167, 243, 192, 0) 100%
          );
          filter: blur(28px);
          animation: hg-sweep 11s ease-in-out infinite;
          will-change: transform;
        }

        /* Network fades toward the centre so the headline stays readable */
        .hg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          -webkit-mask-image: radial-gradient(ellipse 60% 55% at 50% 45%, rgba(0, 0, 0, 0.3) 0%, #000 78%);
          mask-image: radial-gradient(ellipse 60% 55% at 50% 45%, rgba(0, 0, 0, 0.3) 0%, #000 78%);
        }

        /* Breathing glow along the bottom edge */
        .hg-floor {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 45%;
          background:
            radial-gradient(ellipse 55% 100% at 50% 100%, rgba(167, 243, 192, 0.3), rgba(167, 243, 192, 0) 70%),
            radial-gradient(ellipse 30% 60% at 50% 100%, rgba(249, 115, 22, 0.16), rgba(249, 115, 22, 0) 75%);
          animation: hg-breathe 7s ease-in-out infinite;
        }

        @keyframes hg-drift-a {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(14rem, 8rem, 0) scale(1.15); }
        }
        @keyframes hg-drift-b {
          from { transform: translate3d(0, 0, 0) scale(1.1); }
          to   { transform: translate3d(-16rem, -6rem, 0) scale(0.95); }
        }
        @keyframes hg-sweep {
          0%   { transform: translateX(0); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(300%); opacity: 0; }
        }
        @keyframes hg-breathe {
          0%, 100% { opacity: 0.55; transform: scaleY(0.9); transform-origin: bottom; }
          50%      { opacity: 1;    transform: scaleY(1.08); transform-origin: bottom; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hg-aurora, .hg-sweep, .hg-floor { animation: none; }
          .hg-sweep { display: none; }
        }
      `}</style>
    </div>
  )
}