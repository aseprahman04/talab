'use client';

import Image from 'next/image';
import { useTheme } from '../contexts/theme-context';

interface LogoProps {
  variant?: 'long' | 'square';
  height?: number;
  className?: string;
}

const DIMENSIONS = {
  long:   { width: 320, height: 80 },
  square: { width: 160, height: 160 },
};

export default function Logo({ variant = 'long', height, className }: LogoProps) {
  const { theme } = useTheme();

  const src = theme === 'dark'
    ? `/logo_dark_${variant}.png`
    : `/logo_light_${variant}.png`;

  const base = DIMENSIONS[variant];
  const displayHeight = height ?? (variant === 'long' ? 40 : 48);
  const displayWidth = Math.round((base.width / base.height) * displayHeight);

  return (
    <Image
      src={src}
      alt="Talab"
      width={displayWidth}
      height={displayHeight}
      className={className}
      priority
    />
  );
}
