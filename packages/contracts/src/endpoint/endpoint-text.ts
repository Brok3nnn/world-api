import { z } from "zod";

const TITLE_MAX_LENGTH = 80;
const SUMMARY_MAX_LENGTH = 280;

/** The short name of an endpoint as people see it. */
export const endpointTitleSchema = z.string().min(1).max(TITLE_MAX_LENGTH);

/** One or two sentences that say what the endpoint returns. */
export const endpointSummarySchema = z.string().min(1).max(SUMMARY_MAX_LENGTH);
