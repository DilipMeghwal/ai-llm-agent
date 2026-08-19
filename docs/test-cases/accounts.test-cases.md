# Test Cases — Accounts API

> Companion doc to `src/tests/accounts.spec.ts`. Auto-generated/updated by `playwright-generator` from the approved Planner test plan; kept in sync by `playwright-healer` (Status field) and `contract-diff-analyzer` (flags on contract changes). Do not hand-edit the Automation Reference lines — they must match the actual test titles for traceability.

---

## TC-001: Successful deposit into an active account

**Jira Story:** ACC-101
**Epic:** Account Balance Management
**Type:** 🔥 Smoke | **Priority:** P0

**As a** account holder
**I want** to deposit funds into my account
**So that** my available balance increases by the deposited amount

**Preconditions:**
- An active account exists with a known starting balance (via `userClient` fixture, seeded by `buildAccount()` factory)

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | `POST /accounts/{id}/deposit` with `{ amount: 100 }` | `200 OK` |
| 2 | Inspect response body | `newBalance` equals `startingBalance + 100` exactly |
| 3 | `GET /accounts/{id}` | Returned `balance` matches the deposit response's `newBalance` |

**Test Data:** `amount: 100` (positive integer, well within account limits)

**Acceptance Criteria:**
- [ ] Response status is exactly `200` (not a range)
- [ ] Response matches the `DepositResponse` JSON Schema
- [ ] `newBalance` is arithmetically correct, not just present
- [ ] Follow-up `GET` confirms the balance persisted

**Automation Reference:** `src/tests/accounts.spec.ts` → `POST /deposit - should deposit funds and increase balance by exact amount` (`@smoke`)
**Status:** ✅ Automated

---

## TC-002: Deposit rejected for a negative amount

**Jira Story:** ACC-102
**Epic:** Account Balance Management
**Type:** 🔁 Regression | **Priority:** P1

**As an** API consumer
**I want** the API to reject a negative deposit amount
**So that** account balances can never be corrupted by invalid input

**Preconditions:**
- An active account exists

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | `POST /accounts/{id}/deposit` with `{ amount: -50 }` | `422 Unprocessable Entity` |
| 2 | Inspect error body | Error array contains an entry for field `amount` mentioning it must be positive |
| 3 | `GET /accounts/{id}` | Balance is unchanged from before step 1 |

**Test Data:** `amount: -50`

**Acceptance Criteria:**
- [ ] Status is exactly `422`, not a hedged range
- [ ] Error message specifically references the `amount` field
- [ ] Balance is provably unchanged (not just "no error thrown")

**Automation Reference:** `src/tests/accounts.spec.ts` → `POST /deposit - should reject negative amount with field-specific error` (`@regression`)
**Status:** ✅ Automated

---

## TC-003: Deposit → balance check → withdrawal lifecycle

**Jira Story:** ACC-110
**Epic:** Account Balance Management
**Type:** 🔗 Integration | **Priority:** P1

**As a** backend service consumer
**I want** deposit and withdrawal to correctly compose against the same account
**So that** the balance is always consistent across sequential operations

**Preconditions:**
- A freshly created account with a `0` starting balance (created within this test, not shared)

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | `POST /accounts` (create account) | `201 Created`; account ID captured for later steps |
| 2 | `POST /accounts/{id}/deposit` with `{ amount: 200 }` | `200 OK`; `newBalance = 200` |
| 3 | `POST /accounts/{id}/withdraw` with `{ amount: 75 }` | `200 OK`; `newBalance = 125` |
| 4 | `GET /accounts/{id}` | `balance = 125`, matching the last operation exactly |
| 5 | `DELETE /accounts/{id}` (cleanup) | `204 No Content` |

**Test Data:** Deposit `200`, withdraw `75` — expect final balance `125`

**Acceptance Criteria:**
- [ ] Steps run in strict order via `test.describe.serial()` sharing the created account ID
- [ ] Balance arithmetic is correct at every step, not just status codes
- [ ] Account is deleted at the end — no orphaned test data left behind

**Automation Reference:** `src/tests/accounts.spec.ts` → `describe.serial('Deposit → withdraw lifecycle')` (`@integration`)
**Status:** ✅ Automated

---

## TC-004: User cannot deposit into another user's account (IDOR)

**Jira Story:** ACC-115
**Epic:** Account Security
**Type:** 🛡️ Security | **Priority:** P0

**As a** platform operator
**I want** to prevent one user from modifying another user's account
**So that** account balances can't be tampered with by unauthorized users

**Preconditions:**
- Account A exists, owned by User A
- User B has a valid, separately-authenticated session (via `userClient` fixture with a second identity)

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | User B calls `POST /accounts/{accountA_id}/deposit` with `{ amount: 100 }` | `403 Forbidden` (per documented API behavior) |
| 2 | User A calls `GET /accounts/{accountA_id}` | Balance is unchanged — confirms the attempted deposit had no effect |

**Test Data:** Two distinct authenticated identities (User A owner, User B attacker)

**Acceptance Criteria:**
- [ ] Status is exactly `403`, matching documented IDOR-prevention behavior
- [ ] Account A's balance is provably unaffected by the attempted cross-user deposit

**Automation Reference:** `src/tests/accounts.spec.ts` → `POST /deposit - should reject deposit attempt from non-owner (IDOR)` (`@security`)
**Status:** ✅ Automated

---

## TC-005: New user opens account, deposits, and views transaction history

**Jira Story:** ACC-201
**Epic:** New Customer Onboarding
**Type:** 🧭 E2E | **Priority:** P2

**As a** new customer
**I want** to sign up, open an account, deposit funds, and see my transaction reflected
**So that** the full onboarding-to-first-transaction journey works end to end

**Preconditions:** None — this test creates its own user from scratch

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | `POST /auth/register` with new user details | `201 Created`; JWT returned |
| 2 | `POST /accounts` (using the new token) | `201 Created`; account ID captured |
| 3 | `POST /accounts/{id}/deposit` with `{ amount: 500 }` | `200 OK`; `newBalance = 500` |
| 4 | `GET /accounts/{id}/transactions` | Returned list includes exactly one transaction of type `deposit`, amount `500` |

**Test Data:** Faker-generated unique user (worker/run-suffixed email), deposit `500`

**Acceptance Criteria:**
- [ ] Every step's status is exact, not hedged
- [ ] The transaction history entry's amount matches the deposit exactly (field-value assertion, not just array length)
- [ ] Test data is unique per run — safe under parallel execution

**Automation Reference:** `src/tests/accounts.spec.ts` → `describe.serial('New customer onboarding to first deposit')` (`@e2e`)
**Status:** ✅ Automated

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ Automated | Test is implemented and passing |
| ⚠️ Unresolved | Healer could not fix within its 3-attempt budget — see `test-results/unresolved.md` |
| 🔴 Needs update | Flagged by `contract-diff-analyzer` as affected by a breaking spec change |
| 📝 Planned | Approved in the plan but not yet generated |
