import {
    logMemoryUsage,
    monitorAsyncOperation,
    getMemoryStatus,
  } from "@alexvcasillas/memory-monitor";
  
  function memoryLogger(message, data = {}) {
    console.log(`[MEMORY] ${message}`, data);
  }
  
  export function logBenchmarkMemory(operation, additionalData = {}) {
    logMemoryUsage({
      operation,
      additionalData,
      log: memoryLogger,
      warningThreshold: 128 * 1024 * 1024,
      criticalThreshold: 256 * 1024 * 1024,
    });
  }
  
  export async function monitorBenchmarkOperation(operation, fn, additionalData = {}) {
    return monitorAsyncOperation({
      operation,
      fn,
      log: (message, data = {}) => {
        memoryLogger(message, { ...data, ...additionalData });
      },
      warningThreshold: 128 * 1024 * 1024,
      criticalThreshold: 256 * 1024 * 1024,
    });
  }
  
  export function getBenchmarkMemoryStatus() {
    return getMemoryStatus({
      warningThreshold: 128 * 1024 * 1024,
      criticalThreshold: 256 * 1024 * 1024,
    });
  }