import { Hono } from "hono";
import { leads } from "../db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { validateFields } from "../utils/helpers";

dotenv.config();

export const leadsRoutes = new Hono();

const pool = new Pool({
    connectionString: process.env.NEON_DB_URL || "",
});
const db = drizzle(pool); //Here we are intialising drizzle ORM with our pool



leadsRoutes.get("/", async (c) => {
    const { query, source, owner, page = "1", limit = "20" } = c.req.query();
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions: any[] = [];
    if (query) conditions.push(sql`name ILIKE ${`%${query}%`}`);
    if (source) conditions.push(sql`source = ${source}`);
    if (owner) conditions.push(sql`owner = ${owner}`);
    const whereClause =
        conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;
    try {
        const [leadsList, totalCount] = await Promise.all([
            db
                .select()
                .from(leads)
                .where(whereClause)
                .offset(offset)
                .limit(parseInt(limit, 10)),
            db.select({ count: sql`COUNT(*)` }).from(leads).where(whereClause),
        ]);

        const count = parseInt(String(totalCount[0]?.count || "0"), 10);
        return c.json({
            leads: leadsList,
            count,
            totalPages: Math.ceil(count / parseInt(limit, 10)),
        });
    } catch (error) {
        console.error("Error while fetching load 😑:", error);
        return c.json({ error: "Failed to fetch the leads" }, 500);
    }
});

leadsRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const { name, source, owner } = body;

    const validSources = ["Facebook", "LinkedIn", "Manual", "Other", "Linkedin"]; // Allowed sources , which we can change as per r needs    
    if (!validSources.includes(source)) {
        return c.json(
            { error: `Invalid source. Supported sources are: ${validSources.join(", ")}` },
            400
        );
    }

    const validation = validateFields(body, ["name", "source"]);
    if (!validation.valid && validation.missing) {
        return c.json(
            { error: `Missing required fields: ${validation.missing.join(", ")}` },
            400
        );
    }

    const ownerId = owner || "defaultOwner";

    try {
        const [newLead] = await db
            .insert(leads)
            .values({
                name,
                source,
                owner: ownerId,
                stage: "New Lead",
            })
            .returning({
                id: leads.id,
                name: leads.name,
                source: leads.source,
                owner: leads.owner,
                stage: leads.stage,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            });

        return c.json({ lead: newLead }, 201);
    } catch (error) {
        console.error("Error adding lead:", error);
        return c.json({ error: "Failed to add lead" }, 500);
    }
});

leadsRoutes.patch("/:leadId/stage", async (c) => {
    const { leadId } = c.req.param();
    const { stage } = await c.req.json();

    const validStages = ["New Lead", "Cold calling", "In Progress", "No Response"];
    if (!validStages.includes(stage)) {
        return c.json(
            { error: `Invalid stage. Supported stages are as follows: ${validStages.join(", ")}` },
            400
        );
    }

    try {
        const [updated] = await db
            .update(leads)
            .set({ stage })
            .where(sql`id = ${leadId}`)
            .returning({
                id: leads.id,
                name: leads.name,
                source: leads.source,
                owner: leads.owner,
                stage: leads.stage,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            });

        if (!updated) {
            return c.json({ error: "Lead not found" }, 404);
        }

        return c.json({ updated });
    } catch (error) {
        console.error("Error updating lead stage:", error);
        return c.json({ error: "Failed to update lead stage" }, 500);
    }
});

leadsRoutes.patch("/:leadId/owner", async (c) => {
    const { leadId } = c.req.param();
    const { owner } = await c.req.json();

    if (!owner || typeof owner !== "string" || owner.trim() === "") {
        return c.json({ error: "Invalid owner. A valid string is required." }, 400);
    }

    try {
        const [updated] = await db
            .update(leads)
            .set({ owner })
            .where(sql`id = ${leadId}`)
            .returning({
                id: leads.id,
                name: leads.name,
                source: leads.source,
                owner: leads.owner,
                stage: leads.stage,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            });

        if (!updated) {
            return c.json({ error: "Lead not found" }, 404);
        }

        return c.json({ updated });
    } catch (error) {
        console.error("Error updating lead owner:", error);
        return c.json({ error: "Failed to update lead owner" }, 500);
    }
});
