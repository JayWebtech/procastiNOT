/**
 * Professional Yup-based Validation System
 * Provides clean, maintainable form validation using Yup schema validation
 */

import * as yup from 'yup';

/**
 * Challenge form validation schema using Yup
 */
export const challengeFormSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  taskDescription: yup
    .string()
    .required('Task description is required')
    .min(10, 'Task description must be at least 10 characters')
    .max(500, 'Task description must be no more than 500 characters'),

  accountabilityPartnerEmail: yup
    .string()
    .required('Accountability partner email is required')
    .email('Please enter a valid accountability partner email'),

  accountabilityPartnerWallet: yup
    .string()
    .required('Accountability partner wallet address is required')
    .matches(
      /^0x[a-fA-F0-9]{64}$/,
      'Please enter a valid Starknet wallet address (0x + 64 hex characters)'
    ),

  timeLocked: yup
    .string()
    .required('Challenge duration is required')
    .test('is-valid-duration', 'Please select a valid challenge duration', (value) => {
      return Boolean(value && parseInt(value) > 0);
    }),

  amount: yup
    .number()
    .required('Stake amount is required')
    .min(0.1, 'Stake amount must be at least 0.1 STRK')
    .typeError('Please enter a valid number')
});

/**
 * Validate form data using Yup schema
 */
export async function validateChallengeFormData(formData: any): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
}> {
  try {
    await challengeFormSchema.validate(formData, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
}

/**
 * Validate individual field
 */
export async function validateField(
  fieldName: string,
  value: any,
  schema: yup.ObjectSchema<any>
): Promise<string | null> {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Invalid value';
  }
}

/**
 * Real-time field validation for immediate feedback
 */
export async function validateFieldRealtime(
  fieldName: string,
  value: any
): Promise<string | null> {
  try {
    await challengeFormSchema.validateAt(fieldName, { [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Invalid value';
  }
}

/**
 * Wallet and network validation (separate from form validation)
 */
export function validateWalletAndNetwork(
  address?: string,
  account?: any,
  isMainnet: boolean = true
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!address || !account) {
    errors.wallet = 'Please connect your wallet to proceed';
  }

  // Allow both mainnet and testnet for now
  // if (!isMainnet) {
  //   errors.network = 'Please switch to Starknet Mainnet to create real challenges';
  // }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Comprehensive validation combining form data, wallet, and network
 */
export async function validateCompleteChallengeForm(
  formData: any,
  address?: string,
  account?: any,
  isMainnet: boolean = true
): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
}> {
  // First validate wallet and network
  const walletNetworkValidation = validateWalletAndNetwork(address, account, isMainnet);
  
  if (!walletNetworkValidation.isValid) {
    return walletNetworkValidation;
  }

  // Then validate form data
  return await validateChallengeFormData(formData);
}

/**
 * Custom validation rules for common use cases
 */
export const customValidationRules = {
  // Validate Starknet wallet address
  starknetWallet: yup
    .string()
    .matches(
      /^0x[a-fA-F0-9]{64}$/,
      'Please enter a valid Starknet wallet address'
    ),

  // Validate email with custom message
  email: (message?: string) => yup
    .string()
    .required('Email is required')
    .email(message || 'Please enter a valid email address'),

  // Validate minimum amount
  minAmount: (min: number, message?: string) => yup
    .number()
    .min(min, message || `Amount must be at least ${min}`)
    .typeError('Please enter a valid number'),

  // Validate required string with length
  requiredString: (minLength?: number, maxLength?: number, message?: string) => {
    let schema = yup.string().required(message || 'This field is required');
    if (minLength) schema = schema.min(minLength, `Must be at least ${minLength} characters`);
    if (maxLength) schema = schema.max(maxLength, `Must be no more than ${maxLength} characters`);
    return schema;
  }
};

/**
 * Example usage for other forms:
 * 
 * const loginSchema = yup.object().shape({
 *   email: customValidationRules.email(),
 *   password: customValidationRules.requiredString(8, 50, 'Password is required')
 * });
 * 
 * const result = await validateFormData(loginData, loginSchema);
 */
