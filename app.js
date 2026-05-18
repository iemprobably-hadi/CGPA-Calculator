// ─────────────────────────────────────────────────
// Hadi's Academic Portal — Core Engine
// ─────────────────────────────────────────────────

const STORAGE_KEY = 'gradex_semData';
const NAME_KEY = 'gradex_studentName';
const ARID_KEY = 'gradex_aridNo';

let semData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let hasCelebrated = false;

const studentNameEl = document.getElementById('studentName');
const aridNoEl = document.getElementById('aridNo');

if (studentNameEl) {
  studentNameEl.value = localStorage.getItem(NAME_KEY) || '';
  studentNameEl.addEventListener('input', e => localStorage.setItem(NAME_KEY, e.target.value));
}
if (aridNoEl) {
  aridNoEl.value = localStorage.getItem(ARID_KEY) || '';
  aridNoEl.addEventListener('input', e => localStorage.setItem(ARID_KEY, e.target.value));
}

if (semData.length === 0) {
  semData.push(createEmptySem(1));
  saveData();
}

function createEmptySem(num) {
  return {
    id: Date.now() + Math.random(),
    name: `Semester ${num}`,
    subs: [ { id: Date.now() + Math.random(), name: '', ch: '', marks: '' } ]
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(semData));
}

// ── STRICT GPA & QP MATH LOGIC ──
function pctToGPA(p) {
  if (!p || isNaN(p)) return 0;
  if (p >= 80) return 4.0;
  if (p >= 65) return 3.0 + (p - 65) * (1 / 15);
  if (p >= 50) return 2.0 + (p - 50) * (1 / 15);
  if (p >= 40) return 1.0 + (p - 40) * 0.1;
  return 0.0;
}

// Crucial Fix: Takes RAW MARKS and calculates Percentage based on CH
function computePercentage(rawMarks, ch) {
  if (!rawMarks || isNaN(rawMarks) || !ch || isNaN(ch)) return 0;
  const totalMarks = ch * 20;
  return (parseFloat(rawMarks) / totalMarks) * 100;
}

function computeQP(rawMarks, ch) {
  const p = computePercentage(rawMarks, ch);
  const gpa = pctToGPA(p);
  return gpa * parseFloat(ch);
}

function gradeLabel(gpa) {
  if (gpa >= 3.94) return { letter: 'A', msg: 'Outstanding Performance' };
  if (gpa >= 3.0) return { letter: 'B', msg: 'Excellent Work' };
  if (gpa >= 2.0) return { letter: 'C', msg: 'Good Effort' };
  if (gpa >= 1.0) return { letter: 'D', msg: 'Needs Improvement' };
  return { letter: 'F', msg: 'Unsatisfactory' };
}

function gradeColorHex(letter) {
  const map = { 'A+': '#059669', A: '#059669', B: '#0F172A', C: '#B48B14', D: '#EA580C', F: '#A51C30' };
  return map[letter] || '#6B7280';
}

function badgeClass(gpa) {
  if (gpa >= 3.94) return 'badge-a';
  if (gpa >= 3.0) return 'badge-b';
  if (gpa >= 2.0) return 'badge-c';
  if (gpa >= 1.0) return 'badge-d';
  return 'badge-f';
}

// ── DOM INIT ──
const semsCont = document.getElementById('semestersContainer');
const tabsCont = document.getElementById('tabsContainer');

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  generateCriteriaTable(); // Dynamically generates the massive picture-perfect table
  
  document.getElementById('addSemBtn').addEventListener('click', () => {
    semData.push(createEmptySem(semData.length + 1));
    saveData();
    renderAll();
    scrollToSem(semData[semData.length - 1].id);
  });
});

function renderAll() {
  renderTabs();
  renderSemesters();
  updateOverall();
}

function renderTabs() {
  tabsCont.innerHTML = '';
  semData.forEach(sem => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = sem.name;
    btn.onclick = () => scrollToSem(sem.id);
    tabsCont.appendChild(btn);
  });
}

function scrollToSem(id) {
  const el = document.getElementById(`sem-${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── RENDER SEMESTERS ──
function renderSemesters() {
  semsCont.innerHTML = '';
  semData.forEach((sem, sIdx) => {
    const card = document.createElement('div');
    card.className = 'sem-card';
    card.id = `sem-${sem.id}`;

    const head = document.createElement('div');
    head.className = 'sem-card-header';
    head.innerHTML = `
      <div class="sem-card-title">
        <input type="text" value="${escHtml(sem.name)}" id="title-${sem.id}" />
      </div>
      <div class="sem-header-actions">
        <button class="btn btn-ghost btn-sm btn-add-sub">+ Subject</button>
        <button class="btn btn-danger btn-sm btn-del-sem">Delete</button>
      </div>
    `;

    head.querySelector('.btn-add-sub').addEventListener('click', () => addSubject(sem.id));
    head.querySelector('.btn-del-sem').addEventListener('click', () => deleteSem(sem.id));

    const subWrap = document.createElement('div');
    subWrap.className = 'subjects-wrap';
    
    const thRow = document.createElement('div');
    thRow.className = 'subjects-header';
    thRow.innerHTML = `
      <div class="sh-label">Subject (Optional)</div>
      <div class="sh-label" title="Enter Raw Marks Obtained">Obt. Marks</div>
      <div class="sh-label">Credit Hrs</div>
      <div class="sh-label">Subject GPA</div>
      <div class="sh-label">Quality Pts</div>
      <div class="sh-label"></div>
    `;
    subWrap.appendChild(thRow);

    const subList = document.createElement('div');
    subList.className = 'subjects-list';
    subList.id = `sublist-${sem.id}`;
    
    sem.subs.forEach((sub, subIdx) => {
      subList.appendChild(buildSubjectRow(sem.id, sub, subIdx));
    });

    subWrap.appendChild(subList);

    const resRow = document.createElement('div');
    resRow.className = 'sem-result';
    resRow.innerHTML = `
      <div class="sr-pill"><div class="sr-label">Credit Hours</div><div class="sr-val" id="res-ch-${sem.id}">0</div></div>
      <div class="sr-pill"><div class="sr-label">Quality Points</div><div class="sr-val" id="res-qp-${sem.id}">0.0</div></div>
      <div class="sr-pill"><div class="sr-label">Semester GPA</div><div class="sr-val" id="res-gpa-${sem.id}">0.00</div></div>
    `;

    card.appendChild(head);
    card.appendChild(subWrap);
    card.appendChild(resRow);
    semsCont.appendChild(card);

    document.getElementById(`title-${sem.id}`).addEventListener('input', e => {
      sem.name = e.target.value;
      saveData();
      renderTabs();
    });

    updateSemStats(sem.id);
  });
}

function buildSubjectRow(semId, sub, idx) {
  const row = document.createElement('div');
  row.className = 'subject-row';

  const pct = computePercentage(sub.marks, sub.ch);
  const qp = computeQP(sub.marks, sub.ch);
  const gpa = (sub.marks && !isNaN(parseFloat(sub.marks))) ? pctToGPA(pct) : null;
  const grade = gpa !== null ? gradeLabel(gpa) : null;

  row.innerHTML = `
    <input type="text" placeholder="e.g. CS101" value="${escHtml(sub.name)}" class="inp-name" />
    <input type="number" placeholder="Marks" value="${sub.marks}" class="inp-marks" />
    <div class="segmented-control ch-control">
      <button class="seg-btn ${sub.ch == '1' ? 'active' : ''}" data-ch="1">1</button>
      <button class="seg-btn ${sub.ch == '2' ? 'active' : ''}" data-ch="2">2</button>
      <button class="seg-btn ${sub.ch == '3' ? 'active' : ''}" data-ch="3">3</button>
      <button class="seg-btn ${sub.ch == '4' ? 'active' : ''}" data-ch="4">4</button>
    </div>
    <div class="grade-badge ${grade ? badgeClass(gpa) : 'badge-empty'}">
      ${grade ? grade.letter : '—'}
    </div>
    <div class="qp-cell">${(sub.marks && sub.ch) ? qp.toFixed(2) : '—'}</div>
    <button class="del-btn" aria-label="Delete">✕</button>
  `;

  const updateSelfDOM = () => {
    const sem = semData.find(s => s.id === semId);
    if (!sem) return;
    const currentSub = sem.subs.find(s => s.id === sub.id);

    const nPct = computePercentage(currentSub.marks, currentSub.ch);
    const nQP = computeQP(currentSub.marks, currentSub.ch);
    const nGPA = (currentSub.marks && !isNaN(parseFloat(currentSub.marks))) ? pctToGPA(nPct) : null;
    const nGrade = nGPA !== null ? gradeLabel(nGPA) : null;

    const badge = row.querySelector('.grade-badge');
    badge.className = 'grade-badge ' + (nGrade ? badgeClass(nGPA) : 'badge-empty');
    badge.textContent = nGrade ? nGrade.letter : '—';

    row.querySelector('.qp-cell').textContent = (currentSub.marks && currentSub.ch) ? nQP.toFixed(2) : '—';
  };

  const notifyChange = () => {
    saveData();
    updateSelfDOM();
    updateSemStats(semId);
    updateOverall();
  };

  row.querySelector('.inp-name').addEventListener('input', e => { sub.name = e.target.value; saveData(); });
  row.querySelector('.inp-marks').addEventListener('input', e => { sub.marks = e.target.value; notifyChange(); });
  
  // Segmented Control Logic
  const segBtns = row.querySelectorAll('.seg-btn');
  segBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      segBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      sub.ch = e.target.getAttribute('data-ch');
      notifyChange();
    });
  });

  row.querySelector('.del-btn').addEventListener('click', () => { deleteSubject(semId, sub.id); });

  return row;
}

// ── CRUD ACTIONS ──
function addSubject(semId) {
  const sem = semData.find(s => s.id === semId);
  sem.subs.push({ id: Date.now() + Math.random(), name: '', ch: '', marks: '' });
  saveData();
  const list = document.getElementById(`sublist-${semId}`);
  list.appendChild(buildSubjectRow(semId, sem.subs[sem.subs.length - 1], sem.subs.length - 1));
  updateSemStats(semId);
  updateOverall();
}

function deleteSubject(semId, subId) {
  const sem = semData.find(s => s.id === semId);
  sem.subs = sem.subs.filter(s => s.id !== subId);
  saveData();
  renderAll();
}

function deleteSem(semId) {
  semData = semData.filter(s => s.id !== semId);
  saveData();
  renderAll();
}

// ── AGGREGATIONS ──
function updateSemStats(semId) {
  const sem = semData.find(s => s.id === semId);
  if (!sem) return;

  let totCH = 0, totQP = 0;
  sem.subs.forEach(s => {
    const ch = parseFloat(s.ch);
    if (!isNaN(ch) && s.marks) {
      totCH += ch;
      totQP += computeQP(s.marks, s.ch);
    }
  });

  const gpa = totCH ? (totQP / totCH) : 0;
  document.getElementById(`res-ch-${semId}`).textContent = totCH;
  document.getElementById(`res-qp-${semId}`).textContent = totQP.toFixed(2);
  document.getElementById(`res-gpa-${semId}`).textContent = gpa.toFixed(2);
}

function updateOverall() {
  let totalCH = 0, totalQP = 0;
  const semSummaryBody = document.querySelector('#semSummaryTable tbody');
  semSummaryBody.innerHTML = '';
  const semWrap = document.getElementById('semSummaryWrap');

  let hasData = false;

  semData.forEach(sem => {
    let sCH = 0, sQP = 0;
    sem.subs.forEach(s => {
      const ch = parseFloat(s.ch);
      if (!isNaN(ch) && s.marks) {
        sCH += ch;
        sQP += computeQP(s.marks, s.ch);
      }
    });

    if (sCH > 0) {
      hasData = true;
      totalCH += sCH;
      totalQP += sQP;
      const sGPA = sQP / sCH;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-name">${escHtml(sem.name)}</td>
        <td>${sCH}</td>
        <td>${sQP.toFixed(2)}</td>
        <td class="td-gpa">${sGPA.toFixed(2)}</td>
      `;
      semSummaryBody.appendChild(tr);
    }
  });

  semWrap.classList.toggle('hidden', !hasData);

  const cgpa = totalCH ? (totalQP / totalCH) : 0;
  const gl = totalCH ? gradeLabel(cgpa) : { letter: '—', msg: 'No Data' };

  document.getElementById('statCH').querySelector('.sc-val').textContent = totalCH;
  document.getElementById('statQP').querySelector('.sc-val').textContent = totalQP.toFixed(2);
  
  document.getElementById('statGrade').querySelector('.sc-val').innerHTML = `
    ${gl.letter}
    <span style="display:block; font-family:var(--font-body); font-size:0.85rem; color:var(--text2); letter-spacing:-0.01em; margin-top:2px;">${gl.msg}</span>
  `;
  
  const ringCgpaEl = document.getElementById('overallCgpa');
  const ringFg = document.getElementById('cgpaRing');
  
  ringCgpaEl.textContent = totalCH ? cgpa.toFixed(2) : '0.00';
  ringFg.style.strokeDashoffset = totalCH ? (326.7 - (cgpa / 4.0) * 326.7) : 326.7;

  if (cgpa > 3.5 && totalCH > 0 && !hasCelebrated) {
    triggerConfetti();
    hasCelebrated = true;
  } else if (cgpa <= 3.5) {
    hasCelebrated = false;
  }
}

// ── DYNAMIC PICTURE TABLE GENERATOR ──
function generateCriteriaTable() {
  const wrap = document.getElementById('criteriaTableWrap');
  if (!wrap) return;

  const grades = [
    { name: 'D (40-49%)', class: 'td-d', range: [40, 49.99] },
    { name: 'C (50-64%)', class: 'td-c', range: [50, 64.99] },
    { name: 'B (65-79%)', class: 'td-b', range: [65, 79.99] },
    { name: 'A (80-100%)', class: 'td-a', range: [80, 100] }
  ];
  const columns = [1, 2, 3, 4, 5]; // CH

  let html = '<table class="pic-table"><thead><tr><th style="background:#fff;border-bottom:none"></th>';
  columns.forEach(ch => html += `<th colspan="2" style="font-size:1.1rem;color:#0F172A">${ch * 20}</th>`);
  html += '</tr><tr><th style="background:#fff;border-bottom:none"></th>';
  columns.forEach(ch => html += '<th>Marks</th><th>Q.P.</th>');
  html += '</tr></thead><tbody>';

  grades.forEach(g => {
    let maxRows = 0;
    columns.forEach(ch => {
      let minM = Math.ceil(g.range[0] * (ch * 20) / 100);
      let maxM = Math.floor(g.range[1] * (ch * 20) / 100);
      if (g.range[1] === 100) maxM = ch * 20;
      let rows = (maxM - minM) + 1;
      if (rows > maxRows) maxRows = rows;
    });

    for (let r = 0; r < maxRows; r++) {
      html += '<tr>';
      if (r === 0) html += `<td rowspan="${maxRows}" class="td-white">${g.name}</td>`;
      
      columns.forEach(ch => {
        let minM = Math.ceil(g.range[0] * (ch * 20) / 100);
        let maxM = Math.floor(g.range[1] * (ch * 20) / 100);
        if (g.range[1] === 100) maxM = ch * 20;
        
        let mark = minM + r;
        if (mark <= maxM) {
          let pct = (mark / (ch * 20)) * 100;
          let qp = (pctToGPA(pct) * ch).toFixed(2);
          qp = qp.replace(/\.00$/, ''); // Clean zeros
          html += `<td class="${g.class}">${mark}</td><td class="${g.class}">${qp}</td>`;
        } else {
          html += `<td class="td-empty"></td><td class="td-empty"></td>`;
        }
      });
      html += '</tr>';
    }
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// ── SCREENSHOT LOGIC ──
async function exportTranscript(type) {
  let totalCH = 0, totalQP = 0;
  semData.forEach(sem => {
    sem.subs.forEach(s => {
      const ch = parseFloat(s.ch);
      if (!isNaN(ch) && s.marks) { totalCH += ch; totalQP += computeQP(s.marks, s.ch); }
    });
  });
  const cgpa = totalCH ? (totalQP / totalCH) : 0;
  const gl = totalCH ? gradeLabel(cgpa) : { letter: '—', msg: 'No Data' };

  const sName = document.getElementById('studentName')?.value || 'Muhammad Hadi';
  const sArid = document.getElementById('aridNo')?.value || '—';

  const el = document.createElement('div');
  el.id = 'screenshotTarget';
  el.style.cssText = `
    position:fixed; top:-9999px; left:-9999px;
    background:#ffffff; padding:4rem; width:850px;
    font-family:'Inter',sans-serif; color:#111827; 
  `;

  let innerContent = '';

  if (type === 'detailed') {
    let subjectsHtml = '';
    semData.forEach(sem => {
      let semHtml = '';
      let hasValidSubs = false;
      sem.subs.forEach(sub => {
        const mVal = parseFloat(sub.marks);
        const chVal = parseFloat(sub.ch);
        if (isNaN(chVal) || isNaN(mVal)) return;
        hasValidSubs = true;
        const pct = computePercentage(mVal, chVal);
        const qp = computeQP(mVal, chVal);
        const gpa = pctToGPA(pct);
        const grade = gradeLabel(gpa);
        semHtml += `
          <tr style="border-bottom:1px solid #E5E7EB">
            <td style="padding:.75rem 1rem;text-align:left;color:#4B5563">${escHtml(sub.name) || 'Subject'}</td>
            <td style="padding:.75rem 1rem;text-align:center">${mVal} / ${chVal*20}</td>
            <td style="padding:.75rem 1rem;text-align:center">${chVal}</td>
            <td style="padding:.75rem 1rem;text-align:center;color:#A51C30;font-weight:700">${gpa.toFixed(2)}</td>
            <td style="padding:.75rem 1rem;text-align:center;font-weight:700">${qp.toFixed(2)}</td>
            <td style="padding:.75rem 1rem;text-align:center;font-weight:700;color:${gradeColorHex(grade.letter)}">${grade.letter}</td>
          </tr>
        `;
      });

      if (hasValidSubs) {
        subjectsHtml += `
          <tr><td colspan="6" style="padding:1.5rem 1rem .5rem; font-family:'Merriweather',serif; font-size:1.2rem; font-weight:700; color:#0F172A; border-bottom:2px solid #0F172A">${escHtml(sem.name)}</td></tr>
          <tr style="background:#F3F4F6">
            <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;text-transform:uppercase;color:#4B5563">Subject</th>
            <th style="padding:.75rem 1rem;text-align:center;font-size:.75rem;text-transform:uppercase;color:#4B5563">Obt. / Total</th>
            <th style="padding:.75rem 1rem;text-align:center;font-size:.75rem;text-transform:uppercase;color:#4B5563">Credit Hrs</th>
            <th style="padding:.75rem 1rem;text-align:center;font-size:.75rem;text-transform:uppercase;color:#4B5563">Subject GPA</th>
            <th style="padding:.75rem 1rem;text-align:center;font-size:.75rem;text-transform:uppercase;color:#4B5563">Quality Pts</th>
            <th style="padding:.75rem 1rem;text-align:center;font-size:.75rem;text-transform:uppercase;color:#4B5563">Grade</th>
          </tr>
          ${semHtml}
        `;
      }
    });

    innerContent = `
      <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:2rem">
        ${subjectsHtml}
      </table>
    `;
  } else {
    let semRows = semData.map(sem => {
      let sCH = 0, sQP = 0;
      sem.subs.forEach(sub => {
        const ch = parseFloat(sub.ch);
        if (!isNaN(ch) && sub.marks) { sCH += ch; sQP += computeQP(sub.marks, sub.ch); }
      });
      if (sCH === 0) return '';
      const sGPA = sQP / sCH;
      const g = gradeLabel(sGPA);
      return `<tr style="border-bottom:1px solid #E5E7EB">
        <td style="padding:1rem;text-align:left;font-weight:600;color:#111827">${escHtml(sem.name)}</td>
        <td style="padding:1rem;text-align:center;color:#4B5563">${sCH}</td>
        <td style="padding:1rem;text-align:center;color:#4B5563">${sQP.toFixed(2)}</td>
        <td style="padding:1rem;text-align:center;color:#A51C30;font-weight:700">${sGPA.toFixed(2)}</td>
        <td style="padding:1rem;text-align:center;color:${gradeColorHex(g.letter)};font-weight:700">${g.letter}</td>
      </tr>`;
    }).join('');

    innerContent = `
      <div style="border:1px solid #E5E7EB; border-radius:8px; overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:.95rem">
          <thead>
            <tr style="background:#F3F4F6;border-bottom:2px solid #D1D5DB">
              <th style="padding:1rem;text-align:left;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#0F172A">Semester</th>
              <th style="padding:1rem;text-align:center;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#0F172A">Credit Hours</th>
              <th style="padding:1rem;text-align:center;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#0F172A">Quality Pts</th>
              <th style="padding:1rem;text-align:center;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#0F172A">GPA</th>
              <th style="padding:1rem;text-align:center;font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#0F172A">Grade</th>
            </tr>
          </thead>
          <tbody>${semRows}</tbody>
        </table>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="transcript-header">
      <h1>Academic Portal Report</h1>
      <p>Official Student Transcript</p>
    </div>

    <div class="transcript-student">
      <div><strong>Student Name</strong>${escHtml(sName)}</div>
      <div style="text-align:right"><strong>Registration No.</strong>${escHtml(sArid)}</div>
    </div>

    <div style="display:flex;gap:1.5rem;margin-bottom:3rem">
      <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:1.5rem;text-align:center">
        <div style="font-size:.7rem;letter-spacing:.05em;text-transform:uppercase;color:#6B7280;margin-bottom:.5rem;font-weight:700">Cumulative GPA</div>
        <div style="font-family:'Merriweather',serif;font-size:3rem;font-weight:900;color:#0F172A">${totalCH ? cgpa.toFixed(2) : '—'}</div>
      </div>
      <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:1.5rem;text-align:center">
        <div style="font-size:.7rem;letter-spacing:.05em;text-transform:uppercase;color:#6B7280;margin-bottom:.5rem;font-weight:700">Overall Grade</div>
        <div style="font-family:'Merriweather',serif;font-size:3rem;font-weight:900;color:#0F172A;line-height:1">${totalCH ? gl.letter : '—'}</div>
        <div style="font-size:.85rem;color:#4B5563;font-weight:600;margin-top:.4rem">${totalCH ? gl.msg : ''}</div>
      </div>
      <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:1.5rem;text-align:center">
        <div style="font-size:.7rem;letter-spacing:.05em;text-transform:uppercase;color:#6B7280;margin-bottom:.5rem;font-weight:700">Total Credit Hours</div>
        <div style="font-family:'Merriweather',serif;font-size:3rem;font-weight:900;color:#0F172A">${totalCH}</div>
      </div>
    </div>

    ${innerContent}

    <div class="transcript-footer">
      Generated on ${new Date().toLocaleDateString('en-PK', {year:'numeric',month:'long',day:'numeric'})} &nbsp;|&nbsp; Max GPA 4.0 &nbsp;|&nbsp; <strong>Engineered by Muhammad Hadi</strong>
    </div>
  `;

  document.body.appendChild(el);

  try {
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
    const link = document.createElement('a');
    link.download = `Transcript_${sName.replace(/\s+/g,'_') || 'Academic_Portal'}_${type}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast(`Success! ${type === 'detailed' ? 'Detailed' : 'Summary'} Transcript downloaded.`);
  } catch(e) {
    console.error(e);
    showToast('Failed to save image.');
  } finally {
    el.remove();
    document.getElementById('exportModalOverlay').classList.add('hidden');
  }
}

// ── CONFETTI ──
function triggerConfetti() {
  if (typeof confetti === 'function') {
    var duration = 4 * 1000;
    var end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#A51C30', '#E6B31E', '#0F172A', '#059669'],
        zIndex: 9999
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#A51C30', '#E6B31E', '#0F172A', '#059669'],
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
}

// ── MODALS ──
document.getElementById('exportBtn').addEventListener('click', () => {
  document.getElementById('exportModalOverlay').classList.remove('hidden');
});
document.getElementById('closeExportModal').addEventListener('click', () => {
  document.getElementById('exportModalOverlay').classList.add('hidden');
});
document.getElementById('btnExportDetailed').addEventListener('click', () => exportTranscript('detailed'));
document.getElementById('btnExportSummary').addEventListener('click', () => exportTranscript('summary'));

document.getElementById('showQpBtn').addEventListener('click', () => {
  document.getElementById('qpModalOverlay').classList.remove('hidden');
});
document.getElementById('closeQpModal').addEventListener('click', () => {
  document.getElementById('qpModalOverlay').classList.add('hidden');
});

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
}
