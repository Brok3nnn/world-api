import { z } from "zod";

/** An absolute `https` URL. Other schemes are never part of a response. */
export const httpsUrlSchema = z.url({ protocol: /^https$/ });
