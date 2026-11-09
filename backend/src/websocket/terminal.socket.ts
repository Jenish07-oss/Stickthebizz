import type { WebSocket } from "ws";
import type { FastifyRequest } from "fastify";
import { verifyAccessToken } from "../utils/jwt.js";
import { authorizeMerchantAccess } from "../utils/authorization.js";

interface ConnectedClient {
  socket: WebSocket;
  userId?: string;
  role?: string;
  merchantId?: string;
  customerId?: string;
  isAlive: boolean;
}

// In-memory room manager
const merchantRooms = new Map<string, Set<ConnectedClient>>();
const customerRooms = new Map<string, Set<ConnectedClient>>();

/**
 * Adds a connected client to a merchant terminal room.
 */
function joinMerchantRoom(merchantId: string, client: ConnectedClient) {
  if (!merchantRooms.has(merchantId)) {
    merchantRooms.set(merchantId, new Set());
  }
  merchantRooms.get(merchantId)!.add(client);
}

/**
 * Adds a connected client to a customer pass room.
 */
function joinCustomerRoom(customerId: string, client: ConnectedClient) {
  if (!customerRooms.has(customerId)) {
    customerRooms.set(customerId, new Set());
  }
  customerRooms.get(customerId)!.add(client);
}

/**
 * Removes a client from all rooms on disconnect.
 */
function removeClient(client: ConnectedClient) {
  if (client.merchantId && merchantRooms.has(client.merchantId)) {
    const room = merchantRooms.get(client.merchantId)!;
    room.delete(client);
    if (room.size === 0) merchantRooms.delete(client.merchantId);
  }

  if (client.customerId && customerRooms.has(client.customerId)) {
    const room = customerRooms.get(client.customerId)!;
    room.delete(client);
    if (room.size === 0) customerRooms.delete(client.customerId);
  }
}

/**
 * Broadcast an event to all connected cashier terminals of a merchant.
 */
export function broadcastToMerchant(merchantId: string, event: string, payload: any): number {
  const room = merchantRooms.get(merchantId);
  if (!room || room.size === 0) return 0;

  const message = JSON.stringify({
    type: "broadcast",
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  for (const client of room) {
    if (client.socket.readyState === 1) { // 1 = OPEN
      client.socket.send(message);
      sentCount++;
    }
  }
  return sentCount;
}

/**
 * Broadcast an event to a customer device.
 */
export function broadcastToCustomer(customerId: string, event: string, payload: any): number {
  const room = customerRooms.get(customerId);
  if (!room || room.size === 0) return 0;

  const message = JSON.stringify({
    type: "broadcast",
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  for (const client of room) {
    if (client.socket.readyState === 1) {
      client.socket.send(message);
      sentCount++;
    }
  }
  return sentCount;
}

/**
 * Returns active room sizes for testing and observability.
 */
export function getMerchantRoomSize(merchantId: string): number {
  return merchantRooms.get(merchantId)?.size || 0;
}

export function getCustomerRoomSize(customerId: string): number {
  return customerRooms.get(customerId)?.size || 0;
}

/**
 * Handle new WebSocket connection from `@fastify/websocket`.
 */
export async function handleTerminalSocketConnection(socket: WebSocket, req: FastifyRequest) {
  try {
    const query = (req.query as Record<string, string>) || {};
    const authHeader = req.headers?.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
    const token =
      query.token ||
      (req.cookies as Record<string, string>)?.["stb_access_token"] ||
      (req.cookies as Record<string, string>)?.["access_token"] ||
      (req.cookies as Record<string, string>)?.["token"] ||
      bearerToken;
    const merchantId = query.merchantId || query.shopId;
    const customerId = query.customerId;

    let userId: string | undefined;
    let role: string | undefined;

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        userId = decoded.userId;
        role = decoded.role;
      }
    }

    const client: ConnectedClient = {
      socket,
      userId,
      role,
      merchantId: undefined, // Only set upon verified authorization
      customerId,
      isAlive: true,
    };

    // Strict Multi-Tenant Authorization for Merchant Room Subscription
    if (merchantId) {
      const auth = await authorizeMerchantAccess(merchantId, userId ? { userId, role } : undefined);
      if (!auth.authorized) {
        if (socket.readyState === 1) { // 1 = OPEN
          socket.send(
            JSON.stringify({
              type: "error",
              error: auth.error,
              message: auth.message,
              timestamp: new Date().toISOString(),
            })
          );
          socket.close(auth.statusCode === 401 ? 4401 : 4403, auth.message);
        }
        return;
      }

      client.merchantId = auth.merchant!.id;
      joinMerchantRoom(client.merchantId, client);
    }

    if (customerId) {
      joinCustomerRoom(customerId, client);
    }

    // Welcome handshake
    if (socket.readyState === 1) {
      socket.send(
        JSON.stringify({
          type: "connected",
          message: "StickTheBizz Counter Terminal WebSocket connected.",
          merchantId: client.merchantId,
          customerId: client.customerId,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Ping-pong heartbeat
    socket.on("pong", () => {
      client.isAlive = true;
    });

    socket.on("message", async (raw: any) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === "ping") {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          }
        } else if (data.type === "subscribe_merchant" && data.merchantId) {
          // Authorize dynamic subscription attempt
          const auth = await authorizeMerchantAccess(
            data.merchantId,
            client.userId ? { userId: client.userId, role: client.role } : undefined
          );

          if (!auth.authorized) {
            if (socket.readyState === 1) {
              socket.send(
                JSON.stringify({
                  type: "error",
                  error: auth.error,
                  message: auth.message,
                  room: `merchant:${data.merchantId}`,
                  timestamp: new Date().toISOString(),
                })
              );
            }
            return;
          }

          if (client.merchantId && merchantRooms.has(client.merchantId)) {
            merchantRooms.get(client.merchantId)?.delete(client);
          }
          client.merchantId = auth.merchant!.id;
          joinMerchantRoom(client.merchantId, client);

          if (socket.readyState === 1) {
            socket.send(
              JSON.stringify({
                type: "subscribed",
                room: `merchant:${client.merchantId}`,
                timestamp: new Date().toISOString(),
              })
            );
          }
        } else if (data.type === "subscribe_customer" && data.customerId) {
          if (client.customerId && customerRooms.has(client.customerId)) {
            customerRooms.get(client.customerId)?.delete(client);
          }
          client.customerId = data.customerId;
          joinCustomerRoom(data.customerId, client);

          if (socket.readyState === 1) {
            socket.send(
              JSON.stringify({
                type: "subscribed",
                room: `customer:${data.customerId}`,
                timestamp: new Date().toISOString(),
              })
            );
          }
        }
      } catch {
        // Ignore unparseable frames
      }
    });

    socket.on("close", () => {
      removeClient(client);
    });

    socket.on("error", () => {
      removeClient(client);
    });
  } catch (err: any) {
    try {
      if (socket.readyState === 1) {
        socket.close(1011, "Internal server error");
      }
    } catch {
      // Ignore cleanup error
    }
  }
}

// 30s Heartbeat sweep
setInterval(() => {
  const sweep = (rooms: Map<string, Set<ConnectedClient>>) => {
    for (const [id, room] of rooms.entries()) {
      for (const client of room) {
        if (!client.isAlive) {
          client.socket.terminate();
          room.delete(client);
          continue;
        }
        client.isAlive = false;
        client.socket.ping();
      }
      if (room.size === 0) rooms.delete(id);
    }
  };

  sweep(merchantRooms);
  sweep(customerRooms);
}, 30000).unref();
