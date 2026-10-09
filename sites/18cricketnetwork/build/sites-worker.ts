import {blockedPath,contentSecurityPolicy,secureResponse} from "../server/security.js";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if (!import.meta.env.DEV) {
      if (blockedPath(new URL(request.url).pathname)) return secureResponse(new Response("Not found", {status:404}),request);
      const headers = new Headers(request.headers);
      const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
      headers.set("Content-Security-Policy", contentSecurityPolicy(nonce));
      headers.set("x-18-csp-nonce", nonce);
      request = new Request(request, {headers});
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    try {
      const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
      return import.meta.env.DEV ? response : secureResponse(response,request,request.headers.get("x-18-csp-nonce"));
    } catch {
      return secureResponse(new Response("Service unavailable", {status:500}),request);
    }
  },
};
