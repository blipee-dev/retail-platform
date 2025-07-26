# Contributing to blipee OS Retail Intelligence

Thank you for your interest in contributing to blipee OS Retail Intelligence! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read our Code of Conduct before participating:

- **Be Respectful**: Treat everyone with respect. No harassment, discrimination, or inappropriate behavior.
- **Be Collaborative**: Work together effectively, be helpful, and share knowledge.
- **Be Professional**: Maintain professionalism in all interactions.
- **Be Inclusive**: Welcome and support people of all backgrounds and identities.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account
- A GitHub account
- Basic knowledge of TypeScript and React

### Setting Up Your Development Environment

1. **Fork the Repository**
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/retail-intelligence.git
   cd retail-intelligence
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Found a bug? Help us fix it!
- **Features**: Have an idea for a new feature? Let's discuss it!
- **Documentation**: Help improve our docs or add examples
- **Tests**: Improve test coverage
- **Performance**: Help optimize the platform
- **Translations**: Help translate the platform to new languages
- **Design**: Improve UI/UX

### Reporting Issues

Before creating an issue:

1. **Search existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Provide detailed information**:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. **Check the roadmap** in [ROADMAP.md](ROADMAP.md)
2. **Search existing feature requests**
3. **Create a feature request** with:
   - Clear use case
   - Proposed solution
   - Alternative solutions considered
   - Potential impact

## Development Process

### Branches

- `main` - Production-ready code
- `staging` - Pre-production testing
- `develop` - Active development
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests for new functionality

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add multi-language support for reports
fix: correct timezone calculation in analytics
docs: update API documentation for sensors endpoint
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode
- Use meaningful variable names
- Document complex logic
- Avoid `any` type

```typescript
// Good
interface SensorData {
  id: string;
  timestamp: Date;
  count: number;
}

// Bad
let data: any = {};
```

### React Components

- Use functional components with hooks
- Implement proper error boundaries
- Keep components focused and reusable
- Use proper TypeScript props

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};
```

### CSS/Styling

- Use Tailwind CSS utilities
- Follow mobile-first approach
- Maintain consistent spacing
- Use semantic color variables

### Database

- Always use Row Level Security (RLS)
- Write efficient queries
- Document complex SQL
- Use proper indexes

## Testing Guidelines

### Unit Tests

```typescript
describe('Analytics Service', () => {
  it('should calculate hourly aggregates correctly', () => {
    const data = mockSensorData();
    const result = calculateHourlyAggregates(data);
    expect(result.total_in).toBe(150);
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Test authentication flows

### E2E Tests

- Test critical user journeys
- Test across different browsers
- Test mobile responsiveness

## Documentation

### Code Documentation

- Document all public APIs
- Use JSDoc for functions
- Include examples where helpful

```typescript
/**
 * Calculates the conversion rate between footfall and transactions
 * @param footfall - Total number of visitors
 * @param transactions - Total number of transactions
 * @returns Conversion rate as a percentage
 * @example
 * const rate = calculateConversionRate(1000, 50); // Returns 5.0
 */
export function calculateConversionRate(footfall: number, transactions: number): number {
  if (footfall === 0) return 0;
  return (transactions / footfall) * 100;
}
```

### API Documentation

- Update API docs when changing endpoints
- Include request/response examples
- Document error cases

### User Documentation

- Update guides for new features
- Add screenshots where helpful
- Keep language clear and simple

## Pull Request Process

### Before Submitting

1. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   npm run build
   ```

2. **Update documentation**

3. **Check for breaking changes**

4. **Update CHANGELOG.md** if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in preview deployment
4. **Approval** from at least one maintainer
5. **Merge** to target branch

### After Merge

- Delete your feature branch
- Update your local repository
- Celebrate your contribution! 🎉

## Community

### Getting Help

- **Discord**: [Join our Discord](https://discord.gg/blipee)
- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Tag questions with `blipee-retail`

### Recognition

We recognize contributors in several ways:

- Contributors list in README
- Shoutouts in release notes
- Special badges for regular contributors
- Invitation to maintainer team for exceptional contributors

## Questions?

If you have questions about contributing, please:

1. Check our [documentation](docs/)
2. Search [existing issues](https://github.com/blipee/retail-intelligence/issues)
3. Ask in [GitHub Discussions](https://github.com/blipee/retail-intelligence/discussions)
4. Email us at contributions@blipee.com

Thank you for contributing to blipee OS Retail Intelligence! Your efforts help make retail analytics accessible to businesses worldwide.

---

**Happy Contributing!** 🚀