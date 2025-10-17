
# Comparison with Other Frameworks

| Benchmark | STX | VanillaJS | Vue Vapor | Svelte 5 | Solid | React 19 |
|-----------|-----|-----------|-----------|----------|-------|----------|
| create rows | **21.2** | 23.2 | 24.4 | 24.2 | 24 | 28.6 |
| replace all rows | **24.6** | 25.8 | 28 | 28.3 | 27.8 | 33.3 |
| partial update | **0.2** | 10.1 | 11.3 | 11 | 10.9 | 15.1 |
| select row | **0.0** | 2.4 | 2.5 | 3.3 | 2.5 | 4.5 |
| swap rows | **0.1** | 12.3 | 13.4 | 13.7 | 14 | 105.3 |
| remove row | **0.0** | 10.3 | 10.6 | 10.6 | 10.7 | 11.9 |
| create many rows | **314.5** | 239 | 261.6 | 257 | 258.5 | 390.6 |
| append rows to large table | **19.1** | 27.4 | 28.8 | 28.2 | 29.2 | 33.7 |
| clear rows | **0.0** | 9.1 | 9.2 | 10.3 | 11.8 | 18 |

**Weighted Geometric Mean**

- STX: **0.75**
- VanillaJS: 1.02
- Vue Vapor: 1.09
- Svelte 5: 1.1
- Solid: 1.11
- React 19: 1.52
