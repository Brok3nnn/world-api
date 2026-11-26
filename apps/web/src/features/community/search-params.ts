import { parseAsStringLiteral } from "nuqs/server";
import { COMMUNITY_TABS } from "./constants";

/** URL contract of the /community page. */
export const communitySearchParams = {
  tab: parseAsStringLiteral(COMMUNITY_TABS).withDefault("trending"),
};
