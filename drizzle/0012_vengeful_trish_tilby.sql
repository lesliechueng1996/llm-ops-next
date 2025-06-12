CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT '' NOT NULL,
	"app_config_id" text,
	"draft_app_config_id" text,
	"debug_conversation_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"model_config" jsonb DEFAULT '{}' NOT NULL,
	"dialog_round" integer DEFAULT 0 NOT NULL,
	"preset_prompt" text DEFAULT '' NOT NULL,
	"tools" jsonb DEFAULT '[]' NOT NULL,
	"workflows" jsonb DEFAULT '[]' NOT NULL,
	"retrieval_config" jsonb DEFAULT '[]' NOT NULL,
	"long_term_memory" jsonb DEFAULT '{}' NOT NULL,
	"opening_statement" text DEFAULT '' NOT NULL,
	"opening_questions" jsonb DEFAULT '[]' NOT NULL,
	"speech_to_text" jsonb DEFAULT '{}' NOT NULL,
	"text_to_speech" jsonb DEFAULT '{}' NOT NULL,
	"suggested_after_answer" jsonb DEFAULT '{}' NOT NULL,
	"review_config" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_config_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"model_config" jsonb DEFAULT '{}' NOT NULL,
	"dialog_round" integer DEFAULT 0 NOT NULL,
	"preset_prompt" text DEFAULT '' NOT NULL,
	"tools" jsonb DEFAULT '[]' NOT NULL,
	"workflows" jsonb DEFAULT '[]' NOT NULL,
	"retrieval_config" jsonb DEFAULT '[]' NOT NULL,
	"long_term_memory" jsonb DEFAULT '{}' NOT NULL,
	"opening_statement" text DEFAULT '' NOT NULL,
	"opening_questions" jsonb DEFAULT '[]' NOT NULL,
	"speech_to_text" jsonb DEFAULT '{}' NOT NULL,
	"text_to_speech" jsonb DEFAULT '{}' NOT NULL,
	"suggested_after_answer" jsonb DEFAULT '{}' NOT NULL,
	"review_config" jsonb DEFAULT '{}' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"config_type" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_app_config_version_app_id_version" UNIQUE("app_id","version")
);
--> statement-breakpoint
CREATE TABLE "app_dataset_join" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"dataset_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"invoke_from" text DEFAULT '' NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"invoke_from" text DEFAULT '' NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"query" text DEFAULT '' NOT NULL,
	"message" jsonb DEFAULT '[]' NOT NULL,
	"message_token_count" integer DEFAULT 0 NOT NULL,
	"message_unit_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"message_price_unit" numeric(10, 4) DEFAULT '0.0' NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"answer_token_count" integer DEFAULT 0 NOT NULL,
	"answer_unit_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"answer_price_unit" numeric(10, 4) DEFAULT '0.0' NOT NULL,
	"latency" real DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT '' NOT NULL,
	"error" text,
	"total_token_count" integer DEFAULT 0 NOT NULL,
	"total_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_agent_thought" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"invoke_from" text DEFAULT '' NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"event" text DEFAULT '' NOT NULL,
	"thought" text DEFAULT '' NOT NULL,
	"observation" text DEFAULT '' NOT NULL,
	"tool" text DEFAULT '' NOT NULL,
	"tool_input" jsonb DEFAULT '{}' NOT NULL,
	"message" jsonb DEFAULT '[]' NOT NULL,
	"message_token_count" integer DEFAULT 0 NOT NULL,
	"message_unit_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"message_price_unit" numeric(10, 4) DEFAULT '0.0' NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"answer_token_count" integer DEFAULT 0 NOT NULL,
	"answer_unit_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"answer_price_unit" numeric(10, 4) DEFAULT '0.0' NOT NULL,
	"total_token_count" integer DEFAULT 0 NOT NULL,
	"total_price" numeric(10, 7) DEFAULT '0.0' NOT NULL,
	"latency" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_config_version" ADD CONSTRAINT "app_config_version_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_agent_thought" ADD CONSTRAINT "message_agent_thought_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_agent_thought" ADD CONSTRAINT "message_agent_thought_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_agent_thought" ADD CONSTRAINT "message_agent_thought_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_user_id" ON "app" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_app_config_app_id" ON "app_config" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_app_config_version_app_id" ON "app_config_version" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_app_dataset_join_app_id" ON "app_dataset_join" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_app_dataset_join_dataset_id" ON "app_dataset_join" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_app_id" ON "conversation" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_message_app_id_conversation_id" ON "message" USING btree ("app_id","conversation_id");--> statement-breakpoint
CREATE INDEX "idx_message_agent_thought_app_id_conversation_id_message_id" ON "message_agent_thought" USING btree ("app_id","conversation_id","message_id");