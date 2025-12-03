/**
 * Authentication Service for License Holders
 *
 * Implements wallet-based authentication using challenge-response pattern:
 * 1. Client requests a nonce (challenge)
 * 2. Client signs the nonce with their wallet
 * 3. Server verifies the signature and issues a JWT token
 * 4. JWT token used to access protected license data endpoints
 */

import { recoverMessageAddress } from 'viem';
import jwt from 'jsonwebtoken';

// In-memory storage for challenges (use Redis in production)
const challenges = new Map<string, { nonce: string; timestamp: number }>();

// Challenge expiration time (5 minutes)
const CHALLENGE_EXPIRATION = 5 * 60 * 1000;

// JWT secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-license-jwt-secret-change-in-production';

// JWT expiration (24 hours)
const JWT_EXPIRATION = '24h';

export interface AuthChallenge {
  nonce: string;
  message: string;
}

export interface VerifySignatureRequest {
  address: string;
  signature: string;
}

export interface AuthToken {
  token: string;
  address: string;
  expiresAt: number;
}

/**
 * Generate a random nonce for challenge-response authentication
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate authentication challenge for a wallet address
 */
export function generateChallenge(address: string): AuthChallenge {
  // Clean up expired challenges periodically
  const now = Date.now();
  for (const [addr, challenge] of challenges.entries()) {
    if (now - challenge.timestamp > CHALLENGE_EXPIRATION) {
      challenges.delete(addr);
    }
  }

  const nonce = generateNonce();
  const message = `Sign this message to authenticate with Atlas Protocol.\n\nNonce: ${nonce}\nAddress: ${address}`;

  challenges.set(address.toLowerCase(), {
    nonce,
    timestamp: now,
  });

  console.log(`🔐 Generated auth challenge for ${address}`);

  return { nonce, message };
}

/**
 * Verify wallet signature and issue JWT token
 */
export async function verifySignature(
  address: string,
  signature: string
): Promise<AuthToken | null> {
  try {
    const lowerAddress = address.toLowerCase();
    const challenge = challenges.get(lowerAddress);

    if (!challenge) {
      console.warn(`❌ No challenge found for address ${address}`);
      return null;
    }

    // Check if challenge has expired
    const now = Date.now();
    if (now - challenge.timestamp > CHALLENGE_EXPIRATION) {
      console.warn(`⏰ Challenge expired for address ${address}`);
      challenges.delete(lowerAddress);
      return null;
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to authenticate with Atlas Protocol.\n\nNonce: ${challenge.nonce}\nAddress: ${address}`;

    console.log(`🔍 Verifying signature for ${address}`);
    console.log(`   Message: ${message.substring(0, 50)}...`);
    console.log(`   Signature: ${signature?.substring(0, 20)}...`);

    // Validate signature format
    if (!signature || typeof signature !== 'string' || !signature.startsWith('0x')) {
      console.warn(`❌ Invalid signature format for ${address}`);
      return null;
    }

    // Recover the address from the signature
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    console.log(`   Recovered: ${recoveredAddress}`);

    // Verify the recovered address matches the claimed address
    if (recoveredAddress.toLowerCase() !== lowerAddress) {
      console.warn(`❌ Signature verification failed for ${address}`);
      console.warn(`   Expected: ${lowerAddress}`);
      console.warn(`   Recovered: ${recoveredAddress.toLowerCase()}`);
      return null;
    }

    // Signature is valid - issue JWT token
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const token = jwt.sign(
      {
        address: lowerAddress,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Clean up the used challenge
    challenges.delete(lowerAddress);

    console.log(`✅ Authentication successful for ${address}`);

    return {
      token,
      address: lowerAddress,
      expiresAt,
    };
  } catch (error: any) {
    console.error(`❌ Error verifying signature for ${address}:`, error.message);
    return null;
  }
}

/**
 * Verify JWT token and extract address
 */
export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
    return decoded.address;
  } catch (error: any) {
    console.warn(`❌ Invalid or expired token: ${error.message}`);
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
