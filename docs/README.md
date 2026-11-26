# Documentation

How World API is designed, built and checked. Start with the [root README](../README.md) for
setup and a tour; the documents below go deeper. Each one says where the code is not there
yet: a section that describes unbuilt work is marked **Planned** or **Design — not
implemented**.

## Product

| Document | What it covers |
| --- | --- |
| [product.md](product.md) | The product idea, its audience, and which parts exist today |
| [glossary.md](glossary.md) | The one name for every domain concept, in code and in the UI |

## Architecture

| Document | What it covers |
| --- | --- |
| [architecture/overview.md](architecture/overview.md) | System shape, layers and dependency rules, staged hosting, what exists today |
| [architecture/api.md](architecture/api.md) | The public data API contract: routes, parameters, envelope, shapes, errors |
| [architecture/gateway.md](architecture/gateway.md) | The serving path of one `GET` call, its ports and portability rules |
| [architecture/recipes.md](architecture/recipes.md) | The recipe document, the engine that runs it, and the egress policy |
| [architecture/security.md](architecture/security.md) | Egress policy, output firewall, source tiers, secrets, untrusted input |
| [architecture/data-model.md](architecture/data-model.md) | Tables, ids, money, migrations and seed data |
| [architecture/operations.md](architecture/operations.md) | Configuration, running locally, logging, planned deployment |
| [architecture/repository.md](architecture/repository.md) | Monorepo layout, package anatomy, where every file goes |
| [architecture/web.md](architecture/web.md) | Structure of the web prototype |
| [architecture/builder.md](architecture/builder.md) | Design — not implemented: the agent that turns a request into an endpoint |

## Engineering

| Document | What it covers |
| --- | --- |
| [conventions.md](conventions.md) | Code, server-side and size conventions, and how they are enforced |
| [testing.md](testing.md) | Test levels, determinism, coverage floors and the live proofs |
| [design-system.md](design-system.md) | Tokens, typography and components of the web prototype |
| [assets.md](assets.md) | Source and licence of every third-party asset |
| [decisions/README.md](decisions/README.md) | Architecture decision records: what was chosen and why |
| [proofs/README.md](proofs/README.md) | Reports of the end-to-end runs against live sources |

## Writing documentation

- Plain, precise English in the present tense. One topic per file.
- One `# Title`, a short summary, then `##` sections; no heading deeper than `###`.
- Relative links must resolve. `pnpm structure:check` checks links, titles and sizes (250 lines
  for a document, 80 for a decision record, 60 for a package README).
- A change that alters a contract, a limit or a convention updates the document that states it
  in the same pull request.
