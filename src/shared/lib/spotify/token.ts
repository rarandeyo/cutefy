import { z } from "zod";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
});

export type TokenRefreshResult = {
  accessToken: string;
  newRefreshToken: string | undefined;
};

export const refreshAccessToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenRefreshResult> => {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const parsed = tokenResponseSchema.parse(data);
  return {
    accessToken: parsed.access_token,
    newRefreshToken: parsed.refresh_token,
  };
};
