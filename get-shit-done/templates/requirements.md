# Requirements Template

Template for `.planning/REQUIREMENTS.md` — checkable requirements that define "done."

<template>

```markdown
# Requirements: [Project Name]

**Defined:** [date]
**Core Value:** [from PROJECT.md]

## Active Requirements

Requirements for current milestone. Each maps to roadmap features.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh

### [Category 2]

- [ ] **[CAT]-01**: [Requirement description]
- [ ] **[CAT]-02**: [Requirement description]
- [ ] **[CAT]-03**: [Requirement description]

### [Category 3]

- [ ] **[CAT]-01**: [Requirement description]
- [ ] **[CAT]-02**: [Requirement description]

## Deferred Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### [Category]

- **[CAT]-01**: [Requirement description]
- **[CAT]-02**: [Requirement description]

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| [Feature] | [Why excluded] |
| [Feature] | [Why excluded] |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Feature | Status |
|-------------|---------|--------|
| AUTH-01 | Authentication | Pending |
| AUTH-02 | Authentication | Pending |
| AUTH-03 | Authentication | Pending |
| AUTH-04 | Authentication | Pending |
| [REQ-ID] | [Feature Name] | Pending |

**Coverage:**
- Active requirements: [X] total
- Mapped to features: [Y]
- Unmapped: [Z] ⚠️

---
*Requirements defined: [date]*
*Last updated: [date] after [trigger]*
```

</template>

<guidelines>

**Requirement Format:**
- ID: `[CATEGORY]-[NUMBER]` (AUTH-01, CONTENT-02, SOCIAL-03)
- Description: User-centric, testable, atomic
- Checkbox: Only for v1 requirements (v2 are not yet actionable)

**Categories:**
- Derive requirements from discovery brief and feature definition
- Keep consistent with domain conventions
- Typical: Authentication, Content, Social, Notifications, Moderation, Payments, Admin

**Active vs Deferred:**
- Active: Committed scope, mapped in roadmap
- Deferred: Acknowledged but deferred, not in current roadmap
- Moving Deferred → Active requires roadmap update

**Out of Scope:**
- Explicit exclusions with reasoning
- Prevents "why didn't you include X?" later
- Anti-features from research belong here with warnings

**Traceability:**
- Empty initially, populated during roadmap creation
- Each requirement maps to at least one feature
- Unmapped requirements = roadmap gap

**Status Values:**
- Pending: Not started
- In Progress: Phase is active
- Complete: Requirement verified
- Blocked: Waiting on external factor

</guidelines>

<evolution>

**After each feature completes:**
1. Mark covered requirements as Complete
2. Update traceability status
3. Note any requirements that changed scope

**After roadmap updates:**
1. Verify all active requirements still mapped
2. Add new requirements if scope expanded
3. Move requirements to deferred/out of scope if descoped

**Requirement completion criteria:**
- Requirement is "Complete" when:
  - Feature is implemented
  - Feature is verified (tests pass, manual check done)
  - Feature is committed

</evolution>

<example>

```markdown
# Requirements: CommunityApp

**Defined:** 2025-01-14
**Core Value:** Users can share and discuss content with people who share their interests

## Active Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh

### Profiles

- [ ] **PROF-01**: User can create profile with display name
- [ ] **PROF-02**: User can upload avatar image
- [ ] **PROF-03**: User can write bio (max 500 chars)
- [ ] **PROF-04**: User can view other users' profiles

### Content

- [ ] **CONT-01**: User can create text post
- [ ] **CONT-02**: User can upload image with post
- [ ] **CONT-03**: User can edit own posts
- [ ] **CONT-04**: User can delete own posts
- [ ] **CONT-05**: User can view feed of posts

### Social

- [ ] **SOCL-01**: User can follow other users
- [ ] **SOCL-02**: User can unfollow users
- [ ] **SOCL-03**: User can like posts
- [ ] **SOCL-04**: User can comment on posts
- [ ] **SOCL-05**: User can view activity feed (followed users' posts)

## Deferred Requirements

### Notifications

- **NOTF-01**: User receives in-app notifications
- **NOTF-02**: User receives email for new followers
- **NOTF-03**: User receives email for comments on own posts
- **NOTF-04**: User can configure notification preferences

### Moderation

- **MODR-01**: User can report content
- **MODR-02**: User can block other users
- **MODR-03**: Admin can view reported content
- **MODR-04**: Admin can remove content
- **MODR-05**: Admin can ban users

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to community value |
| Video posts | Storage/bandwidth costs, defer to v2+ |
| OAuth login | Email/password sufficient for v1 |
| Mobile app | Web-first, mobile later |

## Traceability

| Requirement | Feature | Status |
|-------------|---------|--------|
| AUTH-01 | Authentication | Pending |
| AUTH-02 | Authentication | Pending |
| AUTH-03 | Authentication | Pending |
| AUTH-04 | Authentication | Pending |
| PROF-01 | Profiles | Pending |
| PROF-02 | Profiles | Pending |
| PROF-03 | Profiles | Pending |
| PROF-04 | Profiles | Pending |
| CONT-01 | Content | Pending |
| CONT-02 | Content | Pending |
| CONT-03 | Content | Pending |
| CONT-04 | Content | Pending |
| CONT-05 | Content | Pending |
| SOCL-01 | Social | Pending |
| SOCL-02 | Social | Pending |
| SOCL-03 | Social | Pending |
| SOCL-04 | Social | Pending |
| SOCL-05 | Social | Pending |

**Coverage:**
- Active requirements: 18 total
- Mapped to features: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-14*
*Last updated: 2025-01-14 after initial definition*
```

</example>
