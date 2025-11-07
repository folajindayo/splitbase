# Contributing to SplitBase

Thank you for your interest in contributing to SplitBase! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Security](#security)
8. [Pull Request Process](#pull-request-process)
9. [Reporting Bugs](#reporting-bugs)
10. [Feature Requests](#feature-requests)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling or insulting comments
- Publishing others' private information
- Any conduct inappropriate in a professional setting

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Git
- Supabase account
- Reown (WalletConnect) project ID
- Basic understanding of:
  - Next.js 14
  - TypeScript
  - Ethereum/Web3
  - PostgreSQL

### First Time Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/splitbase.git
   cd splitbase
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/splitbase.git
   ```

3. **Install dependencies**
   ```bash
   cd app
   npm install
   ```

4. **Set up environment**
   ```bash
   # Run setup script
   ../scripts/setup-custody.sh
   
   # Or manually copy and edit
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. **Run database migrations**
   - Execute all SQL files in Supabase SQL Editor
   - Run migration validator: `node scripts/validate-migrations.js`

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## Development Setup

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

---

## Making Changes

### Before You Start

1. Check existing issues and PRs
2. Create an issue for significant changes
3. Discuss major changes before implementing
4. Keep changes focused and atomic

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests if applicable

3. **Test your changes**
   ```bash
   npm run lint
   npm run type-check
   npm run test # if tests exist
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

```typescript
// Good
interface EscrowData {
  id: string;
  amount: number;
  buyer: string;
}

// Bad
interface Data {
  a: any;
  b: any;
}
```

### File Structure

- Keep files under 500 lines
- One component per file
- Co-locate related files
- Use meaningful file names

```
app/
├── components/
│   └── FeatureName/
│       ├── FeatureName.tsx
│       ├── FeatureName.test.tsx
│       └── index.ts
├── lib/
│   └── featureUtils.ts
└── api/
    └── feature/
        └── route.ts
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case for non-components (`user-utils.ts`)

### Comments

```typescript
/**
 * Brief description of what the function does
 * 
 * @param param1 - Description of parameter
 * @returns Description of return value
 */
export function myFunction(param1: string): number {
  // Implementation
}
```

### NativeWind/Tailwind

- Always use NativeWind classes
- Never use inline styles or StyleSheet
- Keep className strings organized

```typescript
// Good
<div className="bg-white rounded-lg border border-gray-200 p-6">

// Bad
<div style={{ backgroundColor: 'white' }}>
```

---

## Testing

### Test Utilities

Use the test utilities for escrow testing:

```typescript
import { createTestEscrow, cleanupAllTestEscrows } from "@/lib/testUtils";

// Create test escrow
const escrow = await createTestEscrow({
  total_amount: 1.0,
});

// Clean up after testing
await cleanupAllTestEscrows();
```

### Manual Testing

1. Test on Base Sepolia testnet first
2. Test all user flows
3. Test error cases
4. Verify mobile responsiveness

---

## Security

### Security-First Mindset

- **Never** commit secrets or private keys
- **Never** log sensitive data
- **Always** validate user input
- **Always** use parameterized queries
- **Always** apply rate limiting

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security contact (add email)
2. Include detailed description
3. Provide steps to reproduce
4. Allow 90 days for fix before disclosure

### Security Checklist

Before submitting:
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled
- [ ] Rate limiting applied
- [ ] Audit logging added

---

## Pull Request Process

### PR Checklist

Before submitting your PR:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests pass (if applicable)
- [ ] Responsive on mobile
- [ ] Security considerations addressed

### PR Title Format

Use conventional commits:

```
feat: Add user profile page
fix: Resolve escrow funding bug
docs: Update API documentation
style: Format code with prettier
refactor: Simplify custody logic
test: Add escrow creation tests
chore: Update dependencies
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If applicable

## Checklist
- [ ] Code follows guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] Security reviewed
```

### Review Process

1. Maintainer reviews code
2. Automated tests run
3. Security scan completes
4. Changes requested or approved
5. PR merged to develop
6. Eventually promoted to main

---

## Reporting Bugs

### Before Reporting

1. Search existing issues
2. Try on latest version
3. Check documentation
4. Verify it's not a configuration issue

### Bug Report Template

```markdown
**Describe the bug**
Clear description

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome]
- Version: [e.g. 2.0.0]

**Additional context**
Any other information
```

---

## Feature Requests

### Before Requesting

1. Search existing feature requests
2. Ensure it aligns with project goals
3. Consider if it should be an extension

### Feature Request Template

```markdown
**Is your feature related to a problem?**
Description

**Describe the solution**
What you want to happen

**Describe alternatives**
Other solutions considered

**Additional context**
Mockups, examples, etc.
```

---

## Community

### Communication Channels

- GitHub Issues - Bug reports and features
- GitHub Discussions - General questions
- Discord - Real-time chat (if available)

### Getting Help

1. Check documentation first
2. Search closed issues
3. Ask in discussions
4. Create new issue if needed

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md
- Release notes

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to reach out through:
- GitHub Issues
- GitHub Discussions
- Email (add contact)

---

**Thank you for contributing to SplitBase! 🎉**

Your contributions help make custodial escrow services more accessible and secure for everyone.

