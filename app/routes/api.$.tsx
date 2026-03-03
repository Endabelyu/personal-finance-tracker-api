import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { app } from "@app/lib/api.server";

export const loader = ({ request }: LoaderFunctionArgs) => app.fetch(request);
export const action = ({ request }: ActionFunctionArgs) => app.fetch(request);
