'use client';

import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import type { ReactNode } from 'react';

interface SafeResponsiveContainerProps {
  children: ReactNode;
  debounce?: number;
}

export default function SafeResponsiveContainer({
  children,
  debounce = 50,
}: SafeResponsiveContainerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const nextWidth = wrapper.clientWidth;
      const nextHeight = wrapper.clientHeight;

      if (nextWidth > 0 && nextHeight > 0) {
        setSize((prev) => {
          if (prev?.width === nextWidth && prev.height === nextHeight) {
            return prev;
          }
          return { width: nextWidth, height: nextHeight };
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      {size ? (
        <ResponsiveContainer width={size.width} height={size.height} debounce={debounce}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
