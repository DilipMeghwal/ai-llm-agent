# Test Cases — Accounts API

---

## TC-001: Successful deposit into an active account

**Jira Story:** ACC-101
**Epic:** Account Balance Management
**Type:** 🔥 Smoke | **Priority:** P0

**As an** account holder
**I want** to deposit funds into my account
**So that** my available balance increases by the deposited amount

**Preconditions:**

- An active user account exists with a known starting balance
- User is authenticated with valid authorization credentials

**Test Steps:**

| Step | Action                                                              | Expected Result                                                           |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | Send a `POST` request to deposit a positive amount into the account | HTTP `200 OK` status is returned                                          |
| 2    | Verify the response payload                                         | The returned balance equals the initial balance plus the deposited amount |
| 3    | Retrieve account details via `GET` request                          | Account balance matches the updated balance from Step 2                   |

**Test Data:** Deposit Amount: `100.00`

**Acceptance Criteria:**

- [ ] Response returns HTTP `200 OK` status
- [ ] Account balance is updated arithmetically by the exact deposit amount
- [ ] Account state remains consistent on subsequent retrieval

**Automation Reference:** `tests/accounts.spec.ts` (`@smoke`)
**Status:** ✅ Automated

---

## TC-002: Deposit rejected for a negative amount

**Jira Story:** ACC-102
**Epic:** Account Balance Management
**Type:** 🔁 Regression | **Priority:** P1

**As an** API consumer
**I want** the API to reject a negative deposit amount
**So that** account balances cannot be corrupted by invalid input

**Preconditions:**

- An active user account exists
- User is authenticated with valid authorization credentials

**Test Steps:**

| Step | Action                                                              | Expected Result                                              |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | Send a `POST` request to deposit a negative amount into the account | HTTP `422 Unprocessable Entity` status is returned           |
| 2    | Inspect the error response payload                                  | Error message explicitly identifies the invalid amount field |
| 3    | Retrieve account details via `GET` request                          | Account balance remains unchanged                            |

**Test Data:** Invalid Deposit Amount: `-50.00`

**Acceptance Criteria:**

- [ ] Response returns HTTP `422 Unprocessable Entity` status
- [ ] Error message specifically references the invalid input field
- [ ] Account balance is unchanged

**Automation Reference:** `tests/accounts.spec.ts` (`@regression`)
**Status:** ✅ Automated

---

## TC-003: Deposit and withdrawal account lifecycle

**Jira Story:** ACC-110
**Epic:** Account Balance Management
**Type:** 🔗 Integration | **Priority:** P1

**As a** backend service consumer
**I want** deposit and withdrawal operations to compose correctly on the same account
**So that** account balances remain consistent across sequential transactions

**Preconditions:**

- User is authenticated with valid authorization credentials

**Test Steps:**

| Step | Action                                                              | Expected Result                                                    |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1    | Send a `POST` request to create a new account                       | HTTP `201 Created` status is returned and Account ID is captured   |
| 2    | Send a `POST` request to deposit funds into the account             | HTTP `200 OK` status is returned and balance increases             |
| 3    | Send a `POST` request to withdraw a partial amount from the account | HTTP `200 OK` status is returned and balance decreases accordingly |
| 4    | Retrieve account details via `GET` request                          | Account balance matches the net calculated total                   |
| 5    | Send a `DELETE` request to clean up the account                     | HTTP `204 No Content` status is returned                           |

**Test Data:** Initial Deposit: `200.00`, Withdrawal: `75.00`, Expected Final Balance: `125.00`

**Acceptance Criteria:**

- [ ] Every transaction step completes with its designated success status code
- [ ] Account balance updates correctly across sequential operations
- [ ] Created test account is deleted upon test completion

**Automation Reference:** `tests/accounts.spec.ts` (`@integration`)
**Status:** ✅ Automated

---

## TC-004: Unauthorized deposit attempt on another user's account (IDOR)

**Jira Story:** ACC-115
**Epic:** Account Security
**Type:** 🛡️ Security | **Priority:** P0

**As a** platform operator
**I want** to prevent users from modifying accounts owned by other users
**So that** account balances cannot be tampered with by unauthorized parties

**Preconditions:**

- Account A exists, owned by User A
- User B is authenticated with distinct user credentials

**Test Steps:**

| Step | Action                                                    | Expected Result                         |
| ---- | --------------------------------------------------------- | --------------------------------------- |
| 1    | User B sends a `POST` deposit request targeting Account A | HTTP `403 Forbidden` status is returned |
| 2    | User A retrieves account details via `GET` request        | Account A balance remains unchanged     |

**Test Data:** Target Account: Account A ID, Acting User: User B Credentials

**Acceptance Criteria:**

- [ ] Response returns HTTP `403 Forbidden` status
- [ ] Target account balance is provably unaffected by the unauthorized request

**Automation Reference:** `tests/accounts.spec.ts` (`@security`)
**Status:** ✅ Automated

---

## TC-005: New user account onboarding and transaction history

**Jira Story:** ACC-201
**Epic:** Customer Onboarding
**Type:** 🧭 E2E | **Priority:** P2

**As a** new customer
**I want** to register an account, open a bank account, make a deposit, and view transaction history
**So that** the full onboarding journey works seamlessly end to end

**Preconditions:**

- Unregistered user credentials

**Test Steps:**

| Step | Action                                                      | Expected Result                                         |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------- |
| 1    | Send a `POST` request to register a new user                | HTTP `201 Created` status and auth credentials returned |
| 2    | Send a `POST` request to open a new bank account            | HTTP `201 Created` status and Account ID returned       |
| 3    | Send a `POST` request to deposit funds into the new account | HTTP `200 OK` status returned with updated balance      |
| 4    | Send a `GET` request to view account transaction history    | Returned list contains the deposit transaction details  |

**Test Data:** User Details: Unique Registration Payload, Deposit Amount: `500.00`

**Acceptance Criteria:**

- [ ] Every onboarding and banking step returns expected status codes
- [ ] Transaction history accurately reflects the performed deposit
- [ ] Test data is unique per execution to prevent environment collisions

**Automation Reference:** `tests/accounts.spec.ts` (`@e2e`)
**Status:** ✅ Automated

---

## Legend

| Symbol          | Meaning                                   |
| --------------- | ----------------------------------------- |
| ✅ Automated    | Test is implemented and passing           |
| ⚠️ Unresolved   | Failure requires investigation or fix     |
| 🔴 Needs update | Spec contract change requires test update |
| 📝 Planned      | Approved in plan, pending automation      |
