/**
 * ABV.dev Client - Register Licenses as IP Assets
 * 
 * ABV.dev provides GenAI licensing services
 * This client registers licenses sold on Atlas Protocol as IP assets on ABV.dev
 */

export interface ABVLicenseRegistration {
  ipAssetId: string;
  vaultAddress: string;
  licensee: string;
  licenseType: string;
  price: string;
  vaultShare: string;
  creatorShare: string;
  timestamp: string;
}

export interface ABVLicenseResponse {
  licenseId: string;
  status: 'registered' | 'pending' | 'failed';
  abvAssetId?: string;
  message?: string;
}

/**
 * Register a license with ABV.dev API
 * 
 * @param licenseData - License registration data
 * @returns ABV.dev license response
 */
export async function registerLicenseWithABV(
  licenseData: ABVLicenseRegistration
): Promise<ABVLicenseResponse> {
  const apiKey = process.env.ABV_API_KEY;
  const apiUrl = process.env.ABV_API_URL || 'https://api.abv.dev/v1/licenses';
  
  if (!apiKey) {
    throw new Error('ABV_API_KEY not set in environment variables. Please set ABV_API_KEY in .env file');
  }

  try {
    console.log(`🔍 Registering license with ABV.dev for IP Asset: ${licenseData.ipAssetId}`);
    console.log(`   Licensee: ${licenseData.licensee}`);
    console.log(`   License Type: ${licenseData.licenseType}`);
    console.log(`   Price: ${(Number(licenseData.price) / 1e18).toFixed(4)} ETH`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-ABV-API-Key': apiKey, // Alternative header format
      },
      body: JSON.stringify({
        ipAssetId: licenseData.ipAssetId,
        vaultAddress: licenseData.vaultAddress,
        licensee: licenseData.licensee,
        licenseType: licenseData.licenseType,
        price: licenseData.price,
        vaultShare: licenseData.vaultShare,
        creatorShare: licenseData.creatorShare,
        timestamp: licenseData.timestamp,
        source: 'atlas-protocol',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ABV.dev API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ ABV.dev Response:', JSON.stringify(data, null, 2));
    
    return {
      licenseId: data.licenseId || data.id || data.license_id || 'registered',
      status: data.status || 'registered',
      abvAssetId: data.abvAssetId || data.abv_asset_id || data.assetId,
      message: data.message || data.msg,
    };
  } catch (error: any) {
    console.error('❌ Error registering license with ABV.dev:', error.message);
    throw error;
  }
}

/**
 * Batch register multiple licenses with ABV.dev
 */
export async function batchRegisterLicenses(
  licenses: ABVLicenseRegistration[]
): Promise<ABVLicenseResponse[]> {
  console.log(`🔍 Registering ${licenses.length} licenses with ABV.dev...`);
  
  const results: ABVLicenseResponse[] = [];
  
  for (const license of licenses) {
    try {
      const result = await registerLicenseWithABV(license);
      results.push(result);
    } catch (error: any) {
      console.error(`❌ Failed to register license ${license.ipAssetId}:`, error.message);
      results.push({
        licenseId: '',
        status: 'failed',
        message: error.message,
      });
    }
  }
  
  const successCount = results.filter(r => r.status === 'registered').length;
  console.log(`✅ Registered ${successCount}/${licenses.length} licenses with ABV.dev`);
  
  return results;
}

