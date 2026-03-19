# Fix Terminal Freeze — Design Document

**Date:** 2026-03-19
**Status:** Implemented
**Author:** Claude

## Problem

The Sage Team terminal dashboard would freeze/hang during extended operation. Users reported the application becoming unresponsive after several minutes of running.

## Root Cause Analysis

1. **Double rendering**: Dashboard rendered on its own 500ms interval AND on every orchestrator tick event (3s), causing `screen.render()` to be called concurrently
2. **Memory leaks**: `activeSkills` array grew unbounded as completed skills were never pruned. Agent `messages` array also grew without limit
3. **No error isolation**: A single agent error in the tick loop would propagate and potentially break the entire simulation
4. **Expensive rendering**: Office map used O(n) linear search per cell to find agents, plus string concatenation instead of array joins

## Solution

### Rendering
- Removed orchestrator tick listener from dashboard (dashboard has its own render loop)
- Added re-entrancy guard (`this.rendering` flag) and 400ms throttle
- Wrapped render in try/catch to prevent blessed crashes

### Memory
- Prune `activeSkills` to keep last 20 completed entries
- Bound `messages` array at 200 per agent
- Prune completed tasks at 200 total (keep last 50 done)

### Error Handling
- try/catch around each individual agent in tick loop
- Outer try/catch around entire tick body

### Performance
- Agent position lookup via Map instead of array.find() per cell
- Array.join() instead of string concatenation for office map rendering

## Impact

- Eliminates terminal freeze on extended runs
- Reduces memory growth from O(t) to O(1) for long sessions
- Individual agent errors no longer crash the simulation
