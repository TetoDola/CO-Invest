/**
 * Validation utilities for manager registration and vault creation
 */

import { Address, isAddress } from 'viem';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!address) {
    errors.push({
      field: 'address',
      message: 'Wallet address is required',
    });
  } else if (!isAddress(address)) {
    errors.push({
      field: 'address',
      message: 'Invalid Ethereum address format',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate USDC balance for manager eligibility
 */
export function validateManagerBalance(
  balance: number,
  minRequired: number = 500
): ValidationResult {
  const errors: ValidationError[] = [];

  if (balance < minRequired) {
    errors.push({
      field: 'balance',
      message: `Minimum ${minRequired} USDC required. Current balance: ${balance.toFixed(2)} USDC`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate safety deposit amount
 */
export function validateSafetyDeposit(
  amount: number,
  minRequired: number = 200
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!amount || amount <= 0) {
    errors.push({
      field: 'safetyDeposit',
      message: 'Safety deposit amount is required',
    });
  } else if (amount < minRequired) {
    errors.push({
      field: 'safetyDeposit',
      message: `Minimum safety deposit is ${minRequired} USDC`,
    });
  } else if (amount > 1000000) {
    errors.push({
      field: 'safetyDeposit',
      message: 'Safety deposit amount is too large',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate vault name
 */
export function validateVaultName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'vaultName',
      message: 'Vault name is required',
    });
  } else if (name.length < 3) {
    errors.push({
      field: 'vaultName',
      message: 'Vault name must be at least 3 characters',
    });
  } else if (name.length > 50) {
    errors.push({
      field: 'vaultName',
      message: 'Vault name must be less than 50 characters',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate vault symbol
 */
export function validateVaultSymbol(symbol: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!symbol || symbol.trim().length === 0) {
    errors.push({
      field: 'vaultSymbol',
      message: 'Vault symbol is required',
    });
  } else if (symbol.length < 2) {
    errors.push({
      field: 'vaultSymbol',
      message: 'Vault symbol must be at least 2 characters',
    });
  } else if (symbol.length > 10) {
    errors.push({
      field: 'vaultSymbol',
      message: 'Vault symbol must be less than 10 characters',
    });
  } else if (!/^[A-Z0-9]+$/.test(symbol)) {
    errors.push({
      field: 'vaultSymbol',
      message: 'Vault symbol must contain only uppercase letters and numbers',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete vault creation form
 */
export function validateVaultCreation(data: {
  managerAddress: string;
  vaultName: string;
  vaultSymbol: string;
  safetyDeposit: number;
  managerBalance: number;
}): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate address
  const addressResult = validateAddress(data.managerAddress);
  allErrors.push(...addressResult.errors);

  // Validate manager balance
  const balanceResult = validateManagerBalance(data.managerBalance);
  allErrors.push(...balanceResult.errors);

  // Validate vault name
  const nameResult = validateVaultName(data.vaultName);
  allErrors.push(...nameResult.errors);

  // Validate vault symbol
  const symbolResult = validateVaultSymbol(data.vaultSymbol);
  allErrors.push(...symbolResult.errors);

  // Validate safety deposit
  const depositResult = validateSafetyDeposit(data.safetyDeposit);
  allErrors.push(...depositResult.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return errors.map(e => `• ${e.message}`).join('\n');
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate FID (Farcaster ID)
 */
export function validateFID(fid: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (!fid || fid <= 0) {
    errors.push({
      field: 'fid',
      message: 'Valid Farcaster ID required',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}