# Requirements Document

## Introduction

This document specifies the requirements for the **App Foundation** of Trace, a developer-first technical interview preparation platform. The marketing homepage is already built and deployed; this foundation layer provides the base capabilities that every subsequent product module depends on: authentication, user lifecycle management, the persistent data layer, the content management client, and the authenticated application shell (dashboard).

The scope of this spec is intentionally foundational. It establishes authentication, user record management, database schema scaffolding, a content client with a health-check query, and a protected dashboard shell with placeholder widgets. Full educational content schemas, progress tracking, notes, bookmarks, revision, and analytics arrive in later specs; this spec prepares the ground for them.

Two hard architectural boundaries govern the entire platform and are reflected throughout these requirements:
- Educational content lives **only** in Sanity CMS.
- User-specific data lives **only** in Neon PostgreSQL, which references Sanity document identifiers rather than duplicating content.

## Glossary

- **Trace_App**: The authenticated Next.js application that serves protected routes, including the dashboard.
- **Auth_Service**: The Auth.js-based authentication subsystem configured with Google OAuth as the sole identity provider in v1.
- **Identity_Provider**: Google OAuth, the external service used to authenticate users.
- **Session**: A persisted authenticated context associating a browser with a User across requests.
- **User**: A person with a record in the Neon PostgreSQL `users` table, created on first successful sign-in.
- **User_Settings**: The per-User preferences record initialized when a User is created.
- **Data_Layer**: The Neon PostgreSQL database accessed exclusively through the Drizzle ORM.
- **Drizzle_ORM**: The type-safe ORM and query builder used for all database access, producing parameterized queries.
- **Neon_DB**: The serverless Neon PostgreSQL database instance, accessed through a pooled connection from the serverless runtime.
- **Content_Client**: The configured Sanity CMS client exposing typed GROQ query utilities.
- **Sanity_CMS**: The external content management system that holds all educational content.
- **Dashboard**: The protected post-authentication home route of the Trace_App.
- **App_Shell**: The persistent navigation layout (sidebar on desktop, collapsible on tablet, bottom navigation on mobile) surrounding authenticated routes.
- **Dashboard_Widget**: A modular dashboard panel (Continue Learning, Daily Goal, Streak, Revision Queue, Recent Notes, Bookmarks, Activity Graph, Announcements) whose data source arrives in a later module and is scaffolded as a loadable placeholder in this spec.
- **Protected_Route**: Any Trace_App route that requires an authenticated Session.
- **Input_Validator**: The Zod-based validation layer applied to inputs crossing a trust boundary.
- **UUID**: A universally unique identifier used as the primary key for Data_Layer tables.

## Requirements

### Requirement 1: Google OAuth Authentication

**User Story:** As a visitor, I want to sign in with my Google account, so that I can access the Trace application securely without managing another password.

#### Acceptance Criteria

1. THE Auth_Service SHALL present Google OAuth as the only available sign-in method, and SHALL not display or accept any other sign-in method.
2. WHEN a visitor initiates sign-in, THE Auth_Service SHALL redirect the visitor to the Identity_Provider for authentication within 2 seconds of the initiation event.
3. WHEN the Identity_Provider returns a successful authentication result, THE Auth_Service SHALL establish an authenticated Session for the visitor and redirect the visitor to the authenticated landing view.
4. WHEN the Auth_Service establishes a Session, THE Auth_Service SHALL set the Session to expire after 30 minutes of visitor inactivity and after a maximum absolute lifetime of 24 hours, whichever occurs first.
5. IF the Identity_Provider returns an authentication failure or the visitor cancels, THEN THE Auth_Service SHALL return the visitor to the sign-in entry point without establishing a Session and SHALL display an error message indicating that sign-in did not complete.
6. IF the Identity_Provider does not return a result within 30 seconds of redirect, THEN THE Auth_Service SHALL return the visitor to the sign-in entry point without establishing a Session and SHALL display an error message indicating that sign-in timed out.
7. IF the authentication result cannot be validated as originating from the same sign-in request initiated by the visitor, THEN THE Auth_Service SHALL reject the result without establishing a Session and SHALL display an error message indicating that sign-in could not be verified.
8. THE Auth_Service SHALL read all Identity_Provider client credentials from environment variables.
9. IF one or more required Identity_Provider client credentials are absent when the Auth_Service starts, THEN THE Auth_Service SHALL fail to start and SHALL emit an error indicating which required credential is missing.

### Requirement 2: Protected Route Access Control

**User Story:** As a product owner, I want every protected route to require authentication, so that user-specific areas are never exposed to unauthenticated visitors.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor requests a Protected_Route, THE Trace_App SHALL redirect the visitor to the sign-in entry point without rendering any protected content.
2. WHEN an authenticated User with a verified Session requests a Protected_Route, THE Trace_App SHALL serve the requested route.
3. THE Trace_App SHALL verify both authentication and authorization for each Protected_Route request on the server before rendering any protected content.
4. WHEN a server-side action is invoked on a Protected_Route, THE Trace_App SHALL verify the authenticated Session on the server before executing the action.
5. IF an authenticated Session cannot be verified for a server-side action, THEN THE Trace_App SHALL reject the action without applying any state changes and return an authorization error indicating the request is not authenticated.
6. IF a User's Session is expired or invalid when a Protected_Route is requested, THEN THE Trace_App SHALL redirect the visitor to the sign-in entry point without rendering any protected content.

### Requirement 3: Session Persistence and Logout

**User Story:** As a returning user, I want my session to persist and to be able to log out securely, so that I can resume my work and end my session when I choose.

#### Acceptance Criteria

1. WHEN a User completes sign-in, THE Auth_Service SHALL persist the Session so that the User remains authenticated across browser restarts until either the Session inactivity period reaches 30 minutes, the Session absolute lifetime reaches 7 days, or the User logs out, whichever occurs first.
2. WHEN a User with a valid persisted Session returns to the Trace_App, THE Trace_App SHALL restore the authenticated context and route the User to the Dashboard within 3 seconds without requiring re-authentication.
3. IF a User returns to the Trace_App with a persisted Session that is expired, invalid, or fails validation, THEN THE Trace_App SHALL remove the persisted Session credentials from the browser, redirect the User to the sign-in entry point, and display a message indicating that re-authentication is required.
4. WHEN a User initiates logout, THE Auth_Service SHALL invalidate the Session on the server and remove all Session credentials from the browser within 2 seconds.
5. IF Session invalidation fails during logout, THEN THE Auth_Service SHALL remove all Session credentials from the browser, retain no authenticated context, and return an error indication reporting the invalidation failure.
6. WHEN logout completes, THE Trace_App SHALL redirect the User to a public route that requires no authentication.
7. WHEN an unauthenticated visitor completes first sign-in, THE Trace_App SHALL make the Dashboard reachable within 60 seconds of the visitor arriving at the sign-in entry point.

### Requirement 4: User Record Lifecycle

**User Story:** As a user, I want my account to be created automatically on first sign-in and kept current on later sign-ins, so that I have a single persistent identity without duplicate records.

#### Acceptance Criteria

1. WHEN a User signs in and no existing User record matches the stable identity key returned by the Identity_Provider, THE Trace_App SHALL create a User record in the Neon_DB `users` table using the identity details returned by the Identity_Provider.
2. WHEN a User record is created, THE Trace_App SHALL initialize exactly one corresponding User_Settings record populated with the system default preference values before the sign-in completes.
3. WHEN a User signs in and an existing User record matches the stable identity key returned by the Identity_Provider, THE Trace_App SHALL update that existing User record and SHALL NOT create an additional User record.
4. THE Trace_App SHALL match a returning User to an existing User record by comparing the stable identity key returned by the Identity_Provider against the stored identity key, treating a match as exact and case-sensitive.
5. WHEN a User record is created, THE Trace_App SHALL assign a UUID as the record primary key and set both the `createdAt` and `updatedAt` timestamps to the record creation time (UTC).
6. WHEN a User record is updated, THE Trace_App SHALL set the `updatedAt` timestamp to the time of the update (UTC) and SHALL leave the `createdAt` timestamp unchanged.
7. IF the Identity_Provider does not return a stable identity key during sign-in, THEN THE Trace_App SHALL abort the create or update operation, make no change to the `users` table, and return an error indicating that the User could not be identified.
8. IF creation or update of the User record in the Neon_DB `users` table fails, THEN THE Trace_App SHALL roll back the operation so that no partial User or User_Settings record is persisted, and return an error indicating that the account could not be provisioned.

### Requirement 5: Database Access Through Drizzle ORM

**User Story:** As an engineer, I want all database access to go through Drizzle ORM over a pooled Neon connection, so that queries are type-safe, parameterized, and compatible with the serverless deployment.

#### Acceptance Criteria

1. THE Data_Layer SHALL be accessed exclusively through Drizzle_ORM, such that no query reaches Neon_DB without passing through Drizzle_ORM.
2. THE Data_Layer SHALL execute all queries as parameterized queries via Drizzle_ORM, with no caller-supplied value concatenated directly into a query string.
3. WHEN the Trace_App initializes its database access, THE Trace_App SHALL connect to Neon_DB using a pooled connection configured with a maximum pool size between 1 and 20 connections and an idle-connection timeout of no more than 30 seconds.
4. THE Trace_App SHALL read the Neon_DB connection string from an environment variable.
5. IF the Neon_DB connection-string environment variable is missing or empty, THEN THE Trace_App SHALL abort database initialization and emit an error indicating the missing configuration, without exposing any partial credential value.
6. IF a connection to Neon_DB cannot be established within 10 seconds, THEN THE Trace_App SHALL return an error to the caller indicating a connection failure, without exposing the raw connection string or credentials.
7. IF a Data_Layer query fails, THEN THE Trace_App SHALL return an error to the caller indicating query failure, leave persistent data unchanged, and omit the raw connection string and credentials from the error.

### Requirement 6: Core Data Schema

**User Story:** As an engineer, I want the core user tables and scaffolding for future tables defined with consistent conventions, so that later modules can extend the schema without rework.

#### Acceptance Criteria

1. THE Data_Layer SHALL define the `users`, `user_settings`, and `sessions` tables.
2. THE Data_Layer SHALL define schema scaffolding for exactly these six tables to be populated by later specs: `progress`, `notes`, `bookmarks`, `revision_queue`, `revision_history`, and `analytics_daily`.
3. THE Data_Layer SHALL assign each defined table a single primary key column whose value is a UUID that is non-null and unique across all rows of that table.
4. WHEN a row is inserted into any defined Data_Layer table, THE Data_Layer SHALL set both the `createdAt` and `updatedAt` columns of that row to the current UTC timestamp.
5. WHEN an existing row in any defined Data_Layer table is modified, THE Data_Layer SHALL set the `updatedAt` column of that row to the current UTC timestamp and SHALL leave the `createdAt` column unchanged.
6. WHERE a Data_Layer table references educational content, THE Data_Layer SHALL store only the Sanity_CMS document identifier and SHALL NOT store a copy of the referenced content.
7. IF a write to a Data_Layer table supplies a Sanity_CMS document identifier that does not correspond to an existing Sanity_CMS document, THEN THE Data_Layer SHALL reject the write, return an error indicating an invalid content reference, and leave the target table unchanged.

### Requirement 7: Content Client Configuration

**User Story:** As an engineer, I want a configured Sanity content client with typed query utilities and a health check, so that later modules can fetch educational content through a consistent interface.

#### Acceptance Criteria

1. THE Content_Client SHALL be configured to connect to Sanity_CMS using configuration values read from environment variables.
2. IF one or more required configuration values are missing or empty when the Content_Client is initialized, THEN THE Content_Client SHALL fail initialization and return an error indicating which configuration value is missing.
3. THE Content_Client SHALL expose typed GROQ query utilities for issuing content queries.
4. THE Content_Client SHALL provide a health-check query that verifies connectivity to Sanity_CMS.
5. WHEN the health-check query completes successfully within 5 seconds, THE Content_Client SHALL return a result indicating that Sanity_CMS is reachable.
6. IF the health-check query returns an error or does not complete within 5 seconds, THEN THE Content_Client SHALL return an error indicating that Sanity_CMS is not reachable while retaining the existing configuration.

### Requirement 8: Content and Data Source Separation

**User Story:** As a product owner, I want educational content and user data kept in their designated systems, so that the platform maintains a clean and consistent data architecture.

#### Acceptance Criteria

1. THE Trace_App SHALL retrieve educational content exclusively from Sanity_CMS and from no other source.
2. THE Trace_App SHALL store user-specific data exclusively in Neon_DB and in no other persistent store.
3. THE Trace_App SHALL NOT contain educational content values embedded directly within Dashboard or Protected_Route source code, such that all displayed educational content originates from Sanity_CMS at runtime.
4. WHERE a Dashboard_Widget displays progress-type data, THE Trace_App SHALL source that data from Neon_DB and from no other source.
5. WHERE a Dashboard_Widget displays announcements or educational content, THE Trace_App SHALL source that data from Sanity_CMS and from no other source.
6. IF Sanity_CMS is unavailable when the Trace_App attempts to retrieve educational content, THEN THE Trace_App SHALL display an error indication to the user and SHALL NOT render any hardcoded or placeholder educational content in its place.
7. IF a write of user-specific data to Neon_DB fails, THEN THE Trace_App SHALL return an error indication to the caller and SHALL preserve the prior stored state without partial writes.
8. IF the designated data source for a Dashboard_Widget is unavailable, THEN THE Trace_App SHALL display an error or empty-state indication in that widget and SHALL NOT substitute data from any other source.

### Requirement 9: Authenticated Dashboard and App Shell

**User Story:** As an authenticated user, I want a dashboard home wrapped in a persistent navigation shell, so that I have a consistent place to start and to move between areas of the app.

#### Acceptance Criteria

1. WHEN an authenticated User reaches the post-sign-in destination, THE Trace_App SHALL render the Dashboard as the home route within 3 seconds of the destination being reached.
2. WHILE the viewport width is greater than or equal to 1024 pixels, THE App_Shell SHALL present a persistent sidebar navigation that remains visible without User interaction.
3. WHILE the viewport width is between 768 pixels and 1023 pixels inclusive, THE App_Shell SHALL present the sidebar navigation in a collapsible form that toggles between expanded and collapsed states in response to a User toggle action.
4. WHILE the viewport width is less than 768 pixels, THE App_Shell SHALL present navigation as a bottom navigation bar anchored to the bottom edge of the viewport.
5. WHEN the Dashboard is rendered, THE Dashboard SHALL display each of the following eight widgets as a loadable placeholder: Continue Learning, Daily Goal, Streak, Revision Queue, Recent Notes, Bookmarks, Activity Graph, and Announcements.
6. WHILE a Dashboard_Widget is awaiting its data source, THE Dashboard SHALL display a loading placeholder for that Dashboard_Widget.
7. IF a Dashboard_Widget's data source fails to return data within 10 seconds or returns an error, THEN THE Dashboard SHALL replace that Dashboard_Widget's loading placeholder with an error indication for that Dashboard_Widget while continuing to render the App_Shell and all other widgets.

### Requirement 10: Rendering and Interactivity Strategy

**User Story:** As an engineer, I want server rendering by default with client interactivity only where needed, so that the application ships minimal client JavaScript.

#### Acceptance Criteria

1. THE Trace_App SHALL render all routes as Server Components by default, such that a route is implemented as a Client Component only where at least one of the qualifying interactivity conditions in criterion 3 is met.
2. WHERE a component requires client-side interactivity, THE Trace_App SHALL implement that component as a Client Component and SHALL scope the Client Component boundary to only the subtree that requires interactivity, keeping non-interactive ancestors and siblings as Server Components.
3. THE Trace_App SHALL classify a component as requiring client-side interactivity only IF it meets at least one of the following observable conditions: it registers user-input event handlers, it manages local component state that changes after initial render, it uses lifecycle or effect hooks, or it accesses browser-only APIs.
4. IF a component is implemented as a Client Component but meets none of the conditions in criterion 3, THEN THE Trace_App SHALL be treated as non-compliant, and a build-time or lint check SHALL report a violation identifying the component.
5. WHEN a route is rendered without triggering any condition in criterion 3, THE Trace_App SHALL ship zero component-level client JavaScript for that route beyond the framework runtime.

### Requirement 11: Input Validation and Secret Handling

**User Story:** As a security-conscious product owner, I want all inputs validated and all secrets kept in environment variables, so that the application resists invalid input and credential exposure.

#### Acceptance Criteria

1. WHEN input crosses a trust boundary into a server-side action, THE Input_Validator SHALL validate every field of that input against the defined schema for that action before the Trace_App processes it.
2. IF input fails schema validation, THEN THE Trace_App SHALL reject the request without processing any part of the input, SHALL return a validation error response identifying which field(s) failed, and SHALL leave all persisted application state unchanged.
3. THE Trace_App SHALL read all secrets and credentials exclusively from environment variables.
4. THE Trace_App SHALL exclude secrets and credentials from source code and from version control.
5. IF a required secret or credential is absent from the environment variables when the Trace_App starts, THEN THE Trace_App SHALL halt startup and SHALL emit an error indicating which required environment variable is missing.
6. THE Trace_App SHALL exclude secret and credential values from all error responses, logs, and diagnostic output.

### Requirement 12: Accessibility

**User Story:** As a user who relies on assistive technology, I want the authenticated app to meet accessibility standards, so that I can navigate and use it effectively.

#### Acceptance Criteria

1. THE Trace_App SHALL make every function that is achievable with a pointer also achievable using keyboard input alone, without trapping keyboard focus on any control.
2. WHEN an interactive control receives keyboard focus, THE Trace_App SHALL display a focus indicator with a contrast ratio of at least 3:1 against adjacent colors.
3. THE Trace_App SHALL use semantic HTML elements for structural and interactive content, such that each interactive control exposes a programmatically determinable name, role, and state.
4. WHERE a User has enabled reduced-motion preferences, THE Trace_App SHALL suppress all animation, transition, and auto-playing motion that is not required to convey information or complete a task.
5. THE Trace_App SHALL meet a text-to-background contrast ratio of at least 4.5:1 for normal-sized text and at least 3:1 for large-scale text (18pt, or 14pt bold, or larger), consistent with WCAG 2.1 AA.
6. WHERE an image is non-decorative or a control is icon-only, THE Trace_App SHALL provide a programmatically associated text alternative describing its purpose.
7. THE Trace_App SHALL meet a contrast ratio of at least 3:1 for user interface components and meaningful graphical objects against adjacent colors.

### Requirement 13: Responsive Layout

**User Story:** As a user on any device, I want the dashboard to work across screen sizes, so that I can prepare on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 pixels or greater, THE Trace_App SHALL render the Dashboard and App_Shell in the desktop layout.
2. WHILE the viewport width is from 768 pixels to 1023 pixels inclusive, THE Trace_App SHALL render the Dashboard and App_Shell in the tablet layout.
3. WHILE the viewport width is 767 pixels or less (down to a minimum supported width of 320 pixels), THE Trace_App SHALL render the Dashboard and App_Shell in the mobile layout.
4. WHEN the viewport width changes across a breakpoint boundary (767/768 pixels or 1023/1024 pixels), THE Trace_App SHALL switch the Dashboard and App_Shell to the layout defined for the new viewport width range.
5. WHILE any of the desktop, tablet, or mobile layouts is active, THE Trace_App SHALL render all Dashboard content and every navigation item within the viewport width without requiring horizontal scrolling.
6. WHILE any of the desktop, tablet, or mobile layouts is active, THE Trace_App SHALL keep every App_Shell navigation item visible or reachable through a persistent navigation control, and SHALL make each navigation item operable via pointer and keyboard input.

### Requirement 14: Environment Configuration and Deployment

**User Story:** As an engineer deploying to Vercel, I want required configuration defined consistently across local and hosted environments, so that the application runs correctly in the serverless deployment.

#### Acceptance Criteria

1. THE Trace_App SHALL obtain all runtime configuration values exclusively from environment variables, without using hardcoded fallback values for any required variable.
2. THE Trace_App SHALL define an identical set of required environment variable names, documented by name, for both the local `.env.local` file and the Vercel environment.
3. WHEN the Trace_App starts, THE Trace_App SHALL validate the presence of every required environment variable before accepting any incoming request.
4. IF one or more required environment variables are missing at startup, THEN THE Trace_App SHALL abort startup, refuse to serve requests, and produce an error that lists every missing variable by name.
5. IF a required environment variable is present but its value fails format validation for that variable, THEN THE Trace_App SHALL abort startup and produce an error identifying the invalid variable by name.
6. WHILE running within the Vercel serverless runtime, THE Trace_App SHALL access Neon_DB through the Neon_DB pooled connection endpoint.
