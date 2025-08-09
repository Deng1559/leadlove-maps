# PowerShell Test Runner for Windows
# LeadLove Maps Credit System Test Automation
# Compatible with Windows PowerShell and PowerShell Core

param(
    [string]$TestSuite = "all",
    [switch]$Coverage = $false,
    [switch]$Watch = $false,
    [switch]$Verbose = $false,
    [switch]$CI = $false,
    [string]$Browser = "chromium",
    [switch]$Headed = $false,
    [int]$Workers = 0
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Blue
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" $Green
    }
    catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js" $Red
        exit 1
    }
    
    # Check npm packages
    if (!(Test-Path "node_modules")) {
        Write-ColorOutput "📦 Installing dependencies..." $Yellow
        npm install
    }
    
    # Check if Playwright is installed
    try {
        npx playwright --version | Out-Null
        Write-ColorOutput "✅ Playwright is available" $Green
    }
    catch {
        Write-ColorOutput "📥 Installing Playwright..." $Yellow
        npx playwright install
    }
    
    Write-ColorOutput "✅ Prerequisites check complete" $Green
}

function Start-TestEnvironment {
    Write-ColorOutput "🚀 Starting test environment..." $Blue
    
    # Create test directories
    $testDirs = @(
        "test-results",
        "test-results\screenshots",
        "test-results\videos", 
        "test-results\traces",
        "test-results\accessibility",
        "test-results\performance",
        "test-results\security",
        "playwright-report",
        "coverage"
    )
    
    foreach ($dir in $testDirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorOutput "📁 Created directory: $dir" $Green
        }
    }
    
    # Start Next.js development server if not running
    $port = 3000
    $serverRunning = $false
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 2 -UseBasicParsing
        $serverRunning = $true
        Write-ColorOutput "✅ Development server already running on port $port" $Green
    }
    catch {
        Write-ColorOutput "🌐 Starting development server..." $Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        
        # Wait for server to start
        $attempts = 0
        $maxAttempts = 30
        
        while ($attempts -lt $maxAttempts -and !$serverRunning) {
            Start-Sleep -Seconds 2
            $attempts++
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 2 -UseBasicParsing
                $serverRunning = $true
                Write-ColorOutput "✅ Development server started on port $port" $Green
                break
            }
            catch {
                Write-Host "." -NoNewline
            }
        }
        
        if (!$serverRunning) {
            Write-ColorOutput "❌ Failed to start development server" $Red
            exit 1
        }
    }
}

function Invoke-UnitTests {
    Write-ColorOutput "🧪 Running unit tests..." $Blue
    
    $jestArgs = @("--passWithNoTests")
    
    if ($Coverage) {
        $jestArgs += "--coverage"
    }
    
    if ($Watch) {
        $jestArgs += "--watch"
    }
    
    if ($CI) {
        $jestArgs += @("--ci", "--watchAll=false")
    }
    
    if ($Verbose) {
        $jestArgs += "--verbose"
    }
    
    $env:NODE_ENV = "test"
    
    try {
        & npx jest @jestArgs
        Write-ColorOutput "✅ Unit tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Unit tests failed" $Red
        throw
    }
}

function Invoke-E2ETests {
    Write-ColorOutput "🎯 Running E2E tests..." $Blue
    
    $playwrightArgs = @("test")
    
    if ($Browser -ne "all") {
        $playwrightArgs += "--project", $Browser
    }
    
    if ($Headed) {
        $playwrightArgs += "--headed"
    }
    
    if ($Workers -gt 0) {
        $playwrightArgs += "--workers", $Workers
    } elseif ($CI) {
        $playwrightArgs += "--workers", "1"
    }
    
    if ($Verbose) {
        $playwrightArgs += "--reporter", "list"
    }
    
    $env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ E2E tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ E2E tests failed" $Red
        throw
    }
}

function Invoke-VisualTests {
    Write-ColorOutput "📸 Running visual regression tests..." $Blue
    
    $playwrightArgs = @(
        "test",
        "--project", "visual-chromium",
        "--grep", "visual"
    )
    
    if ($CI) {
        $playwrightArgs += "--workers", "1"
    }
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ Visual tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Visual tests failed" $Red
        throw
    }
}

function Invoke-AccessibilityTests {
    Write-ColorOutput "♿ Running accessibility tests..." $Blue
    
    $playwrightArgs = @(
        "test",
        "--project", "accessibility",
        "--grep", "a11y"
    )
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ Accessibility tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Accessibility tests failed" $Red
        throw
    }
}

function Invoke-SecurityTests {
    Write-ColorOutput "🔒 Running security tests..." $Blue
    
    $playwrightArgs = @(
        "test",
        "__tests__/security/*.spec.js"
    )
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ Security tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Security tests failed" $Red
        throw
    }
}

function Invoke-PerformanceTests {
    Write-ColorOutput "⚡ Running performance tests..." $Blue
    
    $playwrightArgs = @(
        "test",
        "__tests__/performance/*.spec.js"
    )
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ Performance tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Performance tests failed" $Red
        throw
    }
}

function Invoke-ContractTests {
    Write-ColorOutput "📋 Running contract tests..." $Blue
    
    $playwrightArgs = @(
        "test",
        "__tests__/contract/*.spec.js"
    )
    
    try {
        & npx playwright @playwrightArgs
        Write-ColorOutput "✅ Contract tests completed" $Green
    }
    catch {
        Write-ColorOutput "❌ Contract tests failed" $Red
        throw
    }
}

function Generate-TestReport {
    Write-ColorOutput "📊 Generating test report..." $Blue
    
    $reportData = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        platform = "Windows"
        powershellVersion = $PSVersionTable.PSVersion.ToString()
        testSuite = $TestSuite
        browser = $Browser
    }
    
    $reportPath = "test-results\test-execution-report.json"
    $reportData | ConvertTo-Json -Depth 3 | Set-Content $reportPath
    
    Write-ColorOutput "✅ Test report generated: $reportPath" $Green
    
    # Open HTML report if available
    $htmlReport = "playwright-report\index.html"
    if (Test-Path $htmlReport) {
        Write-ColorOutput "🌐 Opening HTML report..." $Blue
        Start-Process $htmlReport
    }
}

function Show-Usage {
    Write-Host @"
LeadLove Maps Test Runner - Windows PowerShell

Usage: .\run-tests-windows.ps1 [OPTIONS]

Test Suites:
  -TestSuite <suite>    Test suite to run (all, unit, e2e, visual, a11y, security, performance, contract)
  
Options:
  -Coverage             Generate code coverage report
  -Watch                Watch mode for unit tests
  -Verbose              Verbose output
  -CI                   CI mode (non-interactive, single worker)
  -Browser <browser>    Browser for E2E tests (chromium, firefox, webkit, all)
  -Headed               Run E2E tests in headed mode
  -Workers <number>     Number of worker processes

Examples:
  .\run-tests-windows.ps1                          # Run all tests
  .\run-tests-windows.ps1 -TestSuite unit -Coverage # Unit tests with coverage
  .\run-tests-windows.ps1 -TestSuite e2e -Browser firefox -Headed # E2E tests in Firefox
  .\run-tests-windows.ps1 -CI                      # CI mode
"@
}

# Main execution
try {
    Write-ColorOutput "🚀 LeadLove Maps Test Automation Framework" $Blue
    Write-ColorOutput "Platform: Windows PowerShell" $Blue
    Write-ColorOutput "Test Suite: $TestSuite" $Blue
    Write-Host ""
    
    if ($TestSuite -eq "help") {
        Show-Usage
        exit 0
    }
    
    Test-Prerequisites
    Start-TestEnvironment
    
    $testsPassed = $true
    
    switch ($TestSuite.ToLower()) {
        "unit" {
            Invoke-UnitTests
        }
        "e2e" {
            Invoke-E2ETests
        }
        "visual" {
            Invoke-VisualTests
        }
        "a11y" {
            Invoke-AccessibilityTests
        }
        "accessibility" {
            Invoke-AccessibilityTests
        }
        "security" {
            Invoke-SecurityTests
        }
        "performance" {
            Invoke-PerformanceTests
        }
        "contract" {
            Invoke-ContractTests
        }
        "all" {
            Write-ColorOutput "🧪 Running complete test suite..." $Blue
            
            try { Invoke-UnitTests } catch { $testsPassed = $false }
            try { Invoke-E2ETests } catch { $testsPassed = $false }
            try { Invoke-VisualTests } catch { $testsPassed = $false }
            try { Invoke-AccessibilityTests } catch { $testsPassed = $false }
            try { Invoke-SecurityTests } catch { $testsPassed = $false }
            try { Invoke-PerformanceTests } catch { $testsPassed = $false }
            try { Invoke-ContractTests } catch { $testsPassed = $false }
        }
        default {
            Write-ColorOutput "❌ Unknown test suite: $TestSuite" $Red
            Show-Usage
            exit 1
        }
    }
    
    Generate-TestReport
    
    if ($testsPassed) {
        Write-ColorOutput "🎉 All tests completed successfully!" $Green
        exit 0
    } else {
        Write-ColorOutput "❌ Some tests failed. Check the reports for details." $Red
        exit 1
    }
}
catch {
    Write-ColorOutput "❌ Test execution failed: $($_.Exception.Message)" $Red
    exit 1
}
finally {
    # Cleanup processes if needed
    $env:NODE_ENV = $null
    $env:PLAYWRIGHT_BASE_URL = $null
}