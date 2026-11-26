import { describeEndpointDirectory } from "../../ports/testing/endpoint-directory-contract";
import { createMemoryEndpointDirectory } from "./memory-endpoint-directory";

describeEndpointDirectory("The memory directory", async (endpoints) => ({
  directory: createMemoryEndpointDirectory(endpoints),
  close: async () => undefined,
}));
