# Cache Testing Script for StartupSphere API
# This script tests if caching is working by measuring response times

Write-Host "=== StartupSphere Cache Testing ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080"
$endpoint = "$baseUrl/startups?page=0&size=10"

Write-Host "Testing endpoint: $endpoint" -ForegroundColor Yellow
Write-Host ""

# Test 1: First request (cache miss - should be slower)
Write-Host "Test 1: First request (cache miss)..." -ForegroundColor Green
$time1 = Measure-Command {
    try {
        $response1 = Invoke-WebRequest -Uri $endpoint -UseBasicParsing
        Write-Host "  Status: $($response1.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Time: $($time1.TotalMilliseconds) ms" -ForegroundColor White
Write-Host ""

# Wait a moment
Start-Sleep -Milliseconds 500

# Test 2: Second request (cache hit - should be faster)
Write-Host "Test 2: Second request (cache hit)..." -ForegroundColor Green
$time2 = Measure-Command {
    try {
        $response2 = Invoke-WebRequest -Uri $endpoint -UseBasicParsing
        Write-Host "  Status: $($response2.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Time: $($time2.TotalMilliseconds) ms" -ForegroundColor White
Write-Host ""

# Test 3: Third request (cache hit - should be fast)
Write-Host "Test 3: Third request (cache hit)..." -ForegroundColor Green
$time3 = Measure-Command {
    try {
        $response3 = Invoke-WebRequest -Uri $endpoint -UseBasicParsing
        Write-Host "  Status: $($response3.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Time: $($time3.TotalMilliseconds) ms" -ForegroundColor White
Write-Host ""

# Calculate improvement
$improvement2 = [math]::Round((($time1.TotalMilliseconds - $time2.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 2)
$improvement3 = [math]::Round((($time1.TotalMilliseconds - $time3.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 2)

# Results
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "First request:  $($time1.TotalMilliseconds) ms (cache miss)" -ForegroundColor Yellow
Write-Host "Second request: $($time2.TotalMilliseconds) ms (cache hit) - $improvement2% faster" -ForegroundColor $(if($improvement2 -gt 50) {"Green"} else {"Yellow"})
Write-Host "Third request:  $($time3.TotalMilliseconds) ms (cache hit) - $improvement3% faster" -ForegroundColor $(if($improvement3 -gt 50) {"Green"} else {"Yellow"})
Write-Host ""

# Verdict
if ($improvement2 -gt 50 -and $improvement3 -gt 50) {
    Write-Host "✅ CACHING IS WORKING! Requests 2 and 3 are significantly faster." -ForegroundColor Green
} elseif ($improvement2 -gt 20 -or $improvement3 -gt 20) {
    Write-Host "⚠️  CACHING MAY BE WORKING, but improvement is less than expected." -ForegroundColor Yellow
    Write-Host "   This could be normal if your database is very fast or dataset is small." -ForegroundColor Gray
} else {
    Write-Host "❌ CACHING MAY NOT BE WORKING. All requests took similar time." -ForegroundColor Red
    Write-Host "   Check application logs for cache-related errors." -ForegroundColor Gray
}
Write-Host ""

# Test different pagination (should be cache miss)
Write-Host "Test 4: Different page (should be cache miss)..." -ForegroundColor Green
$endpoint2 = "$baseUrl/startups?page=1&size=10"
$time4 = Measure-Command {
    try {
        $response4 = Invoke-WebRequest -Uri $endpoint2 -UseBasicParsing
        Write-Host "  Status: $($response4.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "  Time: $($time4.TotalMilliseconds) ms (should be similar to first request)" -ForegroundColor White
Write-Host ""

# Test 5: Repeat page 1 (should be cache hit)
Write-Host "Test 5: Repeat page 1 (should be cache hit)..." -ForegroundColor Green
$time5 = Measure-Command {
    try {
        $response5 = Invoke-WebRequest -Uri $endpoint2 -UseBasicParsing
        Write-Host "  Status: $($response5.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "  Time: $($time5.TotalMilliseconds) ms (should be faster)" -ForegroundColor White
$improvement5 = [math]::Round((($time4.TotalMilliseconds - $time5.TotalMilliseconds) / $time4.TotalMilliseconds) * 100, 2)
Write-Host "  Improvement: $improvement5%" -ForegroundColor $(if($improvement5 -gt 50) {"Green"} else {"Yellow"})
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "- Check application logs for 'Cache hit' and 'Cache miss' messages" -ForegroundColor Gray
Write-Host "- First requests populate the cache (cache miss)" -ForegroundColor Gray
Write-Host "- Subsequent identical requests use cached data (cache hit)" -ForegroundColor Gray
Write-Host "- Cache expires after 5 minutes (TTL)" -ForegroundColor Gray
