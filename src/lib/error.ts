import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
// Utility to parse errors and extract reason/message and code

export interface ParsedError {
  message: string;
  code?: string;
  meta?: any;
}

export function parseError(error: unknown): ParsedError {
  // Prisma error types
  if (error instanceof PrismaClientKnownRequestError) {
    return {
      message: (error as any).message,
      code: (error as any).code,
      meta: (error as any).meta,
    };
  }
  if (
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientRustPanicError ||
    error instanceof PrismaClientInitializationError ||
    error instanceof PrismaClientValidationError
  ) {
    return {
      message: (error as any).message,
      code: (error as any).code || (error as any).errorCode,
    };
  }

  // Standard JS Error
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Fallback for string or unknown error
  return {
    message: typeof error === 'string' ? error : 'Unknown error',
  };
}
