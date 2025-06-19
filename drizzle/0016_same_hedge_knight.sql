CREATE TABLE "dataset_query" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"query" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"source_app_id" uuid NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_query" ADD CONSTRAINT "dataset_query_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_query" ADD CONSTRAINT "dataset_query_source_app_id_app_id_fk" FOREIGN KEY ("source_app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dataset_query_dataset_id" ON "dataset_query" USING btree ("dataset_id");