CREATE TABLE "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint_id" text NOT NULL,
	"caller_id" text,
	"outcome" text NOT NULL,
	"shape" text NOT NULL,
	"price_credits" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"refreshed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_events_id_prefix" CHECK ("usage_events"."id" ~ '^use_[0-9a-z_]{1,64}$'),
	CONSTRAINT "usage_events_outcome" CHECK ("usage_events"."outcome" in ('served', 'building', 'invalid_request', 'payment_required', 'not_found', 'not_buildable', 'rate_limited', 'internal_error', 'degraded')),
	CONSTRAINT "usage_events_shape" CHECK ("usage_events"."shape" in ('json', 'number', 'text', 'csv', 'probability')),
	CONSTRAINT "usage_events_price_credits" CHECK ("usage_events"."price_credits" >= 0),
	CONSTRAINT "usage_events_latency_ms" CHECK ("usage_events"."latency_ms" >= 0)
);
--> statement-breakpoint
ALTER TABLE "usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "values_history" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"recipe_version_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "values_history_id_prefix" CHECK ("values_history"."id" ~ '^val_[0-9a-z_]{1,64}$')
);
--> statement-breakpoint
ALTER TABLE "values_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "values_latest" (
	"endpoint_id" text PRIMARY KEY NOT NULL,
	"data" jsonb,
	"as_of" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"recipe_version_id" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "values_latest_value_complete" CHECK (num_nulls("values_latest"."data", "values_latest"."as_of", "values_latest"."fetched_at", "values_latest"."expires_at", "values_latest"."recipe_version_id") in (0, 5)),
	CONSTRAINT "values_latest_expiry" CHECK ("values_latest"."expires_at" > "values_latest"."fetched_at"),
	CONSTRAINT "values_latest_failures" CHECK ("values_latest"."consecutive_failures" >= 0)
);
--> statement-breakpoint
ALTER TABLE "values_latest" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_caller_id_accounts_id_fk" FOREIGN KEY ("caller_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "values_history" ADD CONSTRAINT "values_history_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "values_history" ADD CONSTRAINT "values_history_recipe_version_id_recipe_versions_id_fk" FOREIGN KEY ("recipe_version_id") REFERENCES "public"."recipe_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "values_latest" ADD CONSTRAINT "values_latest_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "values_latest" ADD CONSTRAINT "values_latest_recipe_version_id_recipe_versions_id_fk" FOREIGN KEY ("recipe_version_id") REFERENCES "public"."recipe_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_events_endpoint_created_idx" ON "usage_events" USING btree ("endpoint_id","created_at");--> statement-breakpoint
CREATE INDEX "values_history_endpoint_as_of_idx" ON "values_history" USING btree ("endpoint_id","as_of");