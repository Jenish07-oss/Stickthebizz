import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

export async function authRoutes(fastify: FastifyInstance) {
  // Customer Email OTP Endpoints
  fastify.post("/customer/otp/request", AuthController.requestOtp);
  fastify.post("/customer/otp/verify", AuthController.verifyOtp);

  // Shop Owner Endpoints
  fastify.post("/owner/register", AuthController.registerMerchant);
  fastify.post("/owner/login", AuthController.loginMerchant);

  // Session Management
  fastify.post("/refresh", AuthController.refresh);
  fastify.post("/logout", AuthController.logout);

  // User Profile
  fastify.get("/me", { preHandler: [authenticate] }, AuthController.getMe);
}

