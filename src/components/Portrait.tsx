import Image from "next/image";
import { imageSize } from "@/content";
import { mediaUrl } from "@/lib/media";

/** A framed portrait with its caption lines (as on the old site's header). */
export function Portrait({
  image,
  lines,
  size = "md",
  tone = "dark",
}: {
  image: string;
  lines: string[];
  size?: "md" | "lg";
  tone?: "dark" | "light";
}) {
  const { width, height } = imageSize(image);
  return (
    <figure className="flex flex-col items-center text-center">
      <div
        className={`relative rounded-[2rem] bg-gradient-to-b from-gold-light via-gold to-saffron p-[3px] shadow-[0_10px_30px_-8px_rgb(0_0_0/0.45)] ${
          size === "lg" ? "w-40 sm:w-44" : "w-32 sm:w-36"
        }`}
      >
        <Image
          src={mediaUrl(image)}
          width={width}
          height={height}
          alt={lines.join(" ").trim()}
          sizes="11rem"
          priority
          className="h-auto w-full rounded-[1.85rem] bg-maroon-deep"
        />
      </div>
      <figcaption
        className={`mt-3 text-[0.82rem] leading-relaxed font-semibold ${tone === "dark" ? "text-gold-light" : "text-maroon"}`}
      >
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
