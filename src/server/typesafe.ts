import "server-only";
import {
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

export type TypeSafeFailure =
  | "invalid_api_key"
  | "rate_limited"
  | "overloaded"
  | "failed";

export function createTypeSafeClient(apiKey: string) {
  return new TypeSafeClient({ apiKey, timeout: 30_000, logLevel: "off" });
}

export function classifyTypeSafeError(error: unknown): TypeSafeFailure {
  if (error instanceof AuthenticationError) return "invalid_api_key";
  if (error instanceof PermissionDeniedError) return "invalid_api_key";
  if (error instanceof RateLimitError) return "rate_limited";
  if (error instanceof APIError && error.status === 529) return "overloaded";
  return "failed";
}

/** Confirms a key is accepted by TypeSafe. Listing models costs nothing. */
export async function verifyApiKey(
  apiKey: string,
): Promise<{ ok: true } | { ok: false; reason: TypeSafeFailure }> {
  try {
    await createTypeSafeClient(apiKey).models.list();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: classifyTypeSafeError(error) };
  }
}
