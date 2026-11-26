CREATE TABLE "endpoint_sources" (
	"endpoint_id" text NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "endpoint_sources_endpoint_id_source_id_pk" PRIMARY KEY("endpoint_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "endpoint_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hosts" text[] NOT NULL,
	"docs_url" text NOT NULL,
	"licence" text NOT NULL,
	"attribution" text NOT NULL,
	"evidence_url" text NOT NULL,
	"tier" text NOT NULL,
	"policy_checked_at" timestamp with time zone NOT NULL,
	"capabilities" jsonb NOT NULL,
	"rate_limit_per_min" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_name_unique" UNIQUE("name"),
	CONSTRAINT "sources_id_prefix" CHECK ("sources"."id" ~ '^src_[0-9a-z_]{1,64}$'),
	CONSTRAINT "sources_hosts" CHECK (cardinality("sources"."hosts") between 1 and 10),
	CONSTRAINT "sources_https" CHECK ("sources"."docs_url" ~ '^https://' and "sources"."evidence_url" ~ '^https://'),
	CONSTRAINT "sources_tier" CHECK ("sources"."tier" in ('green', 'yellow', 'red')),
	CONSTRAINT "sources_rate_limit" CHECK ("sources"."rate_limit_per_min" > 0)
);
--> statement-breakpoint
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "endpoint_sources" ADD CONSTRAINT "endpoint_sources_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoint_sources" ADD CONSTRAINT "endpoint_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "endpoint_sources_source_idx" ON "endpoint_sources" USING btree ("source_id");