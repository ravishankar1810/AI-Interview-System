import React, { useEffect, useRef } from 'react';

const SmokeBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Configuration
    const particleCount = 40; // Number of smoke puffs
    const particles = [];
    // Colors matching your theme: Neon Cyan, Primary Blue, Accent Purple
    const colors = [
      '6, 182, 212',  // Neon (#06b6d4)
      '59, 130, 246', // Primary (#3b82f6)
      '139, 92, 246'  // Accent (#8b5cf6)
    ];

    class Particle {
      constructor() {
        this.reset();
        // Start randomly on screen for initial load
        this.y = Math.random() * canvas.height; 
        this.opacity = Math.random() * 0.5;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + (Math.random() * 100); // Start below screen
        this.size = Math.random() * 150 + 100; // Large puffy size
        this.speedY = Math.random() * 0.5 + 0.2; // Slow rising speed
        this.speedX = Math.random() * 0.4 - 0.2; // Slight horizontal drift
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.2 + 0.1; // Transparency limit
        this.life = 0;
        this.maxLife = Math.random() * 200 + 300;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.life++;

        // Fade in logic
        if (this.life < 50) {
          this.opacity += 0.005;
        } 
        // Fade out logic near top or end of life
        else if (this.life > this.maxLife - 50) {
          this.opacity -= 0.005;
        }

        if (this.life >= this.maxLife || this.opacity <= 0 || this.y < -this.size) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        // Create a radial gradient for "soft smoke" look
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0, 
          this.x, this.y, this.size
        );
        
        gradient.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`); // Transparent edge

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Optional: Add a dark overlay to blend trails slightly (optional)
      // ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none -z-0"
      style={{ filter: 'blur(30px)' }} // Extra blur for "dreamy" smoke effect
    />
  );
};

export default SmokeBackground;