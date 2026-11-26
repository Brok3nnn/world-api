CREATE TABLE "recipe_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint_id" text NOT NULL,
	"version" integer NOT NULL,
	"document" jsonb NOT NULL,
	"test_report" jsonb,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_versions_endpoint_version_unique" UNIQUE("endpoint_id","version"),
	CONSTRAINT "recipe_versions_id_prefix" CHECK ("recipe_versions"."id" ~ '^rv_[0-9a-z_]{1,64}$'),
	CONSTRAINT "recipe_versions_version" CHECK ("recipe_versions"."version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "recipe_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_versions_one_active_idx" ON "recipe_versions" USING btree ("endpoint_id") WHERE "recipe_versions"."active";