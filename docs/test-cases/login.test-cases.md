# Test Cases: Customer Login API (`GET /login/{username}/{password}`)

## TC-001: Valid User Login via Path Parameters

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** 🔥 Smoke | **Priority:** P1

**As a** registered customer  
**I want** to authenticate via username and password path parameters  
**So that** I can receive my customer profile details and access my account

**Preconditions:**

- Customer `john` exists with password `demo`

**Test Steps:**

| Step | Action                                   | Expected Result                                                 |
| ---- | ---------------------------------------- | --------------------------------------------------------------- |
| 1    | Send `GET` request to `/login/john/demo` | HTTP `200 OK` status returned with valid Customer JSON response |

**Test Data:** Username: `john`, Password: `demo`

**Acceptance Criteria:**

- [ ] Returns HTTP 200 OK
- [ ] Response matches Customer JSON schema
- [ ] `firstName` field equals "John"

**Automation Reference:** `tests/login.spec.ts` (`@smoke`)  
**Status:** ✅ Automated

---

## TC-002: Login Endpoint Sanity Check

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** ⚡ Sanity | **Priority:** P2

**Preconditions:**

- ParaBank service available

**Test Steps:**

| Step | Action                                   | Expected Result               |
| ---- | ---------------------------------------- | ----------------------------- |
| 1    | Send `GET` request to `/login/john/demo` | HTTP `200 OK` status returned |

**Automation Reference:** `tests/login.spec.ts` (`@sanity`)  
**Status:** ✅ Automated

---

## TC-003: Login with Invalid Password

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** 🧪 Regression | **Priority:** P2

**Preconditions:**

- Customer `john` exists

**Test Steps:**

| Step | Action                                             | Expected Result                                                                |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1    | Send `GET` request to `/login/john/wrong_password` | HTTP `401 Unauthorized` / `400 Bad Request` status returned with error message |

**Automation Reference:** `tests/login.spec.ts` (`@regression`)  
**Status:** ✅ Automated

---

## TC-004: Login with Non-Existent Username

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** 🧪 Regression | **Priority:** P2

**Test Steps:**

| Step | Action                                                    | Expected Result                                           |
| ---- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1    | Send `GET` request to `/login/non_existent_user_999/demo` | HTTP `404 Not Found` / `401 Unauthorized` status returned |

**Automation Reference:** `tests/login.spec.ts` (`@regression`)  
**Status:** ✅ Automated

---

## TC-005: Security SQL Injection Boundary Test

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** 🛡️ Security | **Priority:** P1

**Test Steps:**

| Step | Action                                                                  | Expected Result                                                               |
| ---- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Send `GET` request with SQL injection string in username path parameter | HTTP 4xx error returned safely without 500 internal server error or data leak |

**Automation Reference:** `tests/login.spec.ts` (`@security`)  
**Status:** ✅ Automated

---

## TC-006: Login & Customer Profile Retrieval Integration Flow

**Jira Story:** PARA-101  
**Epic:** Misc Operations  
**Type:** 🔗 Integration | **Priority:** P1

**Test Steps:**

| Step | Action                                      | Expected Result                                      |
| ---- | ------------------------------------------- | ---------------------------------------------------- |
| 1    | Send `GET` request to `/login/john/demo`    | HTTP `200 OK` status with Customer ID returned       |
| 2    | Verify Customer ID against customer records | Customer ID matches expected customer record (12212) |

**Automation Reference:** `tests/login.spec.ts` (`@integration`)  
**Status:** ✅ Automated
