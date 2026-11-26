import { describeEndpointStatusStore } from "../../ports/testing/endpoint-status-store-contract";
import { testId } from "../../testing/test-deps";
import { createMemoryEndpointStatusStore } from "./memory-endpoint-status-store";

describeEndpointStatusStore("The memory status store", async () => ({
  store: createMemoryEndpointStatusStore([[testId("endpoint", "ep_weather_now"), "live"]]),
  close: async () => undefined,
}));
