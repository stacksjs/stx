# STX Optimization Comparison

## Performance Improvements

| Operation | Original | Optimized | Improvement |
|-----------|----------|-----------|-------------|
| create rows | 48.34ms | 30.81ms | ✅ 36.3% faster (1.57x) |
| replace all rows | 48.05ms | 29.72ms | ✅ 38.2% faster (1.62x) |
| partial update | 51.54ms | 0.36ms | ✅ 99.3% faster (144.54x) |
| select row | 0.72ms | 0.77ms | ❌ 6.9% slower |
| swap rows | 49.53ms | 0.03ms | ✅ 99.9% faster (1478.70x) |
| remove row | 0.01ms | 0.01ms | ❌ 20.3% slower |
| create many rows | 593.86ms | 399.08ms | ✅ 32.8% faster (1.49x) |
| append rows to large table | 591.92ms | 38.82ms | ✅ 93.4% faster (15.25x) |
| clear rows | 0.01ms | 0.01ms | ✅ 7.7% faster (1.08x) |

**Geometric Mean**

- Original: 8.24ms
- Optimized: 1.37ms
- Overall improvement: 83.4%

## Optimized STX vs Other Frameworks

| Operation | STX Optimized | VanillaJS | Vue Vapor | Svelte 5 | Solid | React 19 |
|-----------|---------------|-----------|-----------|----------|-------|----------|
| create rows | 30.8 | **23.2** | 24.4 | 24.2 | 24.0 | 28.6 |
| replace all rows | 29.7 | **25.8** | 28.0 | 28.3 | 27.8 | 33.3 |
| partial update | **0.4** | 10.1 | 11.3 | 11.0 | 10.9 | 15.1 |
| select row | **0.8** | 2.4 | 2.5 | 3.3 | 2.5 | 4.5 |
| swap rows | **0.0** | 12.3 | 13.4 | 13.7 | 14.0 | 105.3 |
| remove row | **0.0** | 10.3 | 10.6 | 10.6 | 10.7 | 11.9 |
| create many rows | 399.1 | **239.0** | 261.6 | 257.0 | 258.5 | 390.6 |
| append rows to large table | 38.8 | **27.4** | 28.8 | 28.2 | 29.2 | 33.7 |
| clear rows | **0.0** | 9.1 | 9.2 | 10.3 | 11.8 | 18.0 |
