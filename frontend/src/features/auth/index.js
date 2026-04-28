/**
 * Barrel export for the auth feature.
 *
 * @example
 *   import { LoginPage, useAuth } from '../features/auth';
 */

// Pages / Components
export { default as LoginPage } from './components/LoginPage';
export { default as SignupPage } from './components/SignupPage';
export { default as ForgotPasswordPage } from './components/ForgotPasswordPage';
export { default as OtpVerificationPage } from './components/OtpVerificationPage';

// Hooks
export { useAuth } from './hooks/useAuth';
