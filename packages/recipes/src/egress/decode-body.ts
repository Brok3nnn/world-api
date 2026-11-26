const CHARSET = /;\s*charset="?([^";\s]+)"?/i;
/** Labels of the single-byte charset whose bytes are the first 256 code points. */
const LATIN_1 = new Set(["iso-8859-1", "latin1", "l1", "iso_8859-1"]);
/** Bytes turned into characters at a time, well below any argument limit. */
const SLICE = 8192;

function decodeLatin1(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let start = 0; start < bytes.length; start += SLICE) {
    parts.push(String.fromCharCode(...bytes.subarray(start, start + SLICE)));
  }
  return parts.join("");
}

/**
 * The text of a body in the charset its content type declares. Latin-1 is decoded byte for
 * byte; anything else is read as UTF-8, the encoding every runtime decodes.
 */
export function decodeBody(bytes: Uint8Array, contentType: string | null): string {
  const charset = CHARSET.exec(contentType ?? "")?.[1]?.toLowerCase();
  return charset !== undefined && LATIN_1.has(charset)
    ? decodeLatin1(bytes)
    : new TextDecoder("utf-8").decode(bytes);
}
