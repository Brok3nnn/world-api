import { z } from "zod";

/** A UTC instant such as `2026-11-21T11:49:10Z`. Offsets and local times are not accepted. */
export const instantSchema = z.iso.datetime();
