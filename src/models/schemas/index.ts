import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Centralized AJV Singleton with strict format support and schema caching
 */
export const sharedAjv = new Ajv({
  allErrors: true,
  strict: false,
  useDefaults: true,
});

addFormats(sharedAjv);

/**
 * Shared Common Error Schema definition for cross-domain $ref resolution
 */
export const commonErrorSchema = {
  $id: 'common.error.schema.json',
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
  additionalProperties: true,
} as const;

// Register common schemas in central AJV instance
if (!sharedAjv.getSchema('common.error.schema.json')) {
  sharedAjv.addSchema(commonErrorSchema);
}
