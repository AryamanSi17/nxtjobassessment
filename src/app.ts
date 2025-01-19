import { Hono } from "hono";
import { leadsRoutes } from "./api/leads";
import { errorHandler } from "./middlewares/errorHandler";

const app = new Hono();
app.use("*", errorHandler);
app.route("/leads", leadsRoutes);

export default app;
