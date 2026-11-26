import { err, ok, type Result } from "@repo/core/result";
import type { StepFailure } from "../engine/run-failure";

/** One row of a CSV file, keyed by the names of the header row. */
export type CsvRecord = { readonly [column: string]: string };

interface Field {
  readonly value: string;
  /** Where the next field starts. */
  readonly next: number;
  readonly endsRow: boolean;
}

const QUOTE = '"';
const UNEXPECTED: StepFailure = { code: "unexpected_content" };

/** The delimiter of the header row: a semicolon when it has more of them than commas. */
function delimiterOf(text: string): string {
  const header = text.split("\n", 1)[0] ?? "";
  const count = (character: string) => header.split(character).length - 1;
  return count(";") > count(",") ? ";" : ",";
}

/** Where a field ends, and whether the row ends with it. */
function terminate(text: string, end: number, delimiter: string): Omit<Field, "value"> | null {
  const character = text[end];
  if (character === undefined) {
    return { next: end, endsRow: true };
  }
  if (character === delimiter) {
    return { next: end + 1, endsRow: false };
  }
  if (character === "\r" || character === "\n") {
    const crlf = character === "\r" && text[end + 1] === "\n";
    return { next: end + (crlf ? 2 : 1), endsRow: true };
  }
  return null;
}

/** A quoted field: doubled quotes are one quote, and line breaks belong to the value. */
function readQuoted(text: string, start: number, delimiter: string): Field | null {
  let value = "";
  let position = start + 1;
  for (;;) {
    const close = text.indexOf(QUOTE, position);
    if (close === -1) {
      return null;
    }
    value += text.slice(position, close);
    if (text[close + 1] !== QUOTE) {
      const end = terminate(text, close + 1, delimiter);
      return end === null ? null : { value, ...end };
    }
    value += QUOTE;
    position = close + 2;
  }
}

/** An unquoted field runs to the next delimiter or line break; spaces around it are dropped. */
function readField(text: string, start: number, delimiter: string): Field | null {
  if (text[start] === QUOTE) {
    return readQuoted(text, start, delimiter);
  }
  let end = start;
  while (end < text.length && !`${delimiter}\r\n`.includes(text.charAt(end))) {
    end += 1;
  }
  const ending = terminate(text, end, delimiter);
  return ending === null ? null : { value: text.slice(start, end).trim(), ...ending };
}

function parseRows(text: string, delimiter: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let position = 0;
  while (position < text.length) {
    const field = readField(text, position, delimiter);
    if (field === null) {
      return null;
    }
    row.push(field.value);
    position = field.next;
    if (field.endsRow) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    rows.push([...row, ""]);
  }
  return rows.filter((cells) => cells.length > 1 || cells[0] !== "");
}

/**
 * The records of a CSV file, keyed by its header row. The delimiter is a comma or a semicolon,
 * whichever the header uses more. A missing cell at the end of a row is empty; a row with more
 * cells than the header, a header that repeats a name, or a broken quote is refused.
 */
export function decodeCsv(text: string): Result<CsvRecord[], StepFailure> {
  const rows = parseRows(text, delimiterOf(text));
  const [header, ...body] = rows ?? [];
  if (header === undefined || new Set(header).size !== header.length) {
    return err(UNEXPECTED);
  }
  if (body.some((cells) => cells.length > header.length)) {
    return err(UNEXPECTED);
  }
  return ok(
    body.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]))),
  );
}
