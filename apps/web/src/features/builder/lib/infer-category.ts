import type { CategoryId } from "@/features/catalog/types";
import { CATEGORY_KEYWORDS } from "../constants";

const FALLBACK_CATEGORY: CategoryId = "knowledge";

/** Files a natural-language request under the first category whose keywords it mentions. */
export function inferCategory(request: string): CategoryId {
  const text = request.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => text.includes(keyword)),
  );
  return match?.category ?? FALLBACK_CATEGORY;
}
