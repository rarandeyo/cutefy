import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/shared/lib/auth/server";

export const GET = async (request: Request): Promise<Response> => {
  const handler = toNextJsHandler(await getAuth());
  return handler.GET(request);
};

export const POST = async (request: Request): Promise<Response> => {
  const handler = toNextJsHandler(await getAuth());
  return handler.POST(request);
};
