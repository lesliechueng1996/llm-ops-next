CREATE TABLE "dataset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_dataset_user_id_name" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dataset_id" uuid NOT NULL,
	"upload_file_id" uuid NOT NULL,
	"process_rule_id" uuid NOT NULL,
	"batch" text DEFAULT '' NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"processing_started_at" timestamp,
	"parsing_completed_at" timestamp,
	"splitting_completed_at" timestamp,
	"indexing_completed_at" timestamp,
	"completed_at" timestamp,
	"stopped_at" timestamp,
	"error" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"disabled_at" timestamp,
	"status" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"keywords" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_keyword_table_dataset_id" UNIQUE("dataset_id")
);
--> statement-breakpoint
CREATE TABLE "process_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dataset_id" uuid NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"rule" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dataset_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"node_id" text,
	"position" integer DEFAULT 1 NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"keywords" jsonb DEFAULT '[]' NOT NULL,
	"hash" text DEFAULT '' NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"disabled_at" timestamp,
	"processing_started_at" timestamp,
	"indexing_completed_at" timestamp,
	"completed_at" timestamp,
	"stopped_at" timestamp,
	"error" text,
	"status" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset" ADD CONSTRAINT "dataset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_upload_file_id_upload_file_id_fk" FOREIGN KEY ("upload_file_id") REFERENCES "public"."upload_file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_process_rule_id_process_rule_id_fk" FOREIGN KEY ("process_rule_id") REFERENCES "public"."process_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_table" ADD CONSTRAINT "keyword_table_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_rule" ADD CONSTRAINT "process_rule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_rule" ADD CONSTRAINT "process_rule_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "segment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "segment_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "segment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dataset_user_id" ON "dataset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_document_user_id_dataset_id" ON "document" USING btree ("user_id","dataset_id");--> statement-breakpoint
CREATE INDEX "idx_process_rule_user_id_dataset_id" ON "process_rule" USING btree ("user_id","dataset_id");--> statement-breakpoint
CREATE INDEX "idx_segment_user_id_dataset_id_document_id" ON "segment" USING btree ("user_id","dataset_id","document_id");