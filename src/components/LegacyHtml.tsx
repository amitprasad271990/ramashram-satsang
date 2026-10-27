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
                sizes="(min-width: 768px) 18rem, 80vw"
                className="mx-auto h-auto w-full max-w-72 rounded-2xl shadow-[var(--shadow-card)]"
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
