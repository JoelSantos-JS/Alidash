#!/bin/bash

# Test Transactions API for Installment Info
# This script tests the /api/transactions/get endpoint

echo "🧪 Testing Transactions API for Installment Info"
echo "==============================================="

# Your user ID from the transaction data
USER_ID="f06c3c27-5862-4332-96f2-d0f1e62bf9cc"
API_URL="http://localhost:9002/api/transactions/get?user_id=${USER_ID}"

echo "📡 Making API call to: $API_URL"
echo ""

# Make the API call and save response
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" "$API_URL")

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
json_response=$(echo "$response" | head -n -1)

echo "📊 HTTP Status: $http_status"
echo ""

if [ "$http_status" = "200" ]; then
    echo "✅ API call successful!"
    echo ""
    
    # Check if we have transactions
    transaction_count=$(echo "$json_response" | jq -r '.count // 0')
    echo "📈 Transaction count: $transaction_count"
    
    if [ "$transaction_count" -gt 0 ]; then
        echo ""
        echo "🔍 Checking for installment transactions..."
        
        # Check for installment transactions
        installment_count=$(echo "$json_response" | jq '[.transactions[] | select(.isInstallment == true)] | length')
        echo "💳 Installment transactions found: $installment_count"
        
        if [ "$installment_count" -gt 0 ]; then
            echo ""
            echo "📋 Installment transaction details:"
            echo "$json_response" | jq -r '.transactions[] | select(.isInstallment == true) | "ID: \(.id)\nDescription: \(.description)\nisInstallment: \(.isInstallment)\ninstallmentInfo: \(.installmentInfo // "null")\n---"'
        else
            echo ""
            echo "❌ No installment transactions found in API response"
            echo "🔍 All transactions:"
            echo "$json_response" | jq -r '.transactions[] | "ID: \(.id)\nDescription: \(.description)\nisInstallment: \(.isInstallment // false)\n---"'
        fi
    else
        echo "❌ No transactions found"
    fi
    
    echo ""
    echo "📄 Full JSON response:"
    echo "$json_response" | jq '.'
    
else
    echo "❌ API call failed!"
    echo "📄 Error response:"
    echo "$json_response"
fi

echo ""
echo "✅ Test completed!"