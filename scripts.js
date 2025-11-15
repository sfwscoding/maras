// Base API host (ตามที่คุณระบุ)
const API_HOST = "https://app-87q3k0clt-flasks-projects-987fd076.vercel.app";
document.getElementById('api-host').textContent = API_HOST;

const usersArea = document.getElementById('users-area');
const debug = document.getElementById('debug');
const createResult = document.getElementById('create-result');

function setDebug(title, obj) {
  debug.textContent = `${title}\n\n${JSON.stringify(obj, null, 2)}`;
}

// --- Helper for fetch with error handling ---
async function apiFetch(path, opts = {}) {
  const url = `${API_HOST}${path}`;
  try {
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch(e) { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: null, error: String(err) };
  }
}

// --- GET all users and render (*** ปรับปรุงส่วนนี้ ***) ---
async function refreshUsers() {
  usersArea.textContent = "กำลังโหลด...";
  const r = await apiFetch('/api/users', { method: 'GET' });
  setDebug('GET /api/users', r);
  if (!r.ok) {
    usersArea.textContent = `เกิดข้อผิดพลาด: ${r.status || r.error}`;
    return;
  }
  const users = r.data || [];
  usersArea.innerHTML = ''; // เคลียร์พื้นที่

  if (users.length === 0) {
    usersArea.textContent = "ไม่มีผู้ใช้ในระบบ";
    return;
  }
  
  // Render user cards
  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-card'; // ใช้คลาส CSS ที่กำหนดใหม่
    card.innerHTML = `
      <div class="user-card-header">
        <strong>${u.name}</strong>
        <small>${u.role || 'N/A'}</small>
      </div>
      <div class="user-card-body">
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>ID:</strong> ${u.id}</p>
      </div>
    `;
    usersArea.appendChild(card);
  });
}

// --- Health check ---
async function checkHealth() {
  const r = await apiFetch('/health', { method: 'GET' });
  setDebug('GET /health', r);
  alert(r.ok ? `Healthy: ${JSON.stringify(r.data)}` : `Health check failed: ${r.status || r.error}`);
}

// --- Create user (POST) ---
document.getElementById('create-form').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const payload = {};
  for (const [k,v] of fd.entries()) {
    if (v && v.trim() !== '') payload[k] = v.trim();
  }
  const r = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  createResult.textContent = JSON.stringify(r, null, 2);
  setDebug('POST /api/users', r);
  if (r.ok) {
    // รีโหลดรายการ
    await refreshUsers();
    ev.target.reset();
  }
});

// --- GET by id ---
document.getElementById('btn-get').addEventListener('click', async ()=>{
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  const r = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'GET' });
  setDebug(`GET /api/users/${id}`, r);
  if (r.ok) {
    alert(`พบผู้ใช้: ${r.data.name} (${r.data.email})`);
  } else {
    alert(`ไม่พบหรือเกิดข้อผิดพลาด: ${r.status}`);
  }
});

// --- DELETE by id ---
document.getElementById('btn-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  if (!confirm(`จะลบผู้ใช้ id='${id}' หรือไม่?`)) return;
  const r = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  setDebug(`DELETE /api/users/${id}`, r);
  if (r.ok) {
    alert(`ลบแล้ว: ${JSON.stringify(r.data)}`);
    refreshUsers();
  } else {
    alert(`ลบไม่สำเร็จ: ${r.status}`);
  }
});

// --- PUT (update) ---
document.getElementById('btn-put').addEventListener('click', async (ev)=>{
  ev.preventDefault();
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  const fd = new FormData(document.getElementById('update-form'));
  const payload = {};
  for (const [k,v] of fd.entries()) {
    if (v && v.trim() !== '') payload[k] = v.trim();
  }
  if (Object.keys(payload).length === 0) {
    alert('โปรดใส่ field ที่ต้องการอัปเดต (name, email, role)');
    return;
  }
  const r = await apiFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  setDebug(`PUT /api/users/${id}`, r);
  if (r.ok) {
    alert('อัปเดตสำเร็จ');
    refreshUsers();
    document.getElementById('update-form').reset();
  } else {
    alert(`อัปเดตไม่สำเร็จ: ${r.status}`);
  }
});

// --- init bindings ---
document.getElementById('btn-refresh').addEventListener('click', refreshUsers);
document.getElementById('btn-health').addEventListener('click', checkHealth);

// load initial
refreshUsers();