import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema/customers";
import { projects } from "@/db/schema/projects";
import type {
  CustomerProfile,
  LoginInput,
  RegisterCustomerInput,
  SessionPayload,
} from "@/features/customer/types";
import {
  loginSchema,
  registerCustomerSchema,
} from "@/features/customer/schemas/customer-schema";

export const SESSION_COOKIE_NAME = "repp_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getAuthSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "repp-fallback-development-secret-key-32-chars-minimum";
  return new TextEncoder().encode(secret);
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "EMAIL_EXISTS"
      | "INVALID_CREDENTIALS"
      | "UNAUTHORIZED"
      | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const key = getAuthSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const key = getAuthSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return {
      customerId: payload.customerId as string,
      email: payload.email as string,
      stageName: payload.stageName as string,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return verifySessionToken(sessionCookie.value);
}

export async function requireAuthCustomerId(): Promise<string> {
  const session = await getSession();
  if (!session?.customerId) {
    throw new AuthServiceError(
      "Você precisa estar autenticado para realizar esta operação.",
      "UNAUTHORIZED"
    );
  }
  return session.customerId;
}

export async function getAuthenticatedCustomer(): Promise<CustomerProfile | null> {
  const session = await getSession();
  if (!session?.customerId) {
    return null;
  }

  const [customer] = await db
    .select({
      id: customers.id,
      fullName: customers.fullName,
      stageName: customers.stageName,
      email: customers.email,
      cpf: customers.cpf,
      phone: customers.phone,
      instagram: customers.instagram,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(eq(customers.id, session.customerId))
    .limit(1);

  return customer || null;
}

export async function registerCustomer(
  input: RegisterCustomerInput
): Promise<{ customer: CustomerProfile; token: string }> {
  const validated = registerCustomerSchema.parse(input);

  // Business rule 1: Email must be unique
  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, validated.email))
    .limit(1);

  if (existing) {
    throw new AuthServiceError(
      "Este endereço de e-mail já está cadastrado.",
      "EMAIL_EXISTS"
    );
  }

  const passwordHash = await hashPassword(validated.password);

  const [created] = await db
    .insert(customers)
    .values({
      fullName: validated.fullName,
      stageName: validated.stageName,
      email: validated.email,
      passwordHash,
      cpf: validated.cpf || null,
      phone: validated.phone || null,
      instagram: validated.instagram || null,
    })
    .returning();

  // Business rule: Create default initial project with customer stageName
  await db.insert(projects).values({
    customerId: created.id,
    name: created.stageName || "Meu Projeto Principal",
    description: "Projeto padrão do acervo de apresentações",
  });

  const sessionPayload: SessionPayload = {
    customerId: created.id,
    email: created.email,
    stageName: created.stageName,
  };

  const token = await createSessionToken(sessionPayload);
  await setSessionCookie(token);

  const profile: CustomerProfile = {
    id: created.id,
    fullName: created.fullName,
    stageName: created.stageName,
    email: created.email,
    cpf: created.cpf,
    phone: created.phone,
    instagram: created.instagram,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };

  return { customer: profile, token };
}

export async function loginCustomer(
  input: LoginInput
): Promise<{ customer: CustomerProfile; token: string }> {
  const validated = loginSchema.parse(input);

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, validated.email))
    .limit(1);

  if (!customer) {
    throw new AuthServiceError(
      "E-mail ou senha incorretos.",
      "INVALID_CREDENTIALS"
    );
  }

  const isValidPassword = await verifyPassword(
    validated.password,
    customer.passwordHash
  );

  if (!isValidPassword) {
    throw new AuthServiceError(
      "E-mail ou senha incorretos.",
      "INVALID_CREDENTIALS"
    );
  }

  const sessionPayload: SessionPayload = {
    customerId: customer.id,
    email: customer.email,
    stageName: customer.stageName,
  };

  const token = await createSessionToken(sessionPayload);
  await setSessionCookie(token);

  const profile: CustomerProfile = {
    id: customer.id,
    fullName: customer.fullName,
    stageName: customer.stageName,
    email: customer.email,
    cpf: customer.cpf,
    phone: customer.phone,
    instagram: customer.instagram,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };

  return { customer: profile, token };
}

export async function logoutCustomer(): Promise<void> {
  await clearSessionCookie();
}
