ALTER TABLE "dataset_query" DROP CONSTRAINT "dataset_query_source_app_id_app_id_fk";
--> statement-breakpoint
ALTER TABLE "dataset_query" ALTER COLUMN "source_app_id" DROP NOT NULL;