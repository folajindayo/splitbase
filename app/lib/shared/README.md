# Shared Utilities

This directory contains shared utility functions and helpers used across the application.

## Structure

- `async.ts` - Async/await utilities (retry, timeout, parallel, etc.)
- `math.ts` - Mathematical operations
- `object.ts` - Object manipulation utilities
- `url.ts` - URL parsing and building
- `constants.ts` - Application constants
- `patterns.ts` - Common regex patterns
- `types.ts` - Shared TypeScript type definitions
- `env.ts` - Environment configuration
- `logger.ts` - Logging utility
- `error.ts` - Error handling and custom error classes
- `helpers.ts` - General helper functions
- `performance.ts` - Performance measurement utilities
- `invariant.ts` - Assertion and invariant utilities
- `config.ts` - Application configuration
- `index.ts` - Barrel export for all utilities

## Usage

```typescript
import { retry, timeout } from '@/lib/shared/async';
import { clamp, round } from '@/lib/shared/math';
import { isValidUrl } from '@/lib/shared/url';
import { logger } from '@/lib/shared/logger';
```

## Guidelines

- Keep functions pure and side-effect free when possible
- Add comprehensive JSDoc comments
- Write unit tests for all utilities
- Follow consistent naming conventions
- Ensure TypeScript strict mode compatibility

