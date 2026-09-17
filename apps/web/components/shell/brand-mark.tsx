import Image from "next/image";

export const BrandMark = ({ alt, src }: { alt: string; src: string }) => (
  <span className="rounded-chip shadow-hairline bg-surface inline-flex size-8 items-center justify-center">
    <Image
      alt={alt}
      className="size-5"
      height={20}
      src={src}
      unoptimized
      width={20}
    />
  </span>
);
