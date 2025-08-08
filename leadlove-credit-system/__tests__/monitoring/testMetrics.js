/**
 * Test Metrics Collection and Monitoring
 * Collects, analyzes, and reports test execution metrics
 */

const fs = require('fs').promises;
const path = require('path');

class TestMetricsCollector {
  constructor() {
    this.metrics = {
      testRuns: [],
      coverage: [],
      performance: [],
      reliability: [],
      trends: []
    };
    this.thresholds = {
      coverage: {
        statements: 70,
        branches: 65,
        functions: 80,
        lines: 70
      },
      performance: {
        unitTestMaxTime: 5000, // 5 seconds
        e2eTestMaxTime: 30000,  // 30 seconds
        apiResponseTime: 500,   // 500ms
        pageLoadTime: 3000      // 3 seconds
      },
      reliability: {
        maxFlakiness: 0.02,     // 2% flaky test rate
        minSuccessRate: 0.95    // 95% success rate
      }
    };
  }

  /**
   * Record test run metrics
   */
  async recordTestRun(testResults) {
    const testRun = {
      id: this.generateRunId(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      platform: process.platform,
      nodeVersion: process.version,
      ...testResults
    };

    this.metrics.testRuns.push(testRun);
    
    await this.saveMetrics();
    return testRun;
  }

  /**
   * Record coverage metrics
   */
  async recordCoverage(coverageData) {
    const coverage = {
      timestamp: new Date().toISOString(),
      statements: coverageData.statements || { pct: 0, covered: 0, total: 0 },
      branches: coverageData.branches || { pct: 0, covered: 0, total: 0 },
      functions: coverageData.functions || { pct: 0, covered: 0, total: 0 },
      lines: coverageData.lines || { pct: 0, covered: 0, total: 0 },
      threshold_violations: this.checkCoverageThresholds(coverageData)
    };

    this.metrics.coverage.push(coverage);
    
    await this.saveMetrics();
    return coverage;
  }

  /**
   * Record performance metrics
   */
  async recordPerformance(performanceData) {
    const performance = {
      timestamp: new Date().toISOString(),
      test_suite: performanceData.testSuite || 'unknown',
      response_times: performanceData.responseTimes || [],
      memory_usage: performanceData.memoryUsage || 0,
      cpu_usage: performanceData.cpuUsage || 0,
      throughput: performanceData.throughput || 0,
      error_rate: performanceData.errorRate || 0,
      threshold_violations: this.checkPerformanceThresholds(performanceData)
    };

    this.metrics.performance.push(performance);
    
    await this.saveMetrics();
    return performance;
  }

  /**
   * Calculate test reliability metrics
   */
  async calculateReliability() {
    const recentRuns = this.getRecentTestRuns(30); // Last 30 runs
    
    if (recentRuns.length === 0) {
      return null;
    }

    // Calculate flakiness rate (tests that pass/fail inconsistently)
    const testOutcomes = {};
    recentRuns.forEach(run => {
      run.testResults?.forEach(test => {
        if (!testOutcomes[test.name]) {
          testOutcomes[test.name] = { passes: 0, failures: 0 };
        }
        if (test.status === 'passed') {
          testOutcomes[test.name].passes++;
        } else {
          testOutcomes[test.name].failures++;
        }
      });
    });

    const flakyTests = Object.entries(testOutcomes).filter(([name, outcomes]) => {
      return outcomes.passes > 0 && outcomes.failures > 0;
    });

    const totalTests = Object.keys(testOutcomes).length;
    const flakinessRate = totalTests > 0 ? flakyTests.length / totalTests : 0;

    // Calculate success rate
    const totalRuns = recentRuns.length;
    const successfulRuns = recentRuns.filter(run => run.success).length;
    const successRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;

    // Calculate average execution time
    const executionTimes = recentRuns.map(run => run.duration || 0);
    const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;

    const reliability = {
      timestamp: new Date().toISOString(),
      flakiness_rate: flakinessRate,
      success_rate: successRate,
      avg_execution_time: avgExecutionTime,
      flaky_tests: flakyTests.map(([name, outcomes]) => ({
        name,
        passes: outcomes.passes,
        failures: outcomes.failures,
        flakiness: outcomes.failures / (outcomes.passes + outcomes.failures)
      })),
      threshold_violations: this.checkReliabilityThresholds({
        flakinessRate,
        successRate
      })
    };

    this.metrics.reliability.push(reliability);
    
    await this.saveMetrics();
    return reliability;
  }

  /**
   * Generate trend analysis
   */
  async generateTrendAnalysis() {
    const trends = {
      timestamp: new Date().toISOString(),
      coverage_trend: this.analyzeCoverageTrend(),
      performance_trend: this.analyzePerformanceTrend(),
      reliability_trend: this.analyzeReliabilityTrend(),
      test_count_trend: this.analyzeTestCountTrend()
    };

    this.metrics.trends.push(trends);
    
    await this.saveMetrics();
    return trends;
  }

  /**
   * Check coverage against thresholds
   */
  checkCoverageThresholds(coverageData) {
    const violations = [];
    const thresholds = this.thresholds.coverage;

    if (coverageData.statements?.pct < thresholds.statements) {
      violations.push({
        type: 'statements',
        actual: coverageData.statements.pct,
        threshold: thresholds.statements
      });
    }

    if (coverageData.branches?.pct < thresholds.branches) {
      violations.push({
        type: 'branches',
        actual: coverageData.branches.pct,
        threshold: thresholds.branches
      });
    }

    if (coverageData.functions?.pct < thresholds.functions) {
      violations.push({
        type: 'functions',
        actual: coverageData.functions.pct,
        threshold: thresholds.functions
      });
    }

    if (coverageData.lines?.pct < thresholds.lines) {
      violations.push({
        type: 'lines',
        actual: coverageData.lines.pct,
        threshold: thresholds.lines
      });
    }

    return violations;
  }

  /**
   * Check performance against thresholds
   */
  checkPerformanceThresholds(performanceData) {
    const violations = [];
    const thresholds = this.thresholds.performance;

    if (performanceData.responseTimes?.length > 0) {
      const avgResponseTime = performanceData.responseTimes.reduce((sum, time) => sum + time, 0) / performanceData.responseTimes.length;
      
      if (avgResponseTime > thresholds.apiResponseTime) {
        violations.push({
          type: 'api_response_time',
          actual: avgResponseTime,
          threshold: thresholds.apiResponseTime
        });
      }
    }

    if (performanceData.pageLoadTime && performanceData.pageLoadTime > thresholds.pageLoadTime) {
      violations.push({
        type: 'page_load_time',
        actual: performanceData.pageLoadTime,
        threshold: thresholds.pageLoadTime
      });
    }

    return violations;
  }

  /**
   * Check reliability against thresholds
   */
  checkReliabilityThresholds(reliabilityData) {
    const violations = [];
    const thresholds = this.thresholds.reliability;

    if (reliabilityData.flakinessRate > thresholds.maxFlakiness) {
      violations.push({
        type: 'flakiness_rate',
        actual: reliabilityData.flakinessRate,
        threshold: thresholds.maxFlakiness
      });
    }

    if (reliabilityData.successRate < thresholds.minSuccessRate) {
      violations.push({
        type: 'success_rate',
        actual: reliabilityData.successRate,
        threshold: thresholds.minSuccessRate
      });
    }

    return violations;
  }

  /**
   * Analyze coverage trends
   */
  analyzeCoverageTrend() {
    const recentCoverage = this.metrics.coverage.slice(-10); // Last 10 coverage reports
    
    if (recentCoverage.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const latest = recentCoverage[recentCoverage.length - 1];
    const previous = recentCoverage[0];

    const change = latest.statements.pct - previous.statements.pct;
    
    let trend = 'stable';
    if (change > 2) trend = 'improving';
    else if (change < -2) trend = 'declining';

    return {
      trend,
      change,
      current: latest.statements.pct,
      previous: previous.statements.pct
    };
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrend() {
    const recentPerformance = this.metrics.performance.slice(-10);
    
    if (recentPerformance.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    // Calculate average response times
    const calculateAvgResponseTime = (perfData) => {
      if (!perfData.response_times || perfData.response_times.length === 0) return 0;
      return perfData.response_times.reduce((sum, time) => sum + time, 0) / perfData.response_times.length;
    };

    const latest = calculateAvgResponseTime(recentPerformance[recentPerformance.length - 1]);
    const previous = calculateAvgResponseTime(recentPerformance[0]);

    const change = latest - previous;
    
    let trend = 'stable';
    if (change < -50) trend = 'improving'; // Response times getting faster
    else if (change > 50) trend = 'declining'; // Response times getting slower

    return {
      trend,
      change,
      current: latest,
      previous: previous
    };
  }

  /**
   * Analyze reliability trends
   */
  analyzeReliabilityTrend() {
    const recentReliability = this.metrics.reliability.slice(-5);
    
    if (recentReliability.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const latest = recentReliability[recentReliability.length - 1];
    const previous = recentReliability[0];

    const successRateChange = latest.success_rate - previous.success_rate;
    const flakinessChange = latest.flakiness_rate - previous.flakiness_rate;

    let trend = 'stable';
    if (successRateChange > 0.05 && flakinessChange < -0.01) trend = 'improving';
    else if (successRateChange < -0.05 || flakinessChange > 0.01) trend = 'declining';

    return {
      trend,
      success_rate_change: successRateChange,
      flakiness_change: flakinessChange,
      current_success_rate: latest.success_rate,
      current_flakiness: latest.flakiness_rate
    };
  }

  /**
   * Analyze test count trends
   */
  analyzeTestCountTrend() {
    const recentRuns = this.getRecentTestRuns(10);
    
    if (recentRuns.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const latest = recentRuns[recentRuns.length - 1].totalTests || 0;
    const previous = recentRuns[0].totalTests || 0;

    const change = latest - previous;
    
    let trend = 'stable';
    if (change > 5) trend = 'growing';
    else if (change < -5) trend = 'shrinking';

    return {
      trend,
      change,
      current: latest,
      previous: previous
    };
  }

  /**
   * Generate comprehensive dashboard report
   */
  async generateDashboard() {
    const latestCoverage = this.metrics.coverage[this.metrics.coverage.length - 1];
    const latestPerformance = this.metrics.performance[this.metrics.performance.length - 1];
    const latestReliability = this.metrics.reliability[this.metrics.reliability.length - 1];
    const trends = await this.generateTrendAnalysis();

    const dashboard = {
      timestamp: new Date().toISOString(),
      summary: {
        total_test_runs: this.metrics.testRuns.length,
        last_run: this.metrics.testRuns[this.metrics.testRuns.length - 1]?.timestamp,
        overall_health: this.calculateOverallHealth()
      },
      current_metrics: {
        coverage: latestCoverage,
        performance: latestPerformance,
        reliability: latestReliability
      },
      trends: trends,
      alerts: this.generateAlerts(),
      recommendations: this.generateRecommendations()
    };

    await this.saveDashboard(dashboard);
    return dashboard;
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth() {
    const weights = {
      coverage: 0.3,
      performance: 0.3,
      reliability: 0.4
    };

    let healthScore = 100;
    let factors = [];

    // Coverage health
    const latestCoverage = this.metrics.coverage[this.metrics.coverage.length - 1];
    if (latestCoverage) {
      const coverageScore = latestCoverage.statements.pct;
      if (coverageScore < this.thresholds.coverage.statements) {
        const penalty = (this.thresholds.coverage.statements - coverageScore) * weights.coverage;
        healthScore -= penalty;
        factors.push(`Coverage below threshold (-${penalty.toFixed(1)})`);
      }
    }

    // Performance health
    const latestPerformance = this.metrics.performance[this.metrics.performance.length - 1];
    if (latestPerformance) {
      const avgResponseTime = latestPerformance.response_times?.length > 0 
        ? latestPerformance.response_times.reduce((sum, time) => sum + time, 0) / latestPerformance.response_times.length 
        : 0;
        
      if (avgResponseTime > this.thresholds.performance.apiResponseTime) {
        const penalty = Math.min(20, (avgResponseTime - this.thresholds.performance.apiResponseTime) / 100) * weights.performance;
        healthScore -= penalty;
        factors.push(`Slow response times (-${penalty.toFixed(1)})`);
      }
    }

    // Reliability health
    const latestReliability = this.metrics.reliability[this.metrics.reliability.length - 1];
    if (latestReliability) {
      if (latestReliability.success_rate < this.thresholds.reliability.minSuccessRate) {
        const penalty = (this.thresholds.reliability.minSuccessRate - latestReliability.success_rate) * 100 * weights.reliability;
        healthScore -= penalty;
        factors.push(`Low success rate (-${penalty.toFixed(1)})`);
      }

      if (latestReliability.flakiness_rate > this.thresholds.reliability.maxFlakiness) {
        const penalty = (latestReliability.flakiness_rate - this.thresholds.reliability.maxFlakiness) * 1000 * weights.reliability;
        healthScore -= penalty;
        factors.push(`High flakiness (-${penalty.toFixed(1)})`);
      }
    }

    return {
      score: Math.max(0, Math.round(healthScore)),
      status: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : healthScore >= 50 ? 'fair' : 'poor',
      factors
    };
  }

  /**
   * Generate alerts for threshold violations
   */
  generateAlerts() {
    const alerts = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check recent coverage violations
    const recentCoverage = this.metrics.coverage.filter(c => new Date(c.timestamp) > oneDayAgo);
    recentCoverage.forEach(coverage => {
      coverage.threshold_violations.forEach(violation => {
        alerts.push({
          type: 'coverage',
          severity: 'warning',
          message: `${violation.type} coverage (${violation.actual}%) below threshold (${violation.threshold}%)`,
          timestamp: coverage.timestamp
        });
      });
    });

    // Check recent performance violations
    const recentPerformance = this.metrics.performance.filter(p => new Date(p.timestamp) > oneDayAgo);
    recentPerformance.forEach(performance => {
      performance.threshold_violations.forEach(violation => {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `${violation.type} (${violation.actual}ms) exceeds threshold (${violation.threshold}ms)`,
          timestamp: performance.timestamp
        });
      });
    });

    // Check recent reliability violations
    const recentReliability = this.metrics.reliability.filter(r => new Date(r.timestamp) > oneDayAgo);
    recentReliability.forEach(reliability => {
      reliability.threshold_violations.forEach(violation => {
        const severity = violation.type === 'success_rate' ? 'critical' : 'warning';
        alerts.push({
          type: 'reliability',
          severity,
          message: `${violation.type} (${(violation.actual * 100).toFixed(1)}%) violates threshold (${(violation.threshold * 100).toFixed(1)}%)`,
          timestamp: reliability.timestamp
        });
      });
    });

    return alerts;
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const trends = this.metrics.trends[this.metrics.trends.length - 1];

    if (trends?.coverage_trend.trend === 'declining') {
      recommendations.push({
        category: 'coverage',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: 'Coverage has been declining. Add tests for uncovered code paths.',
        actions: [
          'Run coverage report to identify untested files',
          'Add unit tests for business logic',
          'Add integration tests for API endpoints'
        ]
      });
    }

    if (trends?.performance_trend.trend === 'declining') {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Test Performance',
        description: 'Test execution time is increasing. Consider optimization.',
        actions: [
          'Profile slow tests and optimize',
          'Run tests in parallel where possible',
          'Mock external dependencies to reduce wait times'
        ]
      });
    }

    if (trends?.reliability_trend.trend === 'declining') {
      recommendations.push({
        category: 'reliability',
        priority: 'critical',
        title: 'Fix Flaky Tests',
        description: 'Test reliability is decreasing. Address flaky tests immediately.',
        actions: [
          'Identify and fix timing-dependent tests',
          'Add proper waits and assertions',
          'Review test data setup and cleanup'
        ]
      });
    }

    const latestReliability = this.metrics.reliability[this.metrics.reliability.length - 1];
    if (latestReliability?.flaky_tests.length > 0) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: 'Address Specific Flaky Tests',
        description: `${latestReliability.flaky_tests.length} tests showing flaky behavior`,
        actions: latestReliability.flaky_tests.map(test => 
          `Fix flaky test: ${test.name} (${(test.flakiness * 100).toFixed(1)}% flaky)`
        )
      });
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRecentTestRuns(count) {
    return this.metrics.testRuns.slice(-count);
  }

  async saveMetrics() {
    const metricsDir = path.join(process.cwd(), 'test-results', 'metrics');
    await fs.mkdir(metricsDir, { recursive: true });
    
    const metricsFile = path.join(metricsDir, 'test-metrics.json');
    await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
  }

  async saveDashboard(dashboard) {
    const reportDir = path.join(process.cwd(), 'test-results', 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const dashboardFile = path.join(reportDir, 'dashboard.json');
    await fs.writeFile(dashboardFile, JSON.stringify(dashboard, null, 2));
    
    // Also save HTML dashboard
    const htmlReport = this.generateHTMLDashboard(dashboard);
    const htmlFile = path.join(reportDir, 'dashboard.html');
    await fs.writeFile(htmlFile, htmlReport);
  }

  async loadMetrics() {
    try {
      const metricsFile = path.join(process.cwd(), 'test-results', 'metrics', 'test-metrics.json');
      const data = await fs.readFile(metricsFile, 'utf8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty metrics
      this.metrics = {
        testRuns: [],
        coverage: [],
        performance: [],
        reliability: [],
        trends: []
      };
    }
  }

  generateHTMLDashboard(dashboard) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LeadLove Maps Test Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .status-excellent { color: #059669; }
        .status-good { color: #0891b2; }
        .status-fair { color: #d97706; }
        .status-poor { color: #dc2626; }
        .alert-critical { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 5px 0; }
        .alert-warning { background: #fffbeb; border-left: 4px solid #d97706; padding: 10px; margin: 5px 0; }
        .trend-improving { color: #059669; }
        .trend-declining { color: #dc2626; }
        .trend-stable { color: #6b7280; }
        .recommendations { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LeadLove Maps Test Dashboard</h1>
            <p>Generated: ${dashboard.timestamp}</p>
            <div class="metric-value status-${dashboard.summary.overall_health.status}">
                Health Score: ${dashboard.summary.overall_health.score}/100 (${dashboard.summary.overall_health.status})
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Test Coverage</h3>
                ${dashboard.current_metrics.coverage ? `
                    <div class="metric-value">${dashboard.current_metrics.coverage.statements.pct}%</div>
                    <p>Statements: ${dashboard.current_metrics.coverage.statements.covered}/${dashboard.current_metrics.coverage.statements.total}</p>
                    <p>Branches: ${dashboard.current_metrics.coverage.branches.pct}%</p>
                    <p>Functions: ${dashboard.current_metrics.coverage.functions.pct}%</p>
                ` : '<p>No coverage data available</p>'}
            </div>
            
            <div class="card">
                <h3>Test Reliability</h3>
                ${dashboard.current_metrics.reliability ? `
                    <div class="metric-value">${(dashboard.current_metrics.reliability.success_rate * 100).toFixed(1)}%</div>
                    <p>Success Rate</p>
                    <p>Flakiness: ${(dashboard.current_metrics.reliability.flakiness_rate * 100).toFixed(2)}%</p>
                ` : '<p>No reliability data available</p>'}
            </div>
            
            <div class="card">
                <h3>Trends</h3>
                ${dashboard.trends ? `
                    <p>Coverage: <span class="trend-${dashboard.trends.coverage_trend.trend}">${dashboard.trends.coverage_trend.trend}</span></p>
                    <p>Performance: <span class="trend-${dashboard.trends.performance_trend.trend}">${dashboard.trends.performance_trend.trend}</span></p>
                    <p>Reliability: <span class="trend-${dashboard.trends.reliability_trend.trend}">${dashboard.trends.reliability_trend.trend}</span></p>
                ` : '<p>No trend data available</p>'}
            </div>
        </div>
        
        <div class="card">
            <h3>Active Alerts</h3>
            ${dashboard.alerts.map(alert => `
                <div class="alert-${alert.severity}">
                    <strong>${alert.type.toUpperCase()}</strong>: ${alert.message}
                </div>
            `).join('')}
            ${dashboard.alerts.length === 0 ? '<p>No active alerts</p>' : ''}
        </div>
        
        <div class="card">
            <h3>Recommendations</h3>
            ${dashboard.recommendations.map(rec => `
                <div class="recommendations">
                    <h4>${rec.title} (${rec.priority} priority)</h4>
                    <p>${rec.description}</p>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
            ${dashboard.recommendations.length === 0 ? '<p>No recommendations at this time</p>' : ''}
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = TestMetricsCollector;