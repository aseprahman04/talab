'use client';

import Image from 'next/image';
import { useTheme } from '../contexts/theme-context';

interface LogoProps {
  variant?: 'long' | 'square';
  height?: number;
  className?: string;
}

export default function Logo({ variant = 'long', height, className }: LogoProps) {
  const { theme } = useTheme();

  const src = theme === 'dark'
    ? `/logo_dark_${variant}.png`
    : `/logo_light_${variant}.png`;

  const displayHeight = height ?? (variant === 'long' ? 40 : 48);

  return (
    <Image
      src={src}
      alt="Talab"
      width={0}
      height={0}
      sizes="100vw"
      style={{ width: 'auto', height: `${displayHeight}px`, objectFit: 'contain' }}
      className={className}
      priority
    />
  );
}
