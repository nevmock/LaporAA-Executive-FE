'use client';

import React, { useState, useEffect } from 'react';
import { socketTester } from '../../services/socketTestingService';
import { performanceMonitor } from '../../services/performanceMonitoringService';
import { eventOptimizer } from '../../services/eventOptimizationService';

interface TestReport {
  passed: number;
  failed: number;
  duration: number;
  details: string;
}

/**
 * Socket Testing Dashboard Component
 * Provides UI for running socket tests and viewing performance metrics
 */
const SocketTestDashboard: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [performanceReport, setPerformanceReport] = useState<string>('');
  const [optimizationStats, setOptimizationStats] = useState<any>(null);

  // Update reports periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceReport(performanceMonitor.getPerformanceReport());
      setOptimizationStats(eventOptimizer.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const runAllTests = async () => {
    setIsRunningTests(true);
    const startTime = Date.now();

    try {
      const results = await socketTester.runAllTests();
      const endTime = Date.now();

      setTestReport({
        passed: results.passed,
        failed: results.failed,
        duration: endTime - startTime,
        details: socketTester.generateReport()
      });
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runPerformanceBenchmark = async () => {
    setIsRunningTests(true);
    
    try {
      const results = await socketTester.runPerformanceBenchmark({
        connections: 10,
        duration: 3000,
        eventsPerSecond: 5,
        eventTypes: ['testEvent', 'dashboardUpdate', 'userActivity']
      });
      
      console.log('Benchmark results:', results);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🧪 Socket.IO Testing Dashboard
        </h2>
        <p className="text-gray-600">
          Test and monitor Socket.IO performance and optimization
        </p>
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunningTests ? '🔄 Running Tests...' : '🧪 Run All Tests'}
          </button>
          
          <button
            onClick={runPerformanceBenchmark}
            disabled={isRunningTests}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isRunningTests ? '🔄 Running Benchmark...' : '🚀 Performance Benchmark'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testReport && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testReport.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{testReport.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testReport.duration}ms</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              View Detailed Report
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {testReport.details}
            </pre>
          </details>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📊 Performance Metrics</h3>
          <pre className="text-xs bg-white p-3 rounded overflow-auto">
            {performanceReport || 'No data available'}
          </pre>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">⚡ Optimization Stats</h3>
          {optimizationStats ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Filters:</span>
                <span className="font-mono">{optimizationStats.activeFilters}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Batches:</span>
                <span className="font-mono">{optimizationStats.activeBatches}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Events:</span>
                <span className="font-mono">{optimizationStats.totalPendingEvents}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimization Ratio:</span>
                <span className="font-mono">
                  {(optimizationStats.optimizationRatio * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No optimization data available</div>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📡 Connection Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-green-500 text-2xl">✅</div>
            <div className="text-sm">Connected</div>
          </div>
          <div>
            <div className="text-blue-500 text-2xl">⚡</div>
            <div className="text-sm">Optimized</div>
          </div>
          <div>
            <div className="text-purple-500 text-2xl">📦</div>
            <div className="text-sm">Batching</div>
          </div>
          <div>
            <div className="text-orange-500 text-2xl">🔍</div>
            <div className="text-sm">Monitoring</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Socket.IO Global Architecture - Event Filtering & Optimization
        <br />
        Generated: July 4, 2025
      </div>
    </div>
  );
};

export default SocketTestDashboard;
