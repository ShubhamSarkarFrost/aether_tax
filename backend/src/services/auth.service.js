const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");
const Organization = require("../models/Organization");
const { signToken } = require("../utils/jwt");
const { createServiceError } = require("../utils/serviceError");

const registerSchema = z.object({
  organization: z.object({
    legal_name: z.string().min(2),
    entity_type: z.string().min(2),
    country_of_incorporation: z.string().length(2),
    tax_identification_number: z.string().optional(),
    org_tier: z.enum(["starter", "growth", "enterprise"]).optional(),
  }),
  user: z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["admin", "manager", "analyst", "viewer"]).optional(),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function buildAuthUser(user) {
  return {
    id: user._id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    org_id: user.org_id,
  };
}

async function registerUserAndOrganization(input) {
  const payload = registerSchema.parse(input);
  const existing = await User.findOne({ email: payload.user.email.toLowerCase() }).lean();
  if (existing) {
    throw createServiceError("Email already in use", 409);
  }

  const organization = await Organization.create({
    ...payload.organization,
    country_of_incorporation: payload.organization.country_of_incorporation.toUpperCase(),
    is_active: true,
  });

  const password_hash = await bcrypt.hash(payload.user.password, 10);
  const user = await User.create({
    org_id: organization._id,
    full_name: payload.user.full_name,
    email: payload.user.email.toLowerCase(),
    password_hash,
    role: payload.user.role || "admin",
    is_active: true,
  });

  const token = signToken({
    userId: user._id.toString(),
    orgId: organization._id.toString(),
    role: user.role,
  });

  return {
    token,
    user: buildAuthUser(user),
    organization,
  };
}

async function loginUser(input) {
  const payload = loginSchema.parse(input);
  const user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user || !user.is_active) {
    throw createServiceError("Invalid credentials", 401);
  }
  const isMatch = await bcrypt.compare(payload.password, user.password_hash);
  if (!isMatch) {
    throw createServiceError("Invalid credentials", 401);
  }

  const token = signToken({
    userId: user._id.toString(),
    orgId: user.org_id.toString(),
    role: user.role,
  });

  return {
    token,
    user: buildAuthUser(user),
  };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId).select("-password_hash").lean();
  if (!user) {
    throw createServiceError("User not found", 404);
  }
  return user;
}

module.exports = {
  registerUserAndOrganization,
  loginUser,
  getCurrentUser,
  z,
};
