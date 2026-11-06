import type { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { handleTerminalSocketConnection } from "./terminal.socket.js";

/**
 * Registers the Fastify WebSocket plugin and mounts `/ws` endpoint.
 */
export async function registerWebSocket(app: FastifyInstance) {
  await app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  // Mount at both /ws and /api/v1/ws for client convenience
  app.get("/ws", { websocket: true }, (connection: any, req) => {
    const socket = connection?.socket || connection;
    handleTerminalSocketConnection(socket, req);
  });

  app.get("/api/v1/ws", { websocket: true }, (connection: any, req) => {
    const socket = connection?.socket || connection;
    handleTerminalSocketConnection(socket, req);
  });

  app.log.info("📡 WebSocket server registered at /ws and /api/v1/ws");
}
