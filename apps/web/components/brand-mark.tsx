"use client";

interface BrandMarkProperties {
  alt: string;
  size: number;
  src: string;
}

export const BrandMark = ({ alt, size, src }: BrandMarkProperties) => (
  <span
    aria-label={alt || undefined}
    className="brand-mark"
    role={alt ? "img" : undefined}
    style={{
      backgroundImage: `url(${src})`,
      height: size,
      width: size,
    }}
  />
);
