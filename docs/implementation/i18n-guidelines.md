# Internationalization (i18n) Guidelines

## Overview

This document outlines the internationalization requirements and implementation guidelines for the Retail Platform. All user-facing pages and components must support multiple languages to serve our global customer base.

## Supported Languages

- **English (en)** - Default language
- **Portuguese (pt)** - Brazilian Portuguese
- **Spanish (es)** - Latin American Spanish

## Architecture

### Directory Structure
```
app/
├── i18n/
│   ├── settings.ts         # i18n configuration
│   ├── index.ts           # Server-side utilities
│   ├── client.ts          # Client-side hooks
│   └── locales/
│       ├── en/
│       │   ├── common.json      # Shared translations
│       │   ├── auth.json        # Authentication
│       │   ├── dashboard.json   # Dashboard
│       │   └── landing.json     # Landing page
│       ├── pt/
│       │   └── ... (same structure)
│       └── es/
│           └── ... (same structure)
```

### Key Components

1. **Language Detection**
   - Automatic browser language detection
   - Cookie persistence for user preference
   - Fallback to English if language not supported

2. **Language Switcher**
   - Available on all pages
   - Dropdown with language names in their native script
   - Immediate update without page reload

## Implementation Guidelines

### 1. Page Components

Every page component must use translations:

```typescript
// ❌ Bad - Hardcoded text
export default function DashboardPage() {
  return <h1>Welcome to Dashboard</h1>
}

// ✅ Good - Using translations
import { useTranslation } from '@/app/i18n/client'

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  return <h1>{t('welcome.title')}</h1>
}
```

### 2. Server Components

For server components, use the server-side translation function:

```typescript
import { useTranslation } from '@/app/i18n'

export default async function ServerPage({ params: { lng } }) {
  const { t } = await useTranslation(lng, 'common')
  return <h1>{t('title')}</h1>
}
```

### 3. Translation Keys

Use descriptive, hierarchical keys:

```json
{
  "auth": {
    "signIn": {
      "title": "Sign In",
      "email": "Email Address",
      "password": "Password",
      "submit": "Sign In",
      "errors": {
        "invalidCredentials": "Invalid email or password",
        "networkError": "Network error. Please try again."
      }
    }
  }
}
```

### 4. Dynamic Content

For dynamic content with variables:

```json
{
  "dashboard": {
    "greeting": "Welcome back, {{name}}!",
    "stats": {
      "visitors": "{{count}} visitors today"
    }
  }
}
```

Usage:
```typescript
t('dashboard.greeting', { name: user.name })
t('dashboard.stats.visitors', { count: visitorCount })
```

### 5. Pluralization

Handle plurals correctly:

```json
{
  "items": {
    "count_one": "{{count}} item",
    "count_other": "{{count}} items"
  }
}
```

### 6. Date and Number Formatting

Use locale-specific formatting:

```typescript
// Format dates
const formattedDate = new Intl.DateTimeFormat(i18n.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(date)

// Format numbers
const formattedNumber = new Intl.NumberFormat(i18n.language).format(number)

// Format currency
const formattedCurrency = new Intl.NumberFormat(i18n.language, {
  style: 'currency',
  currency: 'USD'
}).format(amount)
```

## Component Checklist

When creating or updating a component:

- [ ] All user-visible text uses translation keys
- [ ] Translation keys are descriptive and hierarchical
- [ ] Translations exist for all supported languages
- [ ] Dynamic content uses interpolation correctly
- [ ] Dates and numbers use locale-specific formatting
- [ ] Component includes LanguageSwitcher if it's a page
- [ ] Error messages are translated
- [ ] Loading states have translated text
- [ ] Alt text for images is translated
- [ ] Form validation messages are translated

## Adding New Languages

To add a new language:

1. Add language code to `app/i18n/settings.ts`:
   ```typescript
   export const languages = ['en', 'pt', 'es', 'fr'] // Added French
   ```

2. Create locale directory:
   ```bash
   mkdir -p app/i18n/locales/fr
   ```

3. Copy English translations and translate:
   ```bash
   cp -r app/i18n/locales/en/* app/i18n/locales/fr/
   ```

4. Update the `LanguageSwitcher` component with the language name

## Translation Management

### File Organization

- **common.json** - Shared UI elements (navigation, buttons, etc.)
- **auth.json** - Authentication-related text
- **dashboard.json** - Dashboard and analytics text
- **errors.json** - Error messages
- **forms.json** - Form labels and validation

### Best Practices

1. **Keep translations consistent**
   - Use the same translation for the same concept
   - Maintain a glossary of key terms

2. **Avoid concatenation**
   ```typescript
   // ❌ Bad
   t('hello') + ' ' + userName
   
   // ✅ Good
   t('greeting', { name: userName })
   ```

3. **Context for translators**
   - Add comments in translation files when context is needed
   - Use descriptive key names

4. **Test all languages**
   - Check UI layout with longer translations
   - Verify right-to-left language support if needed
   - Test number and date formatting

## Integration with Existing Features

### Authentication Pages
- Sign In page ✅ (Implemented)
- Sign Up page (Pending)
- Forgot Password page (Pending)
- Email templates (Future)

### Dashboard Pages
- Role-specific dashboards (Pending)
- Analytics views (Pending)
- User management (Pending)
- Settings pages (Pending)

### API Responses
- Error messages should use language from Accept-Language header
- Validation messages should be translatable
- Email notifications should respect user's language preference

## Performance Considerations

1. **Lazy Loading**
   - Load only the required language bundle
   - Split translations by route/feature

2. **Caching**
   - Cache translations in browser
   - Use CDN for translation files

3. **Bundle Size**
   - Keep translation files focused
   - Avoid duplicating translations

## Testing

### Unit Tests
```typescript
// Mock translations in tests
jest.mock('@/app/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}))
```

### E2E Tests
- Test language switching
- Verify translations load correctly
- Check cookie persistence
- Test fallback behavior

## Accessibility

- Language switcher must be keyboard accessible
- Use proper `lang` attributes on HTML elements
- Announce language changes to screen readers

## Future Enhancements

1. **Translation Management System**
   - Integration with translation services
   - In-context editing for translators
   - Automated translation updates

2. **Additional Languages**
   - French (fr)
   - German (de)
   - Chinese (zh)
   - Japanese (ja)

3. **Regional Variants**
   - en-US vs en-GB
   - pt-BR vs pt-PT
   - es-MX vs es-ES

4. **Right-to-Left Support**
   - Arabic (ar)
   - Hebrew (he)
   - CSS adjustments for RTL layouts

---

By following these guidelines, we ensure a consistent, maintainable, and user-friendly multilingual experience across the entire platform.