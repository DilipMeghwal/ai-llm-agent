import dotenv from 'dotenv';
import path from 'path';
import Ajv from 'ajv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

const envSchema = {
  type: 'object',
  properties: {
    BASE_URL: { type: 'string', minLength: 1 },
    ENV: { type: 'string', enum: ['local', 'qa', 'staging', 'prod'], default: 'local' },
    API_TIMEOUT: { type: 'number', default: 30000 },
    LOG_LEVEL: { type: 'string', enum: ['info', 'debug', 'warn', 'error'], default: 'info' },
    MOCK_API: { type: 'boolean', default: false },
  },
  required: ['BASE_URL'],
} as const;

export interface EnvConfig {
  BASE_URL: string;
  ENV: 'local' | 'qa' | 'staging' | 'prod';
  API_TIMEOUT: number;
  LOG_LEVEL: string;
  MOCK_API: boolean;
}

const rawConfig = {
  BASE_URL: process.env.BASE_URL || 'https://parabank.parasoft.com/parabank/services/bank/',
  ENV: process.env.ENV || 'local',
  API_TIMEOUT: process.env.API_TIMEOUT ? Number(process.env.API_TIMEOUT) : 30000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MOCK_API: process.env.MOCK_API === 'true',
};

const validateEnv = ajv.compile(envSchema);

if (!validateEnv(rawConfig)) {
  const errors = ajv.errorsText(validateEnv.errors);
  throw new Error(`Environment validation failed: ${errors}`);
}

export const ENV_CONFIG: EnvConfig = rawConfig as EnvConfig;
