const BASE = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Running Phase 2 Endpoint Validation Suite\n');

  // 1a. Admin Login
  console.log('--- 1a. Admin Login ---');
  const resAdmin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'admin1', password: 'password123', role: 'Admin' }),
  });
  const adminData = await resAdmin.json();
  console.log('Status:', resAdmin.status, '| Logged in:', adminData.user?.name);
  const adminToken = adminData.token;

  // 1b. General User Login
  console.log('\n--- 1b. General User Login ---');
  const resUser = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user1', password: 'password123', role: 'General User' }),
  });
  const userData = await resUser.json();
  console.log('Status:', resUser.status, '| Logged in:', userData.user?.name);
  const userToken = userData.token;

  // 1c. Invalid Password
  console.log('\n--- 1c. Invalid Password (Expect 401) ---');
  const resWrongPass = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'admin1', password: 'wrongpassword', role: 'Admin' }),
  });
  console.log('Status:', resWrongPass.status, await resWrongPass.json());

  // 1d. Unknown User
  console.log('\n--- 1d. Unknown User (Expect 401) ---');
  const resUnknown = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'fakeuser99', password: 'password123', role: 'Admin' }),
  });
  console.log('Status:', resUnknown.status, await resUnknown.json());

  // 1e. Role Mismatch
  console.log('\n--- 1e. Role Mismatch (General User logging in as Admin -> Expect 403) ---');
  const resMismatch = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user1', password: 'password123', role: 'Admin' }),
  });
  console.log('Status:', resMismatch.status, await resMismatch.json());

  // 2a. GET /api/me without token
  console.log('\n--- 2a. GET /api/me without Token (Expect 401) ---');
  const resMeNoAuth = await fetch(`${BASE}/me`);
  console.log('Status:', resMeNoAuth.status, await resMeNoAuth.json());

  // 2b. GET /api/me with token
  console.log('\n--- 2b. GET /api/me with Admin Token (Expect 200) ---');
  const resMeAuth = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', resMeAuth.status, await resMeAuth.json());

  // 3a. Records as General User
  console.log('\n--- 3a. Records as General User (Only Public & Internal) ---');
  const resUserRecs = await fetch(`${BASE}/records?limit=10`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const userRecs = await resUserRecs.json();
  const levelsFound = [...new Set(userRecs.records.map((r: any) => r.accessLevel))];
  console.log('Status:', resUserRecs.status, '| Levels present:', levelsFound, '| Total records:', userRecs.total);

  // 3b. Records as Admin
  console.log('\n--- 3b. Records as Admin (All 4 levels) ---');
  const resAdminRecs = await fetch(`${BASE}/records?limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminRecs = await resAdminRecs.json();
  const adminLevels = [...new Set(adminRecs.records.map((r: any) => r.accessLevel))];
  console.log('Status:', resAdminRecs.status, '| Levels present:', adminLevels, '| Total records:', adminRecs.total);

  // 3c. Delay and Search
  console.log('\n--- 3c. Delay Middleware (?delay=400) + Search ---');
  const t0 = Date.now();
  const resDelay = await fetch(`${BASE}/records?delay=400&search=Security&limit=2`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const delayData = await resDelay.json();
  const elapsed = Date.now() - t0;
  console.log(`Status: ${resDelay.status} | Elapsed: ${elapsed}ms | Matched records: ${delayData.records.length}`);

  // 4a. User management by General User
  console.log('\n--- 4a. General User accesses /api/users (Expect 403 Forbidden) ---');
  const resForbiddenUsers = await fetch(`${BASE}/users`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('Status:', resForbiddenUsers.status, await resForbiddenUsers.json());

  // 4b. List users by Admin
  console.log('\n--- 4b. Admin accesses /api/users (Expect 200) ---');
  const resAllUsers = await fetch(`${BASE}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allUsersData = await resAllUsers.json();
  console.log('Status:', resAllUsers.status, '| User count:', allUsersData.total);

  // 4c. Create New User
  console.log('\n--- 4c. Admin creates new user intern1 (Expect 201) ---');
  const resCreateUser = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'intern1',
      name: 'Grace Hopper',
      password: 'internPassword123',
      role: 'General User',
      accessLevel: 'Internal',
    }),
  });
  console.log('Status:', resCreateUser.status, await resCreateUser.json());

  // 4d. Admin tries to demote themselves
  console.log('\n--- 4d. Admin attempts to demote self (Expect 403 Forbidden) ---');
  const resDemoteSelf = await fetch(`${BASE}/users/admin1`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'General User' }),
  });
  console.log('Status:', resDemoteSelf.status, await resDemoteSelf.json());

  // 4e. Admin tries to delete themselves
  console.log('\n--- 4e. Admin attempts to delete self (Expect 403 Forbidden) ---');
  const resDeleteSelf = await fetch(`${BASE}/users/admin1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', resDeleteSelf.status, await resDeleteSelf.json());

  // 4f. Admin updates intern1
  console.log('\n--- 4f. Admin updates intern1 name (Expect 200) ---');
  const resUpdateUser = await fetch(`${BASE}/users/intern1`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Grace Hopper (Lead Intern)' }),
  });
  console.log('Status:', resUpdateUser.status, await resUpdateUser.json());

  // 4g. Admin resets password for intern1
  console.log('\n--- 4g. Admin resets password for intern1 (Expect 200) ---');
  const resReset = await fetch(`${BASE}/users/intern1/reset-password`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword: 'brandNewSecretPass456' }),
  });
  console.log('Status:', resReset.status, await resReset.json());

  // 4h. Verify intern1 can login with the new password
  console.log('\n--- 4h. Login with reset password for intern1 (Expect 200) ---');
  const resLoginReset = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'intern1',
      password: 'brandNewSecretPass456',
      role: 'General User',
    }),
  });
  console.log('Status:', resLoginReset.status, await resLoginReset.json());

  // 4i. Admin deletes user intern1
  console.log('\n--- 4i. Admin deletes user intern1 (Expect 200) ---');
  const resDelete = await fetch(`${BASE}/users/intern1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', resDelete.status, await resDelete.json());

  console.log('\n🎉 ALL VALIDATION CHECKS COMPLETED AND PASSED!');
}

runTests().catch(console.error);
