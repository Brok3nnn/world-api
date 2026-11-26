// @ts-check
/*
 * Enforces the structural limits of docs/conventions.md that the linter cannot see:
 * document sizes, document titles, relative links, the number of files per folder, and that no
 * source file is hidden from the repository by an ignore rule.
 *
 * It looks at the files Git knows about (tracked, or untracked and not ignored), so it checks
 * exactly what a commit would contain.
 *
 * Usage: node scripts/check-structure.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const CODE_ROOTS = ["apps", "packages", "scripts"];
/** Folders that hold what people write by hand. Nothing in them may be ignored by Git. */
const SOURCE_FOLDERS = ["apps/*/src/**", "packages/*/src/**", "scripts", "docs"];
/** Folders whose files are assets, not units of code, and may be numerous. */
const UNCOUNTED_FOLDER = /(^|\/)(public|migrations)(\/|$)/;
const MAX_FILES_PER_FOLDER = 25;
const DEFAULT_DOCUMENT_LINES = 250;
const DOCUMENT_LIMITS = [
  { pattern: /^README\.md$/, lines: 400 },
  { pattern: /^docs\/decisions\/\d{4}-[^/]+\.md$/, lines: 80 },
  { pattern: /^(apps|packages)\/[^/]+\/README\.md$/, lines: 60 },
];
/** Templates that GitHub fills into an issue or pull request, so they need no leading title. */
const TITLE_EXEMPT = /^\.github\//;
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const EXTERNAL_LINK = /^(https?:|mailto:|#)/;

/** Paths printed by a `git ls-files` call. @param {string[]} args */
function gitFiles(args) {
  const output = execFileSync("git", ["ls-files", "-z", ...args], { encoding: "utf8" });
  return output.split("\0").filter((path) => path !== "");
}

/** @param {string} file */
function lineLimit(file) {
  return DOCUMENT_LIMITS.find((limit) => limit.pattern.test(file))?.lines ?? DEFAULT_DOCUMENT_LINES;
}

/** Lines outside fenced code blocks, where links and titles are real. @param {string[]} lines */
function proseLines(lines) {
  let fenced = false;
  return lines.filter((line) => {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      return false;
    }
    return !fenced;
  });
}

/** @param {string} file @param {string[]} prose */
function brokenLinks(file, prose) {
  const errors = [];
  for (const line of prose) {
    for (const match of line.matchAll(LINK)) {
      const target = (match[1] ?? "").split("#")[0] ?? "";
      if (target === "" || EXTERNAL_LINK.test(match[1] ?? "")) {
        continue;
      }
      if (!existsSync(resolve(dirname(file), target))) {
        errors.push(`${file}: broken link to ${match[1]}`);
      }
    }
  }
  return errors;
}

/** @param {string} file */
function documentErrors(file) {
  const lines = readFileSync(file, "utf8").trimEnd().split("\n");
  const prose = proseLines(lines);
  const errors = brokenLinks(file, prose);
  const limit = lineLimit(file);
  if (lines.length > limit) {
    errors.push(`${file}: ${lines.length} lines, the limit is ${limit}. Split the document.`);
  }
  const firstLine = lines.find((line) => line.trim() !== "") ?? "";
  if (!TITLE_EXEMPT.test(file) && !firstLine.startsWith("# ")) {
    errors.push(`${file}: must start with a "# Title" line`);
  }
  if (prose.some((line) => /^#{4,} /.test(line))) {
    errors.push(`${file}: headings deeper than "###" are not allowed`);
  }
  return errors;
}

/** @param {string[]} files */
function folderErrors(files) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const file of files) {
    const folder = dirname(file);
    const counted = CODE_ROOTS.some((root) => folder === root || folder.startsWith(`${root}/`));
    if (counted && !UNCOUNTED_FOLDER.test(folder)) {
      counts.set(folder, (counts.get(folder) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count > MAX_FILES_PER_FOLDER)
    .map(
      ([folder, count]) =>
        `${folder}: ${count} files, the limit is ${MAX_FILES_PER_FOLDER}. Group them.`,
    );
}

/** Source files that an ignore rule hides, so they would silently be left out of a commit. */
function ignoredSourceErrors() {
  return gitFiles(["--others", "--ignored", "--exclude-standard", "--", ...SOURCE_FOLDERS])
    .filter((file) => !file.endsWith(".DS_Store"))
    .map((file) => `${file}: is ignored by Git. Rename its folder or fix .gitignore.`);
}

const files = gitFiles(["--cached", "--others", "--exclude-standard"]).filter(existsSync);
const documents = files.filter((file) => file.endsWith(".md"));
const errors = [
  ...documents.flatMap(documentErrors),
  ...folderErrors(files),
  ...ignoredSourceErrors(),
];

if (errors.length > 0) {
  process.stderr.write(
    `Structure check failed:\n${errors.map((error) => `  - ${error}`).join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(`Structure check passed (${documents.length} documents).\n`);
