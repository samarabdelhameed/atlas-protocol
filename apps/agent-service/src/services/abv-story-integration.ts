/**
 * ABV.dev + Story Protocol Integration Service
 * 
 * This service:
 * 1. Generates license content using ABV.dev GenAI
 * 2. Registers the generated content as a new IP Asset on Story Protocol
 * 3. Links the new IP Asset to the original IP Asset
 */

import { generateLicenseContent, type ABVGeneratedContent } from '../clients/abvClient.js';
import { StoryProtocolService } from './story-protocol-service.js';
import { ethers } from 'ethers';
import { config } from '../config/index.js';

export interface ABVStoryIntegrationResult {
  success: boolean;
  generatedContent: ABVGeneratedContent;
  storyIPId?: string;
  transactionHash?: string;
  linkedToOriginalIP?: string;
  error?: string;
}

export class ABVStoryIntegration {
  private storyService: StoryProtocolService;

  constructor() {
    this.storyService = new StoryProtocolService();
  }

  /**
   * Generate license content and register as IP Asset on Story Protocol
   * 
   * @param originalIPId - The original IP Asset ID to link to
   * @param prompt - Prompt for generating license content
   * @param licenseType - Type of license
   * @param owner - Owner address for the new IP Asset
   * @returns Integration result
   */
  async generateAndRegisterIPAsset(
    originalIPId: string,
    prompt: string,
    licenseType: string,
    owner: string
  ): Promise<ABVStoryIntegrationResult> {
    try {
      console.log(`\n🔄 ABV + Story Integration: Generating and Registering IP Asset`);
      console.log(`   Original IP ID: ${originalIPId}`);
      console.log(`   License Type: ${licenseType}`);
      console.log(`   Owner: ${owner}\n`);

      // Step 1: Generate license content with ABV.dev
      console.log('📡 Step 1: Generating License Content with ABV.dev...\n');
      const generatedContent = await generateLicenseContent(prompt, licenseType);
      
      console.log(`✅ License Content Generated`);
      console.log(`   Content Hash: ${generatedContent.contentHash}`);
      console.log(`   Content Length: ${generatedContent.content.length} characters\n`);

      // Step 2: Register as IP Asset on Story Protocol
      console.log('📡 Step 2: Registering IP Asset on Story Protocol...\n');
      
      const ipAssetName = `License Agreement - ${licenseType} - ${new Date().toISOString().split('T')[0]}`;
      const ipAssetDescription = `Generated license agreement for ${licenseType} license type`;
      
      const storyIPAsset = await this.storyService.registerIPAsset({
        name: ipAssetName,
        description: ipAssetDescription,
        metadata: {
          source: 'abv-dev',
          licenseType: licenseType,
          originalIPId: originalIPId,
          contentHash: generatedContent.contentHash,
          generatedAt: new Date().toISOString(),
        },
        owner: owner,
        contentHash: generatedContent.contentHash,
      });

      console.log(`✅ IP Asset Registered on Story Protocol`);
      console.log(`   Story IP ID: ${storyIPAsset.ipId}`);
      console.log(`   Name: ${ipAssetName}\n`);

      // Step 3: Link to original IP Asset
      console.log('📡 Step 3: Linking to Original IP Asset...\n');
      
      try {
        await this.storyService.linkIPAssets({
          parentIPId: originalIPId,
          childIPId: storyIPAsset.ipId,
          relationshipType: 'derivative',
        });
        
        console.log(`✅ Linked to Original IP Asset: ${originalIPId}\n`);
      } catch (error: any) {
        console.warn(`⚠️  Could not link to original IP: ${error.message}`);
        // Continue even if linking fails
      }

      return {
        success: true,
        generatedContent,
        storyIPId: storyIPAsset.ipId,
        linkedToOriginalIP: originalIPId,
      };
    } catch (error: any) {
      console.error(`❌ ABV + Story Integration failed:`, error.message);
      
      return {
        success: false,
        generatedContent: {
          content: '',
          contentHash: '',
        },
        error: error.message,
      };
    }
  }

  /**
   * Generate license content for an existing license sale
   */
  async generateLicenseForSale(
    originalIPId: string,
    licensee: string,
    licenseType: string,
    price: string
  ): Promise<ABVStoryIntegrationResult> {
    const prompt = `Generate a comprehensive ${licenseType} license agreement for IP Asset ${originalIPId}. 
Licensee: ${licensee}
Price: ${price}
Include standard terms, usage rights, restrictions, and duration.`;

    // Use licensee as owner (or could use vault address)
    return this.generateAndRegisterIPAsset(
      originalIPId,
      prompt,
      licenseType,
      licensee
    );
  }
}

// Export singleton instance
export const abvStoryIntegration = new ABVStoryIntegration();

