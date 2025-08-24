# GitHub Copilot Instructions

## Project Overview

React + TypeScript + Vite dental scheduler with Supabase Auth and Go backend.

## Key Rules

- Use `apiClient` from `src/lib/apiClient.ts` for backend calls
- Use `useAuth()` hook for authentication state
- Throw errors only on API failures, log info for empty results
- Use proper TypeScript types (avoid `any`)
- Follow React best practices

## Security & File Creation

- **Don't create** test files, shell scripts, SQL scripts, Dockerfiles, or markdown files without asking for confirmation first
- **Don't hardcode** sensitive information like passwords, API keys, or secrets in committed code
- Use environment variables for configuration

## Architecture

- Users belong to organizations (`profiles.org_id`)
- Backend APIs require JWT tokens (auto-added by apiClient)
- All backend endpoints need organization context

## Extra notes

- Remember that there's a backend project that handles data operations and deals with database migrations and policies. The frontend only handles the UI and authentication via Supabase. When you identify a need for a new API endpoint, or some database change, please suggest the necessary changes for the backend as well.
