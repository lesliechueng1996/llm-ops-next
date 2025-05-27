CREATE TABLE "api_tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"method" text DEFAULT '' NOT NULL,
	"parameters" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_api_tool_provider_id_name" UNIQUE("provider_id","name")
);
--> statement-breakpoint
CREATE TABLE "api_tool_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"openapi_schema" text DEFAULT '' NOT NULL,
	"headers" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_api_tool_provider_user_id_name" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "api_tool" ADD CONSTRAINT "api_tool_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tool" ADD CONSTRAINT "api_tool_provider_id_api_tool_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."api_tool_provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tool_provider" ADD CONSTRAINT "api_tool_provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_tool_user_id" ON "api_tool" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_tool_provider_user_id" ON "api_tool_provider" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_upload_file_user_id" ON "upload_file" USING btree ("user_id");