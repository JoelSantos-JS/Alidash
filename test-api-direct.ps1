# Test API directly to see installment_info response
Write-Host "🧪 Testing Transactions API for installment_info issue" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$userId = "f06c3c27-5862-4332-96f2-d0f1e62bf9cc"
$apiUrl = "http://localhost:9002/api/transactions/get?user_id=$userId"

Write-Host ""
Write-Host "📡 Making API call to: $apiUrl" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -ContentType "application/json"
    
    Write-Host "✅ API call successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Response summary:" -ForegroundColor Yellow
    Write-Host "  - Transaction count: $($response.count)" -ForegroundColor White
    
    if ($response.transactions -and $response.transactions.Count -gt 0) {
        Write-Host ""
        Write-Host "🔍 Checking for installment transactions..." -ForegroundColor Yellow
        
        $installmentTransactions = $response.transactions | Where-Object { $_.isInstallment -eq $true }
        Write-Host "  - Installment transactions found: $($installmentTransactions.Count)" -ForegroundColor White
        
        if ($installmentTransactions.Count -gt 0) {
            Write-Host ""
            Write-Host "💳 Installment transaction details:" -ForegroundColor Green
            foreach ($tx in $installmentTransactions) {
                Write-Host "  ID: $($tx.id)" -ForegroundColor White
                Write-Host "  Description: $($tx.description)" -ForegroundColor White
                Write-Host "  isInstallment: $($tx.isInstallment)" -ForegroundColor White
                Write-Host "  installmentInfo: $($tx.installmentInfo)" -ForegroundColor $(if ($tx.installmentInfo) { "Green" } else { "Red" })
                Write-Host "  installmentInfo type: $($tx.installmentInfo.GetType().Name)" -ForegroundColor White
                Write-Host "  ---" -ForegroundColor Gray
            }
        } else {
            Write-Host ""
            Write-Host "❌ No installment transactions found in API response!" -ForegroundColor Red
            Write-Host "🔍 All transactions:" -ForegroundColor Yellow
            foreach ($tx in $response.transactions) {
                Write-Host "  ID: $($tx.id)" -ForegroundColor White
                Write-Host "  Description: $($tx.description)" -ForegroundColor White
                Write-Host "  isInstallment: $($tx.isInstallment)" -ForegroundColor White
                Write-Host "  ---" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ No transactions found" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📄 Full JSON response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "❌ API call failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green