# Changelog

All notable changes to the Contract Generator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.3.0] - 2025-11-07

### Added
- **Security: Input Sanitization** - XSS protection via DOMPurify for all user inputs
- **Security: CORS Configuration** - Restricted API access to trusted origins only
- **Configuration: Environment Variables** - .env support for secure configuration
- **Configuration: .gitignore** - Protect sensitive files (database, .env) from version control
- **Utility: Sanitization Module** - Reusable sanitization functions in `utils/sanitize.js`
- **Testing: Quick Wins Test Suite** - Automated security and functionality tests

### Changed
- **Performance: Production React Builds** - Switched from development to production React builds
  - Main app: standalone_contract_generator_v3_flow.html
  - Admin: beheer/clausule-beheer.html
  - ~30% smaller bundle size, faster loading
- **Docker: Updated Dockerfile** - Include utils folder in container build
- **Dependencies: Added** - isomorphic-dompurify, dotenv

### Security
- ✅ **Fixed: XSS Vulnerabilities** - All user input is now sanitized before storage
- ✅ **Fixed: CORS Wide Open** - API restricted to localhost origins only
- ✅ **Fixed: Sensitive Files in Git** - Database and environment files excluded

### Documentation
- Added comprehensive architecture analysis (docs/ARCHITECTUUR_ANALYSE_2025-11-07.md)
- Added quick start improvement plan (docs/VERBETERPLAN_QUICK_START.md)
- Created CHANGELOG.md for version history

## [4.2.0] - 2025-11-07

### Added
- **Design: Logo Integration** - Added Ketenbureau i-Sociaal Domein logo to header
- **Docker: Logo Volume Mount** - Mounted afbeeldingen folder in docker-compose

### Changed
- Updated all headers with logo display
- Version bumped to v4.2.0

## [4.1.0] - 2025-11-07

### Changed
- **Design: i-Sociaaldomein Look & Feel** - Complete design overhaul
  - Purple color scheme (#7B1EA2)
  - Poppins font family
  - Flat, minimal design without gradients
  - Compact button sizing
- Applied consistent styling across:
  - Main application
  - Flow management interface
  - Clausule management interface

### Added
- Professional, modern UI components
- Improved visual hierarchy
- Better accessibility

## [4.0.0] - 2025-11-06

### Added
- Info button feature for questions and groups
- Grouped question display in frontend
- Support for question-level and group-level info buttons

### Changed
- Enhanced flow engine with grouping support
- Improved question rendering with optional info tooltips

### Documentation
- Added FEATURE_INFO_BUTTON_CHANGELOG.md
- Added INFO_BUTTON_FEATURE.md
- Added INFO_BUTTON_SUMMARY.txt

## [3.0.0] - 2025-10-07

### Added
- Flow-based contract generation engine
- SQLite database for flows and clausules
- Admin interfaces for flow and clausule management
- Word document export functionality
- Docker support with docker-compose
- RESTful API for flows and clausules

### Features
- Multi-step workflow with conditional logic
- Parameter collection (text, select, date, boolean, multiselect)
- Clausule selection with categories
- Contract review and editing
- Dynamic Word document generation

### Technical Stack
- Backend: Node.js + Express + SQLite
- Frontend: React 18 (CDN) + Tailwind CSS
- Libraries: DOMPurify, docx.js, FileSaver.js

---

## Version History Summary

- **v4.3.0** (2025-11-07): Security & Performance Quick Wins
- **v4.2.0** (2025-11-07): Logo Integration
- **v4.1.0** (2025-11-07): i-Sociaaldomein Design
- **v4.0.0** (2025-11-06): Info Button Feature
- **v3.0.0** (2025-10-07): Initial Flow Engine Release

---

## Upgrade Notes

### Upgrading to 4.3.0

**Required Actions:**
1. Create `.env` file (copy from `.env.example`)
2. Rebuild Docker container: `docker-compose down && docker-compose up --build -d`
3. Hard refresh browser (Cmd+Shift+R) to clear cache

**Breaking Changes:**
- CORS now restricted to localhost origins (configure via ALLOWED_ORIGINS in .env)
- Database file should be removed from git (already in .gitignore)

**New Environment Variables:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=./flows.db
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3001
LOG_LEVEL=info
```

### Upgrading to 4.2.0

**Required Actions:**
1. Update docker-compose.yml to mount afbeeldingen folder
2. Restart container

### Upgrading to 4.1.0

**No breaking changes** - design update only

---

## Future Roadmap

### Planned for v5.0.0
- User authentication system
- Role-based access control (Admin/Editor/Viewer)
- Session management
- Login/logout functionality

### Planned for v5.1.0
- Backend code reorganization (MVC structure)
- Frontend component extraction
- Testing framework setup
- CI/CD pipeline

### Planned for v6.0.0
- Database normalization
- Migration system
- Performance optimizations
- Caching layer

---

**Maintained by:** Contract Generator Development Team
**Last Updated:** 2025-11-07
