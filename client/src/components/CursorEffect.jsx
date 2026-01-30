import React, { useEffect, useRef } from 'react';

const CursorEffect = ({ theme = 'dark' }) => {
    const canvasRef = useRef(null);
    const themeRef = useRef(theme);
    const particlesRef = useRef([]); // Use ref for particles to avoid re-renders
    const lastSpawnRef = useRef(0);

    // Keep ref updated
    useEffect(() => {
        themeRef.current = theme;
    }, [theme]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize if possible, but we need transparency for trails usually
        // Actually alpha: false might break trails if we don't clear properly. Keeping alpha true default.

        let width = window.innerWidth;
        let height = window.innerHeight;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1; // Slightly reduced speed
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.life = 1.0;
                this.decay = Math.random() * 0.03 + 0.02; // Faster decay
                const colors = ['#fbbf24', '#ef4444', '#22d3ee', '#d946ef', '#a855f7', '#3b82f6'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = Math.random() * 3 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1; // Gravity
                this.vx *= 0.95; // Drag
                this.life -= this.decay;
                this.size *= 0.90;
            }

            draw(context) {
                if (this.life < 0.1) return; // Skip invisible
                context.globalAlpha = this.life;
                context.fillStyle = this.color;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
                context.globalAlpha = 1;
            }
        }

        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastSpawnRef.current < 20) return; // Throttle: max 50fps spawning
            lastSpawnRef.current = now;

            // Reduce particle count per spawn
            for (let i = 0; i < 2; i++) {
                particlesRef.current.push(new Particle(e.clientX, e.clientY));
            }

            // Limit total particles
            if (particlesRef.current.length > 100) {
                particlesRef.current.shift();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId;

        const animate = () => {
            // Performance: Dynamic background clearing
            if (themeRef.current === 'dark') {
                ctx.fillStyle = 'rgba(3, 7, 18, 0.25)'; // Higher opacity = less trail = better perf visual? 
                // actually less trail = less overdraw feeling.
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            }

            ctx.fillRect(0, 0, width, height);

            // Only use lighter for dark mode, it's expensive
            if (themeRef.current === 'dark') {
                ctx.globalCompositeOperation = 'lighter';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update();
                p.draw(ctx);

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[0]" // Behind content
            style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply', opacity: 0.8 }} // Fix mix-blend for better visibility
        />
    );
};

export default CursorEffect;
