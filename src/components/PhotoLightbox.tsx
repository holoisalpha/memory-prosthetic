import { useState, useRef, useEffect } from 'react';

interface Props {
  src: string;
  onClose: () => void;
}

export function PhotoLightbox({ src, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset on close
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Get distance between two touch points
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between two touches
  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return null;
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Pinch start
      lastPinchDistanceRef.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1) {
      // Check for double tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap - toggle zoom
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      // Start drag if zoomed
      if (scale > 1) {
        setIsDragging(true);
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      if (newDistance && lastPinchDistanceRef.current) {
        const delta = newDistance / lastPinchDistanceRef.current;
        setScale(prev => Math.min(Math.max(prev * delta, 1), 5));
        lastPinchDistanceRef.current = newDistance;
      }
    } else if (e.touches.length === 1 && isDragging && lastTouchRef.current && scale > 1) {
      // Pan while zoomed
      const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
      const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length < 2) {
      lastPinchDistanceRef.current = null;
    }

    if (e.touches.length === 0) {
      setIsDragging(false);
      lastTouchRef.current = null;

      // Snap back if scale is 1
      if (scale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl z-10 p-2"
        onClick={onClose}
      >
        ×
      </button>

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-4 left-4 text-white/60 text-sm z-10">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Hint */}
      {scale === 1 && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-xs z-10">
          Pinch to zoom • Double-tap to enlarge
        </div>
      )}

      {/* Image */}
      <img
        src={src}
        alt=""
        className="max-w-full max-h-full object-contain select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        draggable={false}
      />
    </div>
  );
}
