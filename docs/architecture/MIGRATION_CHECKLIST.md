# Kamioi.2 Migration Checklist

## Pre-Migration (Do in Current Kamioi Project)

### 1. Backup Everything
- [ ] Create full backup of `C:\Users\beltr\Kamioi` to external location
- [ ] Export database: `sqlite3 backend/kamioi.db .dump > kamioi_backup.sql`
- [ ] Document current environment variables (backend/.env, frontend/.env)
- [ ] Take screenshots of current working state (if needed)

### 2. Analysis & Documentation
- [ ] Review `PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md`
- [ ] List all active features/endpoints
- [ ] Document all third-party services/APIs used
- [ ] List all environment variables needed
- [ ] Document database schema (if not already documented)

### 3. Cleanup Current Project (Optional - for reference)
- [ ] Run `cleanup_script.ps1 -DryRun` to see what can be removed
- [ ] Review results
- [ ] Run `cleanup_script.ps1` (without -DryRun) if you want to clean current project

---

## Phase 1: Create Kamioi.2 Structure

### Directory Setup
- [ ] Create `C:\Users\beltr\Kamioi.2` directory
- [ ] Create directory structure:
  ```
  Kamioi.2/
  ├── backend/
  │   ├── src/
  │   │   ├── models/
  │   │   ├── routes/
  │   │   ├── services/
  │   │   ├── utils/
  │   │   └── config/
  │   ├── migrations/
  │   ├── tests/
  │   ├── scripts/
  │   ├── instance/
  │   └── logs/
  ├── frontend/
  │   ├── src/
  │   │   ├── components/
  │   │   ├── pages/
  │   │   ├── services/
  │   │   ├── hooks/
  │   │   ├── utils/
  │   │   └── types/
  │   └── public/
  ├── database/
  │   ├── migrations/
  │   ├── seeds/
  │   └── backups/
  ├── docs/
  │   ├── api/
  │   ├── architecture/
  │   ├── deployment/
  │   ├── development/
  │   └── archived/
  ├── scripts/
  └── data/
      ├── uploads/
      ├── exports/
      └── training/
  ```

### Configuration Files
- [ ] Copy `RECOMMENDED_.gitignore` to `Kamioi.2/.gitignore`
- [ ] Create `Kamioi.2/.env.example` (template)
- [ ] Create `Kamioi.2/README.md` (new, consolidated)
- [ ] Create `Kamioi.2/CHANGELOG.md`

---

## Phase 2: Backend Migration

### Source Code Migration
- [ ] Copy `backend/models/*.py` → `Kamioi.2/backend/src/models/`
- [ ] Copy `backend/routes/**/*.py` → `Kamioi.2/backend/src/routes/`
- [ ] Copy `backend/services/*.py` → `Kamioi.2/backend/src/services/`
- [ ] Copy `backend/utils/*.py` → `Kamioi.2/backend/src/utils/`
- [ ] Copy `backend/config/*.py` → `Kamioi.2/backend/src/config/`
- [ ] Copy `backend/app.py` → `Kamioi.2/backend/app.py`
- [ ] Copy `backend/requirements.txt` → `Kamioi.2/backend/requirements.txt`

### Update Import Paths
- [ ] Update all imports in `app.py` to reflect new structure
- [ ] Update imports in all route files
- [ ] Update imports in all service files
- [ ] Test that all imports resolve correctly

### Database Setup
- [ ] Create new, clean database: `Kamioi.2/backend/instance/kamioi.db`
- [ ] Run database migrations (if using Alembic)
- [ ] OR: Import only necessary data from old database
- [ ] Verify database schema is correct
- [ ] Test database connections

### Virtual Environment
- [ ] Create new virtual environment: `python -m venv Kamioi.2/backend/venv`
- [ ] Activate venv
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify all packages install correctly
- [ ] Test that Flask app can start

### Configuration
- [ ] Create `Kamioi.2/backend/.env` from template
- [ ] Copy environment variables from old project
- [ ] Update database paths in config
- [ ] Update file upload paths
- [ ] Test configuration loading

### Scripts
- [ ] Copy utility scripts to `Kamioi.2/backend/scripts/`
- [ ] Update script paths to reflect new structure
- [ ] Create database cleanup script
- [ ] Create database archive script
- [ ] Test scripts work

---

## Phase 3: Frontend Migration

### Source Code Migration
- [ ] Copy `frontend/src/components/**` → `Kamioi.2/frontend/src/components/`
- [ ] Copy `frontend/src/pages/**` → `Kamioi.2/frontend/src/pages/`
- [ ] Copy `frontend/src/services/**` → `Kamioi.2/frontend/src/services/`
- [ ] Copy `frontend/src/utils/**` → `Kamioi.2/frontend/src/utils/`
- [ ] Copy `frontend/src/types/**` → `Kamioi.2/frontend/src/types/` (if exists)
- [ ] Copy `frontend/src/App.tsx` or `App.jsx` → `Kamioi.2/frontend/src/`
- [ ] Copy `frontend/src/main.tsx` or `main.jsx` → `Kamioi.2/frontend/src/`
- [ ] Copy `frontend/public/**` → `Kamioi.2/frontend/public/`

### Configuration Files
- [ ] Copy `frontend/package.json` → `Kamioi.2/frontend/`
- [ ] Copy `frontend/vite.config.js` (or webpack.config.js) → `Kamioi.2/frontend/`
- [ ] Copy `frontend/tsconfig.json` → `Kamioi.2/frontend/` (if exists)
- [ ] Copy `frontend/tailwind.config.js` → `Kamioi.2/frontend/` (if exists)
- [ ] Copy `frontend/.env` → `Kamioi.2/frontend/.env`

### Update Paths
- [ ] Update API service URLs if paths changed
- [ ] Update import paths if structure changed
- [ ] Update asset paths
- [ ] Update environment variable references

### Dependencies
- [ ] Run `npm install` or `yarn install` in `Kamioi.2/frontend/`
- [ ] Verify all dependencies install correctly
- [ ] Check for dependency conflicts
- [ ] Update package.json if needed (remove unused deps)

### Build Test
- [ ] Run `npm run build` or `yarn build`
- [ ] Verify build completes without errors
- [ ] Test that build output works

---

## Phase 4: Database Optimization

### Data Cleanup
- [ ] Identify old/archived data (transactions > 2 years old)
- [ ] Create archive tables
- [ ] Move old data to archive
- [ ] Run VACUUM on database
- [ ] Verify database size reduced significantly

### Schema Optimization
- [ ] Review and add missing indexes
- [ ] Remove unused tables/columns
- [ ] Optimize table structures
- [ ] Test query performance

### Backup Strategy
- [ ] Set up automated backup script
- [ ] Test backup restoration
- [ ] Document backup process

---

## Phase 5: Documentation Organization

### Consolidate Documentation
- [ ] Move all UAT docs to `Kamioi.2/docs/archived/uat/`
- [ ] Move implementation guides to `Kamioi.2/docs/implementation/`
- [ ] Move API docs to `Kamioi.2/docs/api/`
- [ ] Create consolidated README.md
- [ ] Create CHANGELOG.md from all status files
- [ ] Archive old documentation

### Create New Documentation
- [ ] Write setup guide in README.md
- [ ] Document API endpoints
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create development guide

---

## Phase 6: Testing & Validation

### Backend Testing
- [ ] Test all API endpoints
- [ ] Test database operations
- [ ] Test file uploads
- [ ] Test authentication/authorization
- [ ] Test error handling
- [ ] Run unit tests (if exist)
- [ ] Run integration tests (if exist)

### Frontend Testing
- [ ] Test all pages load correctly
- [ ] Test all forms submit correctly
- [ ] Test API integrations
- [ ] Test routing
- [ ] Test responsive design
- [ ] Test in different browsers

### Integration Testing
- [ ] Test full user flows
- [ ] Test admin dashboard
- [ ] Test family dashboard
- [ ] Test business dashboard
- [ ] Test user dashboard
- [ ] Test LLM center functionality
- [ ] Test transaction processing

### Performance Testing
- [ ] Test page load times
- [ ] Test API response times
- [ ] Test database query performance
- [ ] Test with realistic data volumes
- [ ] Identify and fix bottlenecks

---

## Phase 7: Cleanup & Finalization

### Remove Unused Code
- [ ] Identify and remove duplicate code
- [ ] Remove unused imports
- [ ] Remove unused dependencies
- [ ] Remove commented-out code
- [ ] Remove test/debug code

### Code Quality
- [ ] Run linter on backend code
- [ ] Run linter on frontend code
- [ ] Fix all linting errors
- [ ] Format code consistently
- [ ] Review code for best practices

### Final Checks
- [ ] Verify .gitignore is comprehensive
- [ ] Verify no sensitive data in code
- [ ] Verify no hardcoded paths
- [ ] Verify all environment variables documented
- [ ] Verify database is optimized
- [ ] Verify build artifacts are gitignored

---

## Phase 8: Deployment Preparation

### Environment Setup
- [ ] Document production environment variables
- [ ] Create production .env template
- [ ] Set up production database
- [ ] Configure production logging
- [ ] Set up error monitoring

### Deployment Scripts
- [ ] Create deployment script
- [ ] Create rollback script
- [ ] Test deployment process
- [ ] Document deployment steps

### Monitoring
- [ ] Set up application monitoring
- [ ] Set up error tracking
- [ ] Set up performance monitoring
- [ ] Set up database monitoring

---

## Post-Migration

### Validation
- [ ] Compare functionality between Kamioi and Kamioi.2
- [ ] Verify all features work
- [ ] Verify performance is improved
- [ ] Verify project size is reduced

### Documentation
- [ ] Update all documentation
- [ ] Create migration notes
- [ ] Document any issues encountered
- [ ] Document solutions applied

### Team Handoff
- [ ] Share new project structure with team
- [ ] Update onboarding documentation
- [ ] Train team on new structure
- [ ] Update development workflows

---

## Rollback Plan

If issues are found:
- [ ] Keep old Kamioi project until Kamioi.2 is fully validated
- [ ] Document any issues found
- [ ] Fix issues in Kamioi.2
- [ ] Re-test after fixes
- [ ] Only switch over when confident

---

## Success Criteria

Kamioi.2 is ready when:
- [ ] All tests pass
- [ ] All features work as expected
- [ ] Project size is significantly reduced (target: <2GB)
- [ ] Code is clean and organized
- [ ] Documentation is complete
- [ ] Performance is acceptable or improved
- [ ] Team can work efficiently in new structure

---

## Notes

- Take your time with migration - don't rush
- Test thoroughly at each phase
- Keep old project until new one is validated
- Document everything as you go
- Ask for help if stuck

