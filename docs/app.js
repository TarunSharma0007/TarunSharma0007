const record = {
  sources: {
    'enc-003': { type: 'Encounter', label: 'Outpatient review', date: '2026-06-18', status: 'finished', version: '1' },
    'med-001': { type: 'MedicationRequest', label: 'Lisinopril 10 mg tablet', date: '2025-03-12', status: 'active', version: '1' },
    'med-002': { type: 'MedicationRequest', label: 'Lisinopril 10 mg tablet', date: '2025-11-20', status: 'stopped', version: '2' },
    'med-003': { type: 'MedicationRequest', label: 'Lisinopril 10 mg tablet', date: '2026-01-05', status: 'active', version: '1' },
    'obs-003': { type: 'Observation', label: 'Blood pressure · 136/84 mmHg', date: '2025-11-20', status: 'final', version: '1' },
    'obs-004': { type: 'Observation', label: 'Blood pressure · 139/86 mmHg', date: '2026-03-08', status: 'final', version: '1' },
    'obs-005': { type: 'Observation', label: 'Blood pressure · 134/82 mmHg', date: '2026-06-18', status: 'final', version: '1' },
    'report-001': { type: 'DiagnosticReport', label: 'Routine metabolic panel report', date: '2026-06-18', status: 'final', version: '1' },
    'care-001': { type: 'CarePlan', label: 'Bring an updated medication list', date: '2026-06-18', status: 'active', version: '1' },
    'appt-001': { type: 'Appointment', label: 'Upcoming synthetic follow-up', date: '2026-08-01', status: 'booked', version: '1' },
  },
  timeline: [
    { date: 'Aug 01, 2026', title: 'Follow-up appointment', detail: 'Upcoming synthetic follow-up appointment', kind: 'clinical', status: 'Booked', source: 'appt-001', icon: 'A' },
    { date: 'Jun 18, 2026', title: 'Outpatient review', detail: 'Blood pressure 134/82 mmHg · routine metabolic panel · care plan updated', kind: 'clinical', status: 'Finished', source: 'enc-003,obs-005,report-001,care-001', icon: 'E' },
    { date: 'Mar 08, 2026', title: 'Blood pressure observation', detail: 'Recorded value 139/86 mmHg', kind: 'clinical', status: 'Final', source: 'obs-004', icon: 'O' },
    { date: 'Jan 05, 2026', title: 'Medication record', detail: 'Lisinopril 10 mg tablet recorded as active', kind: 'medication', status: 'Active', source: 'med-003', icon: 'Rx' },
    { date: 'Nov 20, 2025', title: 'Follow-up visit', detail: 'Lisinopril recorded as stopped; blood pressure 136/84 mmHg', kind: 'medication', status: 'Review', source: 'med-002,obs-003', icon: 'Rx' },
    { date: 'Mar 12, 2025', title: 'Primary care visit', detail: 'Hypertension recorded; Lisinopril 10 mg recorded as active', kind: 'medication', status: 'Active', source: 'med-001', icon: 'Rx' },
  ],
};

let role = 'patient';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function sourceButton(ids, label = 'View sources') {
  return `<button class="source-button" type="button" data-sources="${ids}">${label}</button>`;
}

function renderTimeline(container, items) {
  container.innerHTML = items.map((item) => `
    <article class="timeline-item" data-kind="${item.kind}">
      <time class="timeline-date">${item.date}</time>
      <div class="timeline-dot">${item.icon}</div>
      <div class="timeline-copy"><h3>${item.title}</h3><p>${item.detail}</p>${sourceButton(item.source, 'Open evidence')}</div>
      <span class="status-chip ${item.status === 'Active' ? 'active' : item.status === 'Review' ? 'review' : ''}">${item.status}</span>
    </article>`).join('');
}

function showSources(idList) {
  const ids = idList.split(',').map((id) => id.trim()).filter(Boolean);
  $('#sourceList').innerHTML = ids.map((id) => {
    const item = record.sources[id] || { type: 'FHIR resource', label: 'Referenced synthetic record', date: 'Synthetic demo', status: 'recorded', version: '1' };
    return `<article class="source-record"><header><code>${item.type}/${id}</code><span class="status-chip ${item.status === 'active' ? 'active' : ''}">${item.status}</span></header><p>${item.label}</p><small>Version ${item.version} · Last updated ${item.date} · Synthetic provenance attached</small></article>`;
  }).join('');
  $('#sourceDialog').showModal();
}

function setView(view) {
  $$('.view').forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== view; panel.classList.toggle('active', panel.dataset.viewPanel === view); });
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setRole(nextRole) {
  role = nextRole;
  $$('.role-option').forEach((button) => button.classList.toggle('active', button.dataset.role === role));
  $('.welcome-row h1').textContent = role === 'patient' ? 'Good morning, Alex.' : 'Clinical review workspace.';
  $('.welcome-row .subhead').textContent = role === 'patient'
    ? 'Your record, connected across time—with every answer linked back to its source.'
    : 'A focused, source-linked review of the synthetic longitudinal record.';
  $('#goalInput').value = role === 'patient' ? 'Help me prepare for my next appointment.' : 'Summarize the blood-pressure history and medication conflicts.';
}

function runGoal(goalText) {
  const goal = goalText.trim();
  if (!goal) return;
  const unsafe = /(which medication should|stop medication|start medication|diagnose|best treatment|dosage)/i.test(goal);
  const panel = $('#resultPanel');
  panel.hidden = false;
  panel.classList.toggle('refusal', unsafe);
  const trace = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  if (unsafe) {
    panel.innerHTML = `
      <div class="result-header"><div><span class="result-badge">Safety boundary</span><h2>Clinical recommendation refused</h2></div><div class="result-meta">Decision: refuse_medication_change · ${trace}</div></div>
      <section class="result-section"><p>I cannot recommend starting, stopping, or changing medication, or make a diagnosis. A qualified clinician must make those decisions.</p><p>I can still show the recorded medication history and the conflicting source entries for professional review.</p>${sourceButton('med-001,med-002,med-003','Review medication evidence')}</section>`;
  } else if (role === 'clinician') {
    panel.innerHTML = `
      <div class="result-header"><div><span class="result-badge">Source-linked review</span><h2>Clinical record summary</h2></div><div class="result-meta">Status: human review required · ${trace}</div></div>
      <section class="result-section"><h3>Blood-pressure history</h3><ul><li>20 Nov 2025 — 136/84 mmHg</li><li>08 Mar 2026 — 139/86 mmHg</li><li>18 Jun 2026 — 134/82 mmHg</li></ul>${sourceButton('obs-003,obs-004,obs-005','Review observations')}</section>
      <section class="result-section"><h3>Medication reconciliation</h3><p>Three Lisinopril 10 mg entries include both active and stopped statuses. Resolve against the authoritative clinical source before relying on current-medication status.</p>${sourceButton('med-001,med-002,med-003','Review medication evidence')}</section>`;
  } else {
    panel.innerHTML = `
      <div class="result-header"><div><span class="result-badge">Appointment preparation</span><h2>Your record at a glance</h2></div><div class="result-meta">Status: human review required · ${trace}</div></div>
      <section class="result-section"><h3>What your record shows</h3><p>Your latest synthetic outpatient review recorded blood pressure at 134/82 mmHg, a routine metabolic panel, and a plan to bring an updated medication list to follow-up.</p>${sourceButton('enc-003,obs-005,report-001,care-001','Review source records')}</section>
      <section class="result-section"><h3>Questions for your care team</h3><ul><li>Can we confirm which Lisinopril entry is current?</li><li>Is any information in the connected record out of date?</li><li>What should I bring to the scheduled follow-up?</li></ul>${sourceButton('med-001,med-002,med-003,appt-001','See supporting records')}</section>`;
  }
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

renderTimeline($('#miniTimeline'), record.timeline.slice(0, 3));
renderTimeline($('#fullTimeline'), record.timeline);

document.addEventListener('click', (event) => {
  const source = event.target.closest('[data-sources]');
  if (source) showSources(source.dataset.sources);
  const navigation = event.target.closest('[data-view], [data-nav-to]');
  if (navigation) setView(navigation.dataset.view || navigation.dataset.navTo);
  const roleButton = event.target.closest('[data-role]');
  if (roleButton) setRole(roleButton.dataset.role);
  const suggestion = event.target.closest('[data-suggestion]');
  if (suggestion) { setView('overview'); $('#goalInput').value = suggestion.dataset.suggestion; $('#goalInput').focus(); }
});

$('#runGoal').addEventListener('click', () => runGoal($('#goalInput').value));
$('#goalInput').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runGoal($('#goalInput').value); });
$('#closeDialog').addEventListener('click', () => $('#sourceDialog').close());
$('#helpButton').addEventListener('click', () => $('#aboutDialog').showModal());
$('#closeAbout').addEventListener('click', () => $('#aboutDialog').close());
$('#boundaryDemo').addEventListener('click', () => { setView('overview'); setRole('clinician'); $('#goalInput').value = 'Which medication should this patient stop?'; runGoal($('#goalInput').value); });

$$('.filter').forEach((button) => button.addEventListener('click', () => {
  $$('.filter').forEach((item) => item.classList.toggle('active', item === button));
  $$('#fullTimeline .timeline-item').forEach((item) => { item.hidden = button.dataset.filter !== 'all' && item.dataset.kind !== button.dataset.filter; });
}));
