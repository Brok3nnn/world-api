import { err, ok, type Result } from "@repo/core/result";
import { RUN_LIMITS } from "../engine/run-limits";
import type { HttpClient, HttpResponse } from "../ports/http-client";
import type { ResolveHost } from "../ports/resolve-host";
import type {
  SourceFetch,
  SourceFetchFailure,
  SourceRequest,
  SourceResponse,
} from "../ports/source-fetch";
import type { SourceRateLimit } from "../ports/source-rate-limit";
import type { Wait } from "../ports/wait";
import { checkUrl } from "./check-url";
import { type Deadline, startDeadline } from "./deadline";
import { decodeBody } from "./decode-body";
import { denied } from "./egress-denial";
import { readBody } from "./read-body";
import { resolvePublicAddresses } from "./resolve-public-addresses";

/** What the policed fetch needs; the caller builds one per run, for the endpoint's sources. */
export interface PolicedFetchDeps {
  readonly http: HttpClient;
  readonly resolveHost: ResolveHost;
  readonly wait: Wait;
  /** Identifies the platform and its contact to every source. */
  readonly userAgent: string;
  /** The hosts of the sources linked to the endpoint. */
  readonly allowedHosts: readonly string[];
  /** Asked before every request; a source over its limit gets nothing sent. */
  readonly rateLimit: SourceRateLimit;
}

interface Fetching {
  readonly deps: PolicedFetchDeps;
  readonly deadline: Deadline;
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/** The media type alone, in lowercase: `text/csv; charset=utf-8` is `text/csv`. */
function mediaType(contentType: string | null): string | null {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  return type === undefined || type === "" ? null : type;
}

/** Sends one hop: the URL and every address of its host pass the policy before anything leaves. */
async function send(
  url: string,
  request: SourceRequest,
  { deps, deadline }: Fetching,
): Promise<Result<HttpResponse, SourceFetchFailure>> {
  const checked = checkUrl(url, deps.allowedHosts);
  if (!checked.ok) {
    return checked;
  }
  const raced = await deadline.race(
    resolvePublicAddresses(checked.value.hostname, deps.resolveHost),
  );
  if (!raced.ok) {
    return raced;
  }
  const addresses = raced.value;
  if (!addresses.ok) {
    return addresses;
  }
  const [address = ""] = addresses.value;
  if (!deps.rateLimit(checked.value.hostname)) {
    return err(denied("rate_limited"));
  }
  const headers = Object.fromEntries(
    Object.entries({ ...request.headers, "user-agent": deps.userAgent }).filter(
      (header): header is [string, string] => header[1] !== undefined,
    ),
  );
  const sent = await deadline.race(
    deps.http({ url: checked.value.href, address, headers, signal: deadline.signal }),
  );
  return sent.ok ? sent.value : sent;
}

/** Reads the final response within the size cap and decodes it as text. */
async function read(
  response: HttpResponse,
  deadline: Deadline,
): Promise<Result<SourceResponse, SourceFetchFailure>> {
  const body = await readBody(response.body, deadline);
  if (!body.ok) {
    return body;
  }
  return ok({
    status: response.status,
    contentType: mediaType(response.contentType),
    body: decodeBody(body.value, response.contentType),
    bytes: body.value.byteLength,
  });
}

async function follow(
  request: SourceRequest,
  fetching: Fetching,
): Promise<Result<SourceResponse, SourceFetchFailure>> {
  let url = request.url;
  for (let redirects = 0; ; redirects += 1) {
    const sent = await send(url, request, fetching);
    if (!sent.ok || !REDIRECTS.has(sent.value.status)) {
      return sent.ok ? read(sent.value, fetching.deadline) : sent;
    }
    const next = URL.parse(sent.value.location ?? "", url);
    if (next === null || sent.value.location === null || redirects >= RUN_LIMITS.redirects) {
      return err({ code: "fetch_failed" });
    }
    url = next.href;
  }
}

/**
 * The `fetch` port of a run, built on the egress policy: every hop is checked, connects only to
 * an approved address and carries the platform's user agent. At most two redirects are
 * followed, and one deadline and the size cap hold for the whole fetch.
 */
export function createPolicedFetch(deps: PolicedFetchDeps): SourceFetch {
  return async (request) => {
    const deadline = startDeadline(RUN_LIMITS.stepMs, deps.wait);
    try {
      return await follow(request, { deps, deadline });
    } finally {
      deadline.finish();
    }
  };
}
