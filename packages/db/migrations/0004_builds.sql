CREATE TABLE "build_events" (
	"id" text PRIMARY KEY NOT NULL,
	"build_id" text NOT NULL,
	"stage" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "build_events_id_prefix" CHECK ("build_events"."id" ~ '^bev_[0-9a-z_]{1,64}$'),
	CONSTRAINT "build_events_stage" CHECK ("build_events"."stage" in ('interpret', 'discover', 'check-policy', 'draft', 'test', 'publish')),
	CONSTRAINT "build_events_kind" CHECK ("build_events"."kind" in ('started', 'progress', 'completed', 'failed')),
	CONSTRAINT "build_events_message_length" CHECK (length("build_events"."message") between 1 and 300)
);
--> statement-breakpoint
ALTER TABLE "build_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builds" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"request" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"stage" text,
	"progress" double precision DEFAULT 0 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"endpoint_id" text,
	"reason" text,
	"locked_until" timestamp with time zone,
	"cost_micro_usd" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "builds_id_prefix" CHECK ("builds"."id" ~ '^bld_[0-9a-z_]{1,64}$'),
	CONSTRAINT "builds_status" CHECK ("builds"."status" in ('queued', 'running', 'succeeded', 'failed', 'rejected')),
	CONSTRAINT "builds_stage" CHECK ("builds"."stage" in ('interpret', 'discover', 'check-policy', 'draft', 'test', 'publish')),
	CONSTRAINT "builds_progress" CHECK ("builds"."progress" between 0 and 1),
	CONSTRAINT "builds_attempt" CHECK ("builds"."attempt" >= 0),
	CONSTRAINT "builds_cost" CHECK ("builds"."cost_micro_usd" >= 0),
	CONSTRAINT "builds_outcome" CHECK (("builds"."status" <> 'succeeded' or "builds"."endpoint_id" is not null) and ("builds"."status" not in ('failed', 'rejected') or "builds"."reason" is not null))
);
--> statement-breakpoint
ALTER TABLE "builds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD COLUMN "created_by_build_id" text;--> statement-breakpoint
ALTER TABLE "build_events" ADD CONSTRAINT "build_events_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_requester_id_accounts_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_events_build_created_idx" ON "build_events" USING btree ("build_id","created_at");--> statement-breakpoint
CREATE INDEX "builds_claim_idx" ON "builds" USING btree ("status","locked_until");--> statement-breakpoint
CREATE INDEX "builds_requester_idx" ON "builds" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "builds_endpoint_idx" ON "builds" USING btree ("endpoint_id");--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_created_by_build_id_builds_id_fk" FOREIGN KEY ("created_by_build_id") REFERENCES "public"."builds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_versions_build_idx" ON "recipe_versions" USING btree ("created_by_build_id");--> statement-breakpoint
CREATE INDEX "usage_events_caller_idx" ON "usage_events" USING btree ("caller_id");--> statement-breakpoint
CREATE INDEX "values_history_recipe_version_idx" ON "values_history" USING btree ("recipe_version_id");--> statement-breakpoint
CREATE INDEX "values_latest_recipe_version_idx" ON "values_latest" USING btree ("recipe_version_id");