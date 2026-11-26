import { err, ok } from "@repo/core/result";
import { type HTMLElement, parse } from "node-html-parser";
import type { StepExecutor } from "../engine/step-executor";

/** Text as a person reads it: entities decoded, runs of white space made one space. */
function readableText(element: HTMLElement): string {
  return element.text.replace(/\s+/g, " ").trim();
}

/**
 * Elements whose content stays text, as browsers treat them. The parser's default also keeps
 * `pre` as text, which would hide the links of a preformatted listing.
 */
const TEXT_ONLY_ELEMENTS = { script: true, noscript: true, style: true };

/**
 * The elements a selector picks. A selector the parser cannot read picks nothing: it reports a
 * bad selector only by throwing.
 */
function select(html: string, selector: string): HTMLElement[] {
  try {
    return parse(html, { blockTextElements: TEXT_ONLY_ELEMENTS }).querySelectorAll(selector);
  } catch {
    return [];
  }
}

/**
 * Reads the text, or the `attr` attribute, of the first element an HTML result matches, or of
 * every match with `all`. Elements without the attribute are passed over; when nothing is left
 * the step fails with `selector_empty`.
 */
export const htmlSelect: StepExecutor<"html.select"> = async (step, { results }) => {
  const html = results.get(step.from);
  if (typeof html !== "string") {
    return err({ code: "unexpected_content" });
  }
  const values = select(html, step.selector).flatMap((element) => {
    const value = step.attr === undefined ? readableText(element) : element.getAttribute(step.attr);
    return value === undefined ? [] : [value];
  });
  const [first] = values;
  if (first === undefined) {
    return err({ code: "selector_empty" });
  }
  return ok({ value: step.all === true ? values : first });
};
