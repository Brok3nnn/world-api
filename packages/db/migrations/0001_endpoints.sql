CREATE TABLE "endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"category" text NOT NULL,
	"visibility" text NOT NULL,
	"status" text NOT NULL,
	"method" text NOT NULL,
	"freshness" text NOT NULL,
	"price_credits" integer NOT NULL,
	"output_spec" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "endpoints_owner_slug_unique" UNIQUE("owner_id","slug"),
	CONSTRAINT "endpoints_id_prefix" CHECK ("endpoints"."id" ~ '^ep_[0-9a-z_]{1,64}$'),
	CONSTRAINT "endpoints_slug_format" CHECK ("endpoints"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length("endpoints"."slug") <= 64),
	CONSTRAINT "endpoints_title_length" CHECK (length("endpoints"."title") between 1 and 80),
	CONSTRAINT "endpoints_summary_length" CHECK (length("endpoints"."summary") between 1 and 280),
	CONSTRAINT "endpoints_category" CHECK ("endpoints"."category" in ('weather', 'environment', 'wildlife', 'finance', 'energy', 'transport', 'developer', 'knowledge', 'places', 'commerce', 'jobs')),
	CONSTRAINT "endpoints_visibility" CHECK ("endpoints"."visibility" in ('private', 'unlisted', 'public')),
	CONSTRAINT "endpoints_status" CHECK ("endpoints"."status" in ('building', 'live', 'degraded', 'disabled')),
	CONSTRAINT "endpoints_method" CHECK ("endpoints"."method" in ('computed', 'model-estimate', 'owner-data')),
	CONSTRAINT "endpoints_freshness" CHECK ("endpoints"."freshness" in ('1m', '5m', '15m', '1h', '1d')),
	CONSTRAINT "endpoints_price_credits" CHECK ("endpoints"."price_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_owner_id_accounts_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "endpoints_catalog_idx" ON "endpoints" USING btree ("visibility","status","created_at");