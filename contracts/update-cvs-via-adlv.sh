#!/bin/bash

# Update CVS via ADLV contract (since ADLV is the owner of IDO)

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./update-cvs-via-adlv.sh <IP_ID> <CVS_VALUE>"
    echo "Example: ./update-cvs-via-adlv.sh 0x1234...1234 5000000000000000000000"
    exit 1
fi

IP_ID=$1
CVS_VALUE=$2

source .env

ADLV_ADDRESS=0x572C39bE4E794Fac01f0CdfAe2d2471C52E49713
IDO_ADDRESS=0x3EA9ad0D33C6Bc4f5868E38d7F12635868B9af2B

echo "=========================================="
echo "Updating CVS via ADLV"
echo "=========================================="
echo "ADLV: $ADLV_ADDRESS"
echo "IDO: $IDO_ADDRESS"
echo "IP ID: $IP_ID"
echo "CVS Value: $CVS_VALUE"
echo ""

# Encode the updateCVS call
CALLDATA=$(cast calldata "updateCVS(bytes32,uint256)" $IP_ID $CVS_VALUE)

echo "Calldata: $CALLDATA"
echo ""

# We need to call IDO.updateCVS from ADLV context
# But ADLV doesn't have a function to do arbitrary calls
# So we need to add a helper function or use a different approach

echo "❌ ERROR: ADLV doesn't have a function to call IDO.updateCVS"
echo ""
echo "Solution: Add this function to ADLV.sol:"
echo ""
echo "function updateIPCVS(bytes32 ipId, uint256 newCVS) external onlyOwner {"
echo "    idoContract.updateCVS(ipId, newCVS);"
echo "}"
echo ""
echo "Then redeploy ADLV or use the old method (manual CVS updates)"
