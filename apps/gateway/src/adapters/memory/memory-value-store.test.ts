import { describeValueStore } from "../../ports/testing/value-store-contract";
import { createMemoryValueStore } from "./memory-value-store";

describeValueStore("The memory value store", async () => ({
  store: createMemoryValueStore(),
  close: async () => undefined,
}));
