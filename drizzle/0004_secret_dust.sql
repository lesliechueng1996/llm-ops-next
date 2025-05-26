CREATE TABLE "upload_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"key" text DEFAULT '' NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"extension" text DEFAULT '' NOT NULL,
	"mime_type" text DEFAULT '' NOT NULL,
	"hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_file" ADD CONSTRAINT "upload_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;