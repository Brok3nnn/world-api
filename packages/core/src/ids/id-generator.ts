import type { IdKind } from "@repo/contracts/ids";
import type { Id } from "./id";

/** Creates new ids. Code that needs an id takes this port instead of building one itself. */
export interface IdGenerator {
  newId<Kind extends IdKind>(kind: Kind): Id<Kind>;
}
