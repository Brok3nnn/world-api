"use client";

import { SectionNav } from "@/components/shared/section-nav";
import { DOC_SECTIONS } from "../constants";

/** On-page table of contents of the reference. */
export function DocsToc() {
  return <SectionNav label="On this page" sections={DOC_SECTIONS} />;
}
