import Image from "next/image";
import Link from "next/link";
import parse, { type DOMNode, Element, domToReact } from "html-react-parser";
import { mediaUrl } from "@/lib/media";

/**
 * Renders text extracted from the old site. The HTML comes from our own
 * extraction script (not from visitors), so it is trusted. Images become
 * optimised <Image>s and internal links become client-side <Link>s.
 */
export function LegacyHtml({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div className={`legacy-content ${className}`}>
      {parse(html, {
        replace(node) {
          if (!(node instanceof Element)) return;
          if (node.name === "img") {
            const src = node.attribs.src.replace(/^legacy:/, "");
            const width = Number(node.attribs.width);
            const height = Number(node.attribs.height);
            return (
              <Image
                src={mediaUrl(src)}
                width={width}
                height={height}
                alt=""
                sizes="18rem"
                // Small old photos are not stretched beyond ~1.6× (they would turn blurry).
                style={{ maxWidth: Math.min(width * 1.6, 288) }}
                className="mx-auto h-auto w-full rounded-2xl border-4 border-white shadow-[var(--shadow-card)] ring-1 ring-gold/50"
              />
            );
          }
          if (node.name === "a" && node.attribs.href?.startsWith("/")) {
            return <Link href={node.attribs.href}>{domToReact(node.children as DOMNode[])}</Link>;
          }
        },
      })}
    </div>
  );
}
