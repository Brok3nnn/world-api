/** A copy-paste shell command that calls `url` with the API key from the environment. */
export function buildCurlCommand(url: string): string {
  return [`curl "${url}" \\`, `  -H "Authorization: Bearer $DATA_API_KEY"`].join("\n");
}
