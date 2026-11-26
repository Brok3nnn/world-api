-- `licence` now holds the short name of a source's licence, and the conditions read in its terms
-- move to `terms`. A source keeps its old text as its terms until the seed rewrites it.
ALTER TABLE "sources" ADD COLUMN "terms" text;--> statement-breakpoint
UPDATE "sources" SET "terms" = "licence";--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "terms" SET NOT NULL;--> statement-breakpoint
-- A licence that requires no attribution has none.
ALTER TABLE "sources" ALTER COLUMN "attribution" DROP NOT NULL;--> statement-breakpoint
-- The probability shape is no longer part of the API.
ALTER TABLE "usage_events" DROP CONSTRAINT "usage_events_shape";--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_shape" CHECK ("usage_events"."shape" in ('json', 'number', 'text', 'csv'));
