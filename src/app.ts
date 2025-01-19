import { Hono } from "hono";
import { leadsRoutes } from "./api/leads";
import { errorHandler } from "./middlewares/errorHandler";
import { Bindings } from "./bindings";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", errorHandler);

app.route("/leads", leadsRoutes);

export default {
    fetch: app.fetch.bind(app),
};
