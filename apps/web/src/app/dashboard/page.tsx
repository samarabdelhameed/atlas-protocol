'use client';

import { useState } from 'react';
import { 
  useVault, 
  useVaultHealth, 
  useCVSLeaderboard,
  useGlobalStats,
  useLoanEligibility 
} from '@atlas-protocol/graphql-client';

export default function DashboardPage() {
  const [vaultId, setVaultId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');

  // Global stats
  const { data: globalStats } = useGlobalStats();
  
  // CVS Leaderboard
  const { data: leaderboard } = useCVSLeaderboard(5);

  // Vault data (only if vaultId is set)
  const { data: vault, isLoading: vaultLoading } = useVault(vaultId);
  const { healthScore, metrics } = useVaultHealth(vaultId);
  const loanEligibility = useLoanEligibility(vaultId, loanAmount || '0');

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Atlas Protocol Dashboard</h1>

        {/* Global Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total IP Assets"
            value={globalStats?.totalIPAssets || '0'}
            icon="🎨"
          />
          <StatCard
            title="Total Licenses"
            value={globalStats?.totalLicenses || '0'}
            icon="📄"
          />
          <StatCard
            title="Total Loans"
            value={globalStats?.totalLoans || '0'}
            icon="💰"
          />
          <StatCard
            title="Verified Users"
            value={globalStats?.totalVerifiedUsers || '0'}
            icon="✅"
          />
        </div>

        {/* CVS Leaderboard */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">🏆 Top IP Assets by CVS</h2>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((asset: any, index: number) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-gray-500">
                        Creator: {asset.creator.slice(0, 6)}...{asset.creator.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      CVS: {asset.cvsScore}
                    </p>
                    <p className="text-sm text-gray-500">
                      Revenue: {asset.totalLicenseRevenue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Vault Lookup */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">🏦 Vault Lookup</h2>
          <input
            type="text"
            placeholder="Enter vault address (0x...)"
            value={vaultId}
            onChange={(e) => setVaultId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-4"
          />

          {vaultLoading && <p>Loading vault data...</p>}

          {vault && (
            <div className="space-y-6">
              {/* Vault Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current CVS</p>
                  <p className="text-2xl font-bold text-blue-600">{vault.currentCVS}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Max Loan Amount</p>
                  <p className="text-2xl font-bold text-green-600">{vault.maxLoanAmount}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Interest Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{vault.interestRate}%</p>
                </div>
              </div>

              {/* Health Score */}
              {healthScore > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">Vault Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            healthScore >= 80
                              ? 'bg-green-500'
                              : healthScore >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-bold">{healthScore.toFixed(0)}/100</span>
                  </div>
                  {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Utilization:</span>
                        <span className="ml-2 font-semibold">{metrics.utilizationRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">CVS Growth:</span>
                        <span className="ml-2 font-semibold">{metrics.cvsGrowth.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Liquidity:</span>
                        <span className="ml-2 font-semibold">{metrics.liquidityRatio.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Active Loans:</span>
                        <span className="ml-2 font-semibold">{metrics.activeLoans}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loan Eligibility Check */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-3">Check Loan Eligibility</h3>
                <input
                  type="number"
                  placeholder="Loan amount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mb-3"
                />
                {loanEligibility.isEligible !== undefined && loanAmount && (
                  <div
                    className={`p-3 rounded ${
                      loanEligibility.isEligible
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {loanEligibility.isEligible ? (
                      <>
                        <p className="font-semibold">✅ Eligible for loan</p>
                        <p className="text-sm mt-1">
                          Interest Rate: {loanEligibility.interestRate}%
                        </p>
                        <p className="text-sm">
                          Collateral Required: {loanEligibility.collateralRatio}%
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">❌ Not eligible</p>
                        <p className="text-sm mt-1">
                          Max loan amount: {loanEligibility.maxLoanAmount}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* IP Asset Info */}
              {vault.ipAsset && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">IP Asset</h3>
                  <p className="font-medium">{vault.ipAsset.name}</p>
                  <p className="text-sm text-gray-500">
                    Creator: {vault.ipAsset.creator}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Usage Count:</span>
                      <span className="ml-2 font-semibold">{vault.ipAsset.totalUsageCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Revenue:</span>
                      <span className="ml-2 font-semibold">{vault.ipAsset.totalLicenseRevenue}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CVS Score:</span>
                      <span className="ml-2 font-semibold">{vault.ipAsset.cvsScore}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Loans */}
              {vault.loans && vault.loans.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-3">Active Loans ({vault.loans.length})</h3>
                  <div className="space-y-2">
                    {vault.loans.slice(0, 5).map((loan: any) => (
                      <div
                        key={loan.id}
                        className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Borrower: {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                          </span>
                          <span className="font-semibold">{loan.loanAmount}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Interest: {loan.interestRate}% | CVS at Issuance: {loan.cvsAtIssuance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

