import Image from "next/image";

export const BrandMark = ({ alt, src }: { alt: string; src: string }) => (
  <span className="rounded-chip shadow-hairline inline-flex size-8 items-center justify-center bg-[#e8eee8]">
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
