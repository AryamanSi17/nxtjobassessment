CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" varchar(100) NOT NULL,
	"owner" uuid NOT NULL,
	"stage" varchar(50) DEFAULT 'New Lead' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
