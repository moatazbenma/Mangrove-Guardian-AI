# Contributing to Mangrove Guardian AI

Thank you for your interest in contributing to this conservation project!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/Mangrove-Guardian-AI.git`
3. Create feature branch: `git checkout -b feature/your-feature`
4. Follow the setup instructions in [README.md](README.md)

## Development Setup

### Backend
```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## Code Standards

### Python (Backend)
- Follow PEP 8
- Use `black` for formatting
- Run `flake8` for linting
- Write docstrings for all functions

### TypeScript/React (Frontend)
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful component comments
- Keep components under 300 lines

## Commit Message Guidelines

Use descriptive commit messages:
```
feat: Add user authentication endpoints
fix: Resolve rate limiting edge case
docs: Update deployment documentation
style: Format code with black
refactor: Simplify analysis algorithm
test: Add unit tests for throttles
```

## Pull Request Process

1. Update [CHANGELOG.md](CHANGELOG.md) if available
2. Ensure all tests pass: `npm test` / `python manage.py test`
3. Update documentation for new features
4. Request review from maintainers
5. Address feedback and re-request review

## Reporting Bugs

When reporting bugs, include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python/Node version, etc.)
- Error logs or screenshots

## Feature Requests

To suggest improvements:
1. Check existing issues/discussions
2. Describe the use case and benefits
3. Provide examples if possible
4. Be open to discussion

## Community

- Treat all contributors with respect
- Follow the Contributor Covenant Code of Conduct
- Ask questions in issues or discussions
- Help other contributors when you can

Thank you for supporting mangrove conservation!
