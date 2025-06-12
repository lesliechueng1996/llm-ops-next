CREATE TABLE "app_dataset_join" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_dataset_join" ADD CONSTRAINT "app_dataset_join_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_dataset_join" ADD CONSTRAINT "app_dataset_join_dataset_id_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_dataset_join_app_id" ON "app_dataset_join" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_app_dataset_join_dataset_id" ON "app_dataset_join" USING btree ("dataset_id");