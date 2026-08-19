import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const resetPasswordRequestSchema = {
  type: 'object',
  properties: {
    newPassword: { type: 'string', minLength: 1 },
  },
  required: ['newPassword'],
  additionalProperties: false,
} as const;

export const resetPasswordResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    success: { type: 'boolean' },
    updatedAt: { type: 'string' },
  },
  required: ['success'],
  additionalProperties: true,
} as const;

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
  required: [],
  additionalProperties: true,
} as const;

const validateResetPasswordResponse = ajv.compile(resetPasswordResponseSchema);
const validateErrorResponse = ajv.compile(errorResponseSchema);

export function parseResetPasswordResponse(data: unknown) {
  if (typeof data === 'object' && data !== null && !validateResetPasswordResponse(data)) {
    throw new Error(`ResetPasswordResponse schema validation failed: ${ajv.errorsText(validateResetPasswordResponse.errors)}`);
  }
  return data;
}

export function parseErrorResponse(data: unknown) {
  if (typeof data === 'object' && data !== null && !validateErrorResponse(data)) {
    throw new Error(`ErrorResponse schema validation failed: ${ajv.errorsText(validateErrorResponse.errors)}`);
  }
  return data;
}
