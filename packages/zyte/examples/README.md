# Zyte Examples

This directory contains example applications demonstrating various features of Zyte.

## Examples

### 1. lifecycle-example.zig
Demonstrates application lifecycle hooks:
- beforeStart, onStart, afterStart
- onStop, beforeStop, afterStop
- Lifecycle phase tracking

### 2. memory-example.zig
Shows memory management helpers:
- Arena allocators for bulk allocations
- Tracking allocator for memory statistics
- Temporary stack-based allocators

### 3. events-example.zig
Event system usage:
- Registering event listeners
- Emitting events
- Custom events
- Once-only listeners

## Running Examples

```bash
# Build all examples
zig build

# Run a specific example (when build configured)
./zig-out/bin/lifecycle-example
./zig-out/bin/memory-example
./zig-out/bin/events-example
```
