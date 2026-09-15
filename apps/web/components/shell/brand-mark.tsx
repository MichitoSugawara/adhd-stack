import Image from "next/image";

export const BrandMark = ({ alt, src }: { alt: string; src: string }) => (
  <Image
    alt={alt}
    className="rounded-chip bg-surface shadow-hairline size-8"
    height={32}
    src={src}
    unoptimized
    width={32}
  />
);
