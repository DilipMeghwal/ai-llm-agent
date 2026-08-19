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

if (!sharedAjv.getSchema('common.error.schema.json')) {
  sharedAjv.addSchema(commonErrorSchema);
}
