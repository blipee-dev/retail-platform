# Contributing to blipee OS Retail Intelligence

First off, thank you for considering contributing to blipee OS Retail Intelligence! It's people like you that make this platform a great tool for the retail industry.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@blipee.com.

## Getting Started

### Prerequisites

**Cloud-Only Development - No Local Installation Required!**

- Modern web browser
- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)

### Cloud Development Environment Setup

**Option 1: GitHub Codespaces (Recommended)**

1. **Open in Codespaces**
   - Go to the repository on GitHub
   - Click "Code" → "Codespaces" → "Create codespace on main"
   - Wait for environment to auto-configure (2-3 minutes)

2. **Environment Ready!**
   - All dependencies automatically installed
   - VS Code running in browser
   - Development server ready to start

**Option 2: Gitpod**

1. **Open in Gitpod**
   - Visit `https://gitpod.io/#https://github.com/blipee/os-retail-intelligence`
   - Sign in with GitHub
   - Environment automatically configured

### Configuration

1. **Environment Variables**
   ```bash
   # Already copied from .env.example
   # Edit .env.local with your credentials:
   
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

2. **Start Development**
   ```bash
   npm run dev
   ```

3. **Database Setup** (if needed)
   ```bash
   # Run migrations
   npm run db:migrate
   ```

### No Local Installation Needed!
- Everything runs in the cloud
- No Node.js installation required
- No dependency management on your machine
- Consistent development environment for all contributors

## Development Process

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `perf/description` - Performance improvements

### Workflow

1. **Create Issue First**
   - All work should start with an issue
   - Use issue templates
   - Get approval for major changes

2. **Create Branch**
   ```bash
   git checkout -b feature/add-awesome-feature
   ```

3. **Make Changes**
   - Follow coding standards
   - Write/update tests
   - Update documentation

4. **Commit Messages**
   ```
   type(scope): subject
   
   body
   
   footer
   ```
   
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
   
   Example:
   ```
   feat(auth): add SSO support for enterprise clients
   
   - Implement SAML 2.0 authentication
   - Add configuration UI for SSO providers
   - Update documentation
   
   Closes #123
   ```

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use explicit types
interface UserData {
  id: string;
  email: string;
  organization: Organization;
}

// Prefer const over let
const processData = async (data: UserData): Promise<ProcessedData> => {
  // Use early returns
  if (!data.id) {
    throw new Error('User ID is required');
  }
  
  // Destructure when appropriate
  const { email, organization } = data;
  
  // Use async/await over promises
  const result = await processUserData(data);
  return result;
};

// Export types and constants
export type { UserData };
export { processData };
```

### React Components

```typescript
// Use functional components with TypeScript
interface DashboardProps {
  user: User;
  metrics: Metric[];
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  metrics, 
  onRefresh 
}) => {
  // Use hooks appropriately
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  // Memoize expensive computations
  const processedMetrics = useMemo(
    () => processMetrics(metrics),
    [metrics]
  );
  
  return (
    <div className="dashboard">
      {/* Component JSX */}
    </div>
  );
};
```

### Database Queries

```typescript
// Use Supabase client properly
import { createClient } from '@/lib/supabase';

export async function getStoreMetrics(
  storeId: string,
  dateRange: DateRange
): Promise<StoreMetrics[]> {
  const supabase = createClient();
  
  // Always handle errors
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('site_id', storeId)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: false });
    
  if (error) {
    throw new DatabaseError('Failed to fetch store metrics', error);
  }
  
  return data;
}
```

### CSS/Styling

- Use Tailwind CSS utilities first
- Create components with shadcn/ui
- Follow mobile-first approach
- Ensure accessibility (WCAG 2.1 AA)

## Testing Requirements

### Unit Tests

```typescript
// Every function should have tests
describe('processMetrics', () => {
  it('should calculate conversion rate correctly', () => {
    const metrics = {
      visitors: 100,
      transactions: 25
    };
    
    const result = processMetrics(metrics);
    
    expect(result.conversionRate).toBe(0.25);
  });
  
  it('should handle zero visitors', () => {
    const metrics = {
      visitors: 0,
      transactions: 0
    };
    
    const result = processMetrics(metrics);
    
    expect(result.conversionRate).toBe(0);
  });
});
```

### Integration Tests

```typescript
// Test API endpoints
describe('API: /api/stores/:id/metrics', () => {
  it('should return metrics for valid store', async () => {
    const response = await request(app)
      .get('/api/stores/123/metrics')
      .set('Authorization', `Bearer ${token}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('metrics');
  });
});
```

### E2E Tests

```typescript
// Test critical user flows
test('user can view dashboard metrics', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForSelector('[data-testid="metrics-card"]');
  
  const metricsCard = page.locator('[data-testid="metrics-card"]');
  await expect(metricsCard).toBeVisible();
});
```

### Test Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths
- All PRs must include relevant tests

## Documentation Standards

### Code Documentation

```typescript
/**
 * Calculates the capture rate for a store
 * @param storeTraffic - Number of people entering the store
 * @param mallTraffic - Total mall traffic for the period
 * @returns Capture rate as a percentage (0-100)
 * @throws {ValidationError} If inputs are invalid
 * @example
 * const rate = calculateCaptureRate(150, 1000); // Returns 15
 */
export function calculateCaptureRate(
  storeTraffic: number,
  mallTraffic: number
): number {
  // Implementation
}
```

### API Documentation

- All endpoints must be documented in OpenAPI 3.0 format
- Include request/response examples
- Document error scenarios
- Keep docs in `docs/api/`

### User Documentation

- Update user guides for new features
- Include screenshots/videos for UI changes
- Maintain troubleshooting guides
- Keep docs in `docs/guides/`

## Submitting Changes

### Pull Request Process

1. **Ensure all tests pass**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

2. **Update documentation**
   - API docs for new endpoints
   - README for major features
   - CHANGELOG for all changes

3. **Create Pull Request**
   - Use PR template
   - Link related issues
   - Add appropriate labels
   - Request reviews from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No new warnings
```

### Code Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - Code coverage maintained
   - No security vulnerabilities

2. **Manual Review**
   - At least 2 approvals required
   - Architecture review for major changes
   - Security review for auth/data changes

3. **Merge Requirements**
   - Squash and merge for features
   - Rebase for fixes
   - No force pushes to main/staging

## Release Process

### Version Management

Follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist

1. **Pre-release**
   - [ ] All PRs merged
   - [ ] Tests passing
   - [ ] CHANGELOG updated
   - [ ] Documentation current

2. **Release**
   - [ ] Version bumped
   - [ ] Tag created
   - [ ] Release notes written
   - [ ] Deployment successful

3. **Post-release**
   - [ ] Announcement sent
   - [ ] Issues closed
   - [ ] Roadmap updated

## Getting Help

- 📧 Email: dev@retailintelligence.io
- 💬 Discord: [Development Channel](https://discord.gg/retailintel-dev)
- 📖 Wiki: [Developer Wiki](https://github.com/retail-intelligence/platform/wiki)
- 🎥 Videos: [YouTube Channel](https://youtube.com/retailintelligence)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual contributor report

Thank you for contributing to making retail smarter! 🚀