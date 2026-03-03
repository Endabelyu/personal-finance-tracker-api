import { Hono } from "hono";
import apiRoutes from "@server/routes/index";

export const app = new Hono();
app.route("/api", apiRoutes);
