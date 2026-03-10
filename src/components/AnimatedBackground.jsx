import React, { useEffect, useRef, useMemo } from 'react';
import './AnimatedBackground.css';

// Particle Network Component matching bit-hemant.me
const ParticleNetwork = () => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const rafId = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;

        const initCanvas = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Create particles based on screen size (approx 1 particle per 10000 sq px)
            const numParticles = Math.min(Math.floor((width * height) / 12000), 100);
            particles.current = Array.from({ length: numParticles }).map(() => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8, // subtle velocity
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 1.5 + 0.5,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const pts = particles.current;

            // Base color depending on theme (we'll just use a subtle semi-transparent white/gray)
            // The mix-blend-mode and glassmorphism will blend it nicely.
            const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
            const baseGrayscale = isLightMode ? 0 : 255;

            ctx.fillStyle = `rgba(${baseGrayscale}, ${baseGrayscale}, ${baseGrayscale}, 0.5)`;

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges smoothly
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Draw dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Connect to nearby particles
                for (let j = i + 1; j < pts.length; j++) {
                    const p2 = pts[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    // Connect if within 150px (22500 distSq)
                    if (distSq < 20000) {
                        const opacity = 1 - Math.sqrt(distSq) / 141; // fade out near edge
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${baseGrayscale}, ${baseGrayscale}, ${baseGrayscale}, ${opacity * 0.25})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            rafId.current = requestAnimationFrame(draw);
        };

        initCanvas();
        draw();

        window.addEventListener('resize', initCanvas);

        return () => {
            window.removeEventListener('resize', initCanvas);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="particles-canvas"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0, // Under the glass overlay
                pointerEvents: 'none'
            }}
        />
    );
};

export default function AnimatedBackground() {
    const blob1Ref = useRef(null);
    const blob2Ref = useRef(null);
    const blob3Ref = useRef(null);
    const rafId = useRef(null);

    useEffect(() => {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;

        // Smoothed positions for the blobs (lerping)
        const currentPos = {
            blob1: { x: mouseX, y: mouseY },
            blob2: { x: mouseX, y: mouseY },
            blob3: { x: mouseX, y: mouseY }
        };

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            // Different lerp speeds for deep parallax effect
            currentPos.blob1.x += (mouseX - currentPos.blob1.x) * 0.04;
            currentPos.blob1.y += (mouseY - currentPos.blob1.y) * 0.04;

            currentPos.blob2.x += (mouseX - window.innerWidth * 0.2 - currentPos.blob2.x) * 0.015;
            currentPos.blob2.y += (mouseY - window.innerHeight * 0.2 - currentPos.blob2.y) * 0.015;

            currentPos.blob3.x += (mouseX + window.innerWidth * 0.3 - currentPos.blob3.x) * 0.008;
            currentPos.blob3.y += (mouseY + window.innerHeight * 0.3 - currentPos.blob3.y) * 0.008;

            if (blob1Ref.current) {
                blob1Ref.current.style.transform = `translate(calc(${currentPos.blob1.x}px - 50 %), calc(${currentPos.blob1.y}px - 50 %))`;
            }
            if (blob2Ref.current) {
                blob2Ref.current.style.transform = `translate(calc(${currentPos.blob2.x}px - 50 %), calc(${currentPos.blob2.y}px - 50 %))`;
            }
            if (blob3Ref.current) {
                blob3Ref.current.style.transform = `translate(calc(${currentPos.blob3.x}px - 50 %), calc(${currentPos.blob3.y}px - 50 %))`;
            }

            rafId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <div className="animated-bg-container">
            {/* Dynamic tracking orbs */}
            <div className="bg-blob bg-blob-1" ref={blob1Ref}></div>
            <div className="bg-blob bg-blob-2" ref={blob2Ref}></div>
            <div className="bg-blob bg-blob-3" ref={blob3Ref}></div>

            {/* Static ambient orbs for flavor */}
            <div className="bg-blob bg-blob-static-1"></div>
            <div className="bg-blob bg-blob-static-2"></div>

            {/* Canvas Particle Network matching bit-hemant.me */}
            <ParticleNetwork />

            {/* Noise filter overlay for texture */}
            <div className="bg-noise"></div>

            {/* Heavy glassmorphism blur overlay */}
            <div className="bg-glass-overlay"></div>
        </div>
    );
}
