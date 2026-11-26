# Security policy

## Supported versions

Only the latest `main` is supported. Fixes land there; there are no release branches.

## Reporting a vulnerability

Please report a vulnerability privately, never in a public issue or pull request:

- on GitHub, open the repository's **Security** tab and choose **Report a vulnerability**; or
- by email to vitanbalint@gmail.com.

Include what is affected (a file, a route or a package), the steps or the request that show the
problem, and what an attacker could achieve. Reports are acknowledged and handled as quickly as
possible; a fix is credited to the reporter unless they prefer otherwise.

## What is in scope

The parts that exist to keep the system safe matter most:

- the egress policy and its address pinning (`packages/recipes/src/egress/`,
  `packages/recipes/src/adapters/node-http-client.ts`): any way to make a recipe reach a host
  that is not approved, or a private, loopback, link-local or metadata address;
- the output firewall (`packages/recipes/src/firewall/apply-firewall.ts`): any field that leaves
  the gateway without being in the endpoint's output spec;
- the expression and pattern sandbox (`packages/recipes/src/expression/`,
  `packages/recipes/src/steps/text-match.ts`): any way to read the clock, run text as code, or
  run without bound;
- the gateway (`apps/gateway`): injection, crashes caused by a request, or data leaking in an
  error.

The web app is a prototype on sample data. Its sign-in and API keys are simulated in the browser
and protect nothing by design, so they are out of scope.
