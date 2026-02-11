import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export interface ValidationResult {
  valid: boolean;
  errors: string[] | null;
}

export function validateInput(schema: object, data: unknown): ValidationResult {
  return validate(schema, data);
}

export function validateOutput(schema: object, data: unknown): ValidationResult {
  return validate(schema, data);
}

function validate(schema: object, data: unknown): ValidationResult {
  // Empty schema = no validation required
  if (!schema || Object.keys(schema).length === 0) {
    return { valid: true, errors: null };
  }

  const isValid = ajv.validate(schema, data);
  if (isValid) {
    return { valid: true, errors: null };
  }

  const errors = ajv.errors?.map(
    (e) => `${e.instancePath || '/'} ${e.message}`
  ) || ['Unknown validation error'];

  return { valid: false, errors };
}
