CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"kind" text NOT NULL,
	"auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_handle_unique" UNIQUE("handle"),
	CONSTRAINT "accounts_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "accounts_id_prefix" CHECK ("accounts"."id" ~ '^acc_[0-9a-z_]{1,64}$'),
	CONSTRAINT "accounts_handle_format" CHECK ("accounts"."handle" ~ '^[a-z0-9_]{2,32}$'),
	CONSTRAINT "accounts_kind" CHECK ("accounts"."kind" in ('platform', 'user'))
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;