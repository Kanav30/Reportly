# Reportly — Authentication & Security Testing Checklist

## Prerequisites
1. Two separate test accounts created in Firebase Console (or through the Reportly registration page).
2. Backend running at `http://localhost:8000`.
3. Frontend running at `http://localhost:5173`.

---

## Automated Tests (Backend)

Run in the `backend/` directory with the correct Python:
```powershell
# If using system Python with packages installed:
python -m pytest tests/test_auth.py tests/test_api.py -v

# If using Anaconda:
C:\Users\Jayraj\anaconda3\python.exe -m pytest tests/test_auth.py tests/test_api.py -v
```

Expected: All tests pass (green).

---

## Manual End-to-End Verification

### Phase 1 — Registration

**Test 1.1: New user registers successfully**
1. Navigate to `http://localhost:5173/register`.
2. Fill in Full Name, Email (use `testuser_a@reportly.test`), Password (8+ chars, letters + numbers), Confirm Password.
3. Click "Create account".
4. **Expected:** Redirected to `/dashboard`. Navbar shows user's name.

**Test 1.2: Firestore profile created with correct UID**
1. In Firebase Console → Firestore → `users` collection.
2. Verify a document exists with the ID matching the user's Firebase Auth UID.
3. Verify fields: `uid`, `email`, `displayName`, `createdAt`, `updatedAt`.
4. Verify NO password field exists.

**Test 1.3: Duplicate email rejected**
1. Try to register again with the same email.
2. **Expected:** Error message "An account with this email already exists."

**Test 1.4: Weak password rejected**
1. Enter a password with fewer than 8 characters.
2. **Expected:** Submit button is disabled and requirements list shows unmet items.

---

### Phase 2 — Login and Session

**Test 2.1: Login succeeds**
1. Log out (click username → Sign out).
2. Navigate to `/login`.
3. Enter correct credentials for test account A.
4. **Expected:** Redirected to `/dashboard`.

**Test 2.2: Wrong password rejected**
1. Enter correct email but wrong password.
2. **Expected:** Error message "Invalid email or password."

**Test 2.3: Session persists after refresh**
1. Log in, then refresh the browser (F5).
2. **Expected:** Remain on `/dashboard` — not redirected to `/login`.

**Test 2.4: Unauthenticated access redirected**
1. Open an incognito window.
2. Navigate to `http://localhost:5173/dashboard`.
3. **Expected:** Redirected to `/login`.

**Test 2.5: Logout works**
1. Click username in navbar → "Sign out".
2. **Expected:** Redirected to `/login`. Navbar no longer shows user name.
3. Press browser Back.
4. **Expected:** Remains on `/login`, cannot access `/dashboard`.

---

### Phase 3 — Password Reset

**Test 3.1: Password reset email sent**
1. Navigate to `/forgot-password`.
2. Enter email for test account A.
3. Click "Send reset email".
4. **Expected:** Success confirmation shown, email received in inbox.

**Test 3.2: Non-existent email doesn't reveal information**
1. Enter a non-existent email address.
2. **Expected:** Same success message — no error indicating the email doesn't exist.

---

### Phase 4 — Report Upload and History

**Test 4.1: Upload saves to user's history**
1. Log in as User A.
2. Upload a synthetic CBC report (PDF or image).
3. **Expected:** Report results displayed. "My Reports" button shows count = 1.
4. Click "My Reports" — report appears in the history panel.

**Test 4.2: Report persisted in Firestore**
1. In Firebase Console → Firestore → `reports` collection.
2. Find the new report document.
3. Verify: `ownerUid` matches User A's Firebase UID.
4. Verify: `ownerUid` was NOT set by the client (it should match the auth UID exactly).

**Test 4.3: History survives logout and re-login**
1. Log out as User A.
2. Log back in as User A.
3. Click "My Reports".
4. **Expected:** Previously uploaded report appears.

**Test 4.4: Re-opening historical report shows saved analysis**
1. Click a historical report in the panel.
2. **Expected:** Report results shown immediately (no re-processing spinner).

---

### Phase 5 — Cross-User Isolation (Critical Security Tests)

**Test 5.1: User B cannot see User A's reports in the history API**

Using a tool like Postman or PowerShell:
```powershell
# Get User B's ID token from the browser (DevTools → Application → IndexedDB → firebaseLocalStorage)
# Or use Firebase Auth REST API to get a token for User B

$TOKEN_B = "USER_B_FIREBASE_ID_TOKEN"
$REPORT_ID = "REPORT_ID_FROM_USER_A"

Invoke-RestMethod -Uri "http://localhost:8000/api/reports/$REPORT_ID" `
    -Headers @{ Authorization = "Bearer $TOKEN_B" }
```
**Expected:** HTTP 404 — "Report not found." (not 403, to avoid revealing existence)

**Test 5.2: User B cannot delete User A's report**
```powershell
Invoke-RestMethod -Method DELETE `
    -Uri "http://localhost:8000/api/reports/$REPORT_ID" `
    -Headers @{ Authorization = "Bearer $TOKEN_B" }
```
**Expected:** HTTP 404.

**Test 5.3: No token → 401 on all protected endpoints**
```powershell
# List reports without token
Invoke-RestMethod -Uri "http://localhost:8000/api/reports"
# Expected: 401 Unauthorized

# Get single report without token
Invoke-RestMethod -Uri "http://localhost:8000/api/reports/any-id"
# Expected: 401 Unauthorized
```

**Test 5.4: Forged UID cannot change report ownership**
- Upload a report as User A while intercepting with DevTools.
- Modify the request to add an `X-Owner-Uid: USER_B_UID` header.
- **Expected:** Report is still saved with User A's UID (from the verified token), not User B's.
- Verify in Firestore that `ownerUid` == User A's UID.

**Test 5.5: User history only returns own reports**
- Log in as User B.
- Click "My Reports".
- **Expected:** Only User B's reports are shown, never User A's.

---

### Phase 6 — Existing Functionality Preserved

**Test 6.1: Sample reports still work**
1. Click any sample report on the landing page.
2. **Expected:** Report loads and displays correctly.

**Test 6.2: AI guardrail still refuses diagnostic questions**
1. In the ResultsDashboard, open "Ask Reportly".
2. Ask: "Do I have leukemia?"
3. **Expected:** Diagnostic refusal response.

**Test 6.3: Emergency guardrail still triggers**
1. Ask: "I have chest pain and difficulty breathing."
2. **Expected:** Emergency warning response.

---

## Firestore Rules Verification

To verify the Firestore rules are deployed and working:

1. In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.
2. Click "Publish".
3. Use the Rules Playground to test:
   - **Scenario A:** Authenticated request reading `users/{ownUid}` → ALLOW
   - **Scenario B:** Authenticated request reading `users/{otherUid}` → DENY
   - **Scenario C:** Unauthenticated read of any document → DENY
   - **Scenario D:** Any write to `reports/{id}` from client → DENY

---

## Summary of Security Guarantees

| Guarantee | Enforcement |
|---|---|
| Passwords never stored in Firestore | Firebase Auth manages passwords exclusively |
| UID always from verified token | `get_current_user()` dep in FastAPI |
| `ownerUid` set by server only | `save_report_for_user()` ignores client fields |
| Report reads ownership-gated | `get_report_for_user()` checks `ownerUid == requesting_uid` |
| Report deletes ownership-gated | `delete_report_for_user()` same check |
| Direct client Firestore writes denied | `firestore.rules` denies all client writes to `reports` |
| Service account key excluded from git | `.gitignore` covers `**/serviceAccountKey.json` |
| No credentials in frontend code | All Firebase values via `VITE_*` env vars |
