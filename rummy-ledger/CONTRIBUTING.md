# Contributing to Rummy Ledger

Thank you for your interest in contributing to Rummy Ledger! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Submitting Changes](#submitting-changes)
7. [Issue Guidelines](#issue-guidelines)
8. [Feature Requests](#feature-requests)
9. [Documentation](#documentation)
10. [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow these guidelines to ensure a welcoming environment for everyone.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Code editor (VS Code recommended)
- Basic knowledge of React Native and TypeScript

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/rummy-ledger.git
   cd rummy-ledger
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/rummy-ledger.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start development server**:
   ```bash
   npm start
   ```

6. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

### Project Structure

```
rummy-ledger/
├── app/                    # Screen components (Expo Router)
├── components/             # Reusable UI components
├── src/
│   ├── context/           # React Context providers
│   ├── services/          # Business logic services
│   ├── models/            # Data models and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── constants/             # App constants and themes
├── assets/                # Images, fonts, and static assets
├── __tests__/             # Test files
├── docs/                  # Documentation files
└── scripts/               # Build and utility scripts
```

## Development Workflow

### Branch Strategy

We use a Git flow-inspired branching strategy:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/score-editing`)
- **bugfix/**: Bug fixes (`bugfix/navigation-crash`)
- **hotfix/**: Critical production fixes

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Regularly sync with upstream
git checkout develop
git pull upstream develop
git checkout feature/your-feature-name
git rebase develop
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use strict TypeScript configuration

```typescript
// Good
interface Player {
  id: string;
  name: string;
  totalScore: number;
}

// Avoid
const player: any = { /* ... */ };
```

### React Native Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Follow React Native performance guidelines
- Use memoization for expensive operations

```typescript
// Good
const PlayerCard = React.memo(({ player }: { player: Player }) => {
  return (
    <ThemedView>
      <ThemedText>{player.name}</ThemedText>
    </ThemedView>
  );
});

// Use proper hooks
const useGameLogic = () => {
  const [game, setGame] = useState<Game | null>(null);
  
  const addRound = useCallback((scores: PlayerScore[]) => {
    // Implementation
  }, []);
  
  return { game, addRound };
};
```

### Code Style

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Naming Conventions

- **Components**: PascalCase (`PlayerCard`, `ScoreEntryModal`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase (`playerName`, `calculateScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `DEFAULT_THEME`)
- **Types/Interfaces**: PascalCase (`Player`, `GameState`)

### Component Structure

```typescript
// Component file structure
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView, ThemedText } from '@/components/themed';

interface Props {
  // Define props interface
}

export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, []);
  
  // Render
  return (
    <ThemedView style={styles.container}>
      <ThemedText>{/* Content */}</ThemedText>
    </ThemedView>
  );
};

// Styles at the bottom
const styles = StyleSheet.create({
  container: {
    // Styles
  },
});
```

## Testing Requirements

### Test Coverage

- Maintain minimum 90% test coverage
- Write tests for all new features
- Update tests when modifying existing code
- Include both unit and integration tests

### Testing Types

**Unit Tests:**
```typescript
// Component testing
import { render, fireEvent } from '@testing-library/react-native';
import { PlayerCard } from '../PlayerCard';

describe('PlayerCard', () => {
  it('displays player name and score', () => {
    const player = { id: '1', name: 'John', totalScore: 150 };
    const { getByText } = render(<PlayerCard player={player} />);
    
    expect(getByText('John')).toBeTruthy();
    expect(getByText('150')).toBeTruthy();
  });
});
```

**Service Testing:**
```typescript
// Business logic testing
import { GameService } from '../GameService';

describe('GameService', () => {
  it('calculates scores correctly', () => {
    const scores = [{ playerId: '1', score: 50, isRummy: false }];
    const result = GameService.calculateRoundTotal(scores);
    
    expect(result).toBe(50);
  });
});
```

**Accessibility Testing:**
```typescript
// Accessibility testing
import { render } from '@testing-library/react-native';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should be accessible', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:accessibility

# Generate coverage report
npm run test:coverage
```

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date** with develop
2. **Run the full test suite** and ensure all tests pass
3. **Update documentation** if needed
4. **Create a pull request** with a clear title and description

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Accessibility tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing** on multiple devices/platforms
4. **Documentation review** if applicable
5. **Final approval** and merge

## Issue Guidelines

### Bug Reports

When reporting bugs, include:

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Device/platform information**
- **App version** and relevant environment details
- **Screenshots or videos** if helpful

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Device Information:**
- Device: [e.g. iPhone 12, Samsung Galaxy S21]
- OS: [e.g. iOS 15.0, Android 11]
- App Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## Feature Requests

### Proposing New Features

1. **Check existing issues** to avoid duplicates
2. **Create a detailed proposal** with use cases
3. **Discuss with maintainers** before implementation
4. **Consider backward compatibility**
5. **Plan for testing and documentation**

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
Detailed description of how it should work.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

## Documentation

### Documentation Standards

- Keep documentation up to date with code changes
- Use clear, concise language
- Include code examples where helpful
- Follow markdown formatting standards
- Test all code examples

### Types of Documentation

- **README**: Project overview and quick start
- **API Documentation**: Code interfaces and usage
- **User Guide**: End-user instructions
- **Developer Guide**: Technical implementation details
- **Troubleshooting**: Common issues and solutions

### Documentation Updates

When making changes that affect:
- **User interface**: Update user guide and screenshots
- **API/interfaces**: Update API documentation
- **Build process**: Update deployment guide
- **New features**: Update README and user guide

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration

### Getting Help

- Check existing documentation first
- Search closed issues for similar problems
- Ask questions in GitHub Discussions
- Be specific and provide context

### Recognition

Contributors are recognized through:
- GitHub contributor statistics
- Mention in release notes
- Credit in documentation
- Community acknowledgment

## Release Process

### Version Management

We follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes, backward compatible

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Build verification completed
- [ ] App store metadata prepared

---

Thank you for contributing to Rummy Ledger! Your efforts help make this project better for everyone.