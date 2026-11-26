import { z } from "zod";

/** Any JSON value: a string, number, boolean, null, or an array or object of JSON values. */
export const jsonValueSchema = z.json();
