import { useEffect, useState } from 'react';

interface Props {
  show: boolean;
  onComplete: () => void;
}

export function SaveCelebration({ show, onComplete }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Generate gentle floating particles
      const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#fed7aa'];
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 40 + Math.random() * 20, // Center-ish
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setParticles(newParticles);

      // Clean up after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Gentle center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-32 h-32 rounded-full bg-amber-400/20 transition-all duration-500 ${
            show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          style={{ filter: 'blur(20px)' }}
        />
      </div>

      {/* Checkmark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`bg-white rounded-full p-4 shadow-lg transition-all duration-300 ${
            show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              className={show ? 'animate-draw-check' : ''}
            />
          </svg>
        </div>
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-float-up"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.id * 50}ms`
          }}
        />
      ))}

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
        @keyframes draw-check {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }
        .animate-draw-check {
          animation: draw-check 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
