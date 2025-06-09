ALTER TABLE "segment" DROP CONSTRAINT "segment_document_id_document_id_fk";
--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "segment_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;