import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const GET = async (request: Request) => {
  const handler = toNextJsHandler(await getAuth());
  return handler.GET(request);
};

export const POST = async (request: Request) => {
  const handler = toNextJsHandler(await getAuth());
  return handler.POST(request);
};
