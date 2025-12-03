/**
 * License Authentication Hook
 *
 * Provides wallet-based authentication for license holders to access
 * their purchased IP intelligence data.
 *
 * Flow:
 * 1. Request authentication challenge
 * 2. Sign message with wallet
 * 3. Verify signature and receive JWT token
 * 4. Store token for API requests
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'atlas_license_token';
const TOKEN_EXPIRY_KEY = 'atlas_license_token_expiry';

interface AuthToken {
  token: string;
  address: string;
  expiresAt: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  token: string | null;
  error: string | null;
}

export function useLicenseAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    token: null,
    error: null,
  });

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (storedToken && expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();

      if (now < expiry) {
        setAuthState({
          isAuthenticated: true,
          isAuthenticating: false,
          token: storedToken,
          error: null,
        });
      } else {
        // Token expired, clear it
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
    }
  }, []);

  /**
   * Authenticate user by signing a challenge message
   */
  const authenticate = async (): Promise<boolean> => {
    if (!address || !isConnected) {
      setAuthState(prev => ({
        ...prev,
        error: 'Please connect your wallet first',
      }));
      return false;
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      // Step 1: Request challenge from backend
      console.log('🔐 Requesting authentication challenge...');
      const challengeResponse = await fetch(`${BACKEND_URL}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { message } = await challengeResponse.json();

      // Step 2: Sign the challenge message
      console.log('✍️  Signing authentication message...');
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature and get JWT token
      console.log('🔍 Verifying signature...');
      const verifyResponse = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Signature verification failed');
      }

      const authToken: AuthToken = await verifyResponse.json();

      // Store token and expiry
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, authToken.expiresAt.toString());

      setAuthState({
        isAuthenticated: true,
        isAuthenticating: false,
        token: authToken.token,
        error: null,
      });

      console.log('✅ Authentication successful!');
      return true;
    } catch (error: any) {
      console.error('❌ Authentication failed:', error);
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        token: null,
        error: error.message || 'Authentication failed',
      });
      return false;
    }
  };

  /**
   * Sign out and clear authentication
   */
  const signOut = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);

    setAuthState({
      isAuthenticated: false,
      isAuthenticating: false,
      token: null,
      error: null,
    });

    console.log('👋 Signed out');
  };

  /**
   * Get authorization header for API requests
   */
  const getAuthHeader = (): Record<string, string> => {
    if (!authState.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${authState.token}`,
    };
  };

  return {
    ...authState,
    authenticate,
    signOut,
    getAuthHeader,
  };
}
