import { db } from "@/server/db";
import { getAuth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";

interface CreateContextOptions {
  session: ReturnType<typeof getAuth>;
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req } = opts; // `req` adalah objek request dari Next.js

  const session = getAuth(req); // Mendapatkan info sesi Clerk

  return createInnerTRPCContext({
    // Membuat context dengan session dan db
    session,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

// protectedProcedure adalah sebuah Guard/Proteksi
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session.userId) {
    // <-- Memeriksa userId dari contex
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session },
    },
  });
});

export const publicProcedure = t.procedure;
