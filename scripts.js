// --- 1. ส่วนกลาง (ใช้ทุกหน้า) ---

const API_HOST = "https://app-87q3k0clt-flasks-projects-987fd076.vercel.app";
const hostElement = document.getElementById('api-host');
if (hostElement) {
  hostElement.textContent = API_HOST;
}

// Helpers ที่ต้องตรวจสอบ Element ก่อน
const debug = document.getElementById('debug');
const createResult = document.getElementById('create-result');
const usersArea = document.getElementById('users-area');

function setDebug(title, obj) {
  if (debug) {
    debug.textContent = `${title}\n\n${JSON.stringify(obj, null, 2)}`;
  }
}

function setCreateResult(r) {
  if (createResult) {
    createResult.textContent = JSON.stringify(r, null, 2);
  }
}

// Helper: apiFetch (เหมือนเดิม)
async function apiFetch(path, opts = {}) {
  const url = `${API_HOST}${path}`;
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { ...(opts.headers || {}), 'Content-Type': 'application/json' }
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: null, error: String(err) };
  }
}

// --- 2. ฟังก์ชันสำหรับแต่ละหน้า ---

// --- (สำหรับ index.html) ---
async function refreshUsers() {
  if (!usersArea) return; // ออกถ้าไม่อยู่หน้า list
  usersArea.textContent = "กำลังโหลด...";
  const r = await apiFetch('/api/users', { method: 'GET' });
  setDebug('GET /api/users', r); // setDebug จะเช็คเองว่ามีกล่อง debug ไหม
  if (!r.ok) {
    usersArea.textContent = `เกิดข้อผิดพลาด: ${r.status || r.error}`;
    return;
  }
  const users = r.data || [];
  usersArea.innerHTML = '';
  if (users.length === 0) {
    usersArea.textContent = "ไม่มีผู้ใช้ในระบบ";
    return;
  }
  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-card';
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

// --- (สำหรับ health.html) ---
async function checkHealth() {
  const r = await apiFetch('/health', { method: 'GET' });
  setDebug('GET /health', r);
  alert(r.ok ? `Healthy: ${JSON.stringify(r.data)}` : `Health check failed: ${r.status || r.error}`);
}

// --- (สำหรับ create.html) ---
async function handleCreateSubmit(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const payload = {};
  for (const [k, v] of fd.entries()) {
    if (v && v.trim() !== '') payload[k] = v.trim();
  }
  const r = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setCreateResult(r); // ใช้ helper ที่เช็ค null
  setDebug('POST /api/users', r);
  if (r.ok) {
    alert('สร้างผู้ใช้สำเร็จ!');
    ev.target.reset();
  }
}

// --- (สำหรับ search.html) ---
async function handleGetById() {
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  const r = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'GET' });
  setDebug(`GET /api/users/${id}`, r);
  if (r.ok) {
    alert(`พบผู้ใช้: ${r.data.name} (${r.data.email})`);
  } else {
    alert(`ไม่พบหรือเกิดข้อผิดพลาด: ${r.status}`);
  }
}

async function handleDeleteById() {
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  if (!confirm(`จะลบผู้ใช้ id='${id}' หรือไม่?`)) return;
  const r = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  setDebug(`DELETE /api/users/${id}`, r);
  if (r.ok) {
    alert(`ลบแล้ว: ${JSON.stringify(r.data)}`);
  } else {
    alert(`ลบไม่สำเร็จ: ${r.status}`);
  }
}

async function handleUpdateById(ev) {
  ev.preventDefault();
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  const fd = new FormData(document.getElementById('update-form'));
  const payload = {};
  for (const [k, v] of fd.entries()) {
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
    document.getElementById('update-form').reset();
  } else {
    alert(`อัปเดตไม่สำเร็จ: ${r.status}`);
  }
}

// --- 3. ส่วนผูก Event (ตรวจสอบก่อนผูก) ---
document.addEventListener('DOMContentLoaded', () => {
  
  // -- หน้า index.html --
  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', refreshUsers);
    refreshUsers(); // โหลดครั้งแรกเมื่อเปิดหน้า
  }

  // -- หน้า create.html --
  const createForm = document.getElementById('create-form');
  if (createForm) {
    createForm.addEventListener('submit', handleCreateSubmit);
  }

  // -- หน้า search.html --
  const btnGet = document.getElementById('btn-get');
  if (btnGet) {
    btnGet.addEventListener('click', handleGetById);
  }
  const btnDelete = document.getElementById('btn-delete');
  if (btnDelete) {
    btnDelete.addEventListener('click', handleDeleteById);
  }
  const btnPut = document.getElementById('btn-put');
  if (btnPut) {
    // ที่ปุ่ม btn-put (ใน form) ต้องดัก click ไม่ใช่ submit
    // เพราะปุ่ม btn-put ไม่ใช่ type="submit"
    btnPut.addEventListener('click', handleUpdateById);
  }

  // -- หน้า health.html --
  const btnHealth = document.getElementById('btn-health');
  if (btnHealth) {
    btnHealth.addEventListener('click', checkHealth);
  }
});