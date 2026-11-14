import type { Metadata } from "next";
import { LegacyHtml } from "@/components/LegacyHtml";
import { PageShell } from "@/components/PageShell";
import { pages } from "@/content";
import { PledgeForm } from "./PledgeForm";

export const metadata: Metadata = { title: "सदस्य-शपथ पत्र" };

// The old page ends with three labels, each followed by a blank line to fill in.
const html = pages.sapathpatra.html!;
const FIELD = /([^<>]+?)\s*<br>\s*<span class="blank"><\/span>/g;
const labels = [...html.matchAll(FIELD)].map((m) => m[1].trim());
const formStart = html.search(FIELD);
if (labels.length !== 3 || formStart < 0) throw new Error("Shapath Patra form labels not found in the old page");

export default function ShapathPatraPage() {
  return (
    <PageShell slug="sapathpatra">
      <LegacyHtml html={html.slice(0, formStart)} />
      <PledgeForm labels={labels as [string, string, string]} />
    </PageShell>
  );
}
