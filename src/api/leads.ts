import { Hono } from "hono";
import { Bindings } from "../bindings";
import { leads } from "../db/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { validateFields } from "../utils/helpers";
import { neon } from "@neondatabase/serverless";

export const leadsRoutes = new Hono<{ Bindings: Bindings }>();

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
    const neonClient = neon(c.env.NEON_DB_URL);
    const db = drizzle(neonClient);

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
    console.error("Error fetching leads:", error);
    return c.json({ error: "Failed to fetch the leads 😑" }, 500);
  }
});

leadsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { name, source, owner } = body;

  const validSources = ["Facebook", "LinkedIn", "Manual", "Other"];
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

  try {
    const neonClient = neon(c.env.NEON_DB_URL); // Access `env` from `c` (context)
    const db = drizzle(neonClient);

    const [newLead] = await db
      .insert(leads)
      .values({
        name,
        source,
        owner: owner || "defaultOwner",
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
    return c.json({ error: "Failed to add lead 😑" }, 500);
  }
});

leadsRoutes.patch("/:leadId/stage", async (c) => {
  const { leadId } = c.req.param();
  const { stage } = await c.req.json();

  const validStages = ["New Lead", "Cold calling", "In Progress", "No Response"];
  if (!validStages.includes(stage)) {
    return c.json(
      { error: `Invalid stage. Supported stages are: ${validStages.join(", ")}` },
      400
    );
  }

  try {
    const neonClient = neon(c.env.NEON_DB_URL);
    const db = drizzle(neonClient);

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
    console.error("Error updating lead stage 😑:", error);
    return c.json({ error: "Failed to update lead stage 😑" }, 500);
  }
});

leadsRoutes.patch("/:leadId/owner", async (c) => {
  const { leadId } = c.req.param();
  const { owner } = await c.req.json();

  if (!owner || typeof owner !== "string" || owner.trim() === "") {
    return c.json({ error: "Invalid owner. A valid string is required. 😑" }, 400);
  }

  try {
    const neonClient = neon(c.env.NEON_DB_URL);
    const db = drizzle(neonClient);

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
    return c.json({ error: "Failed to update lead owner 😑" }, 500);
  }
});
