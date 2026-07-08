const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInterviewPayload } = require('../controllers/interviewController');

test('normalizes interview form values into a backend-safe payload', () => {
  const payload = normalizeInterviewPayload({
    candidate_id: '3',
    candidate_name: 'Pradeep S',
    email: 'pradeepsb06@gmail.com',
    phone: 'N/A',
    ai_score: '83',
    interview_date: '24-07-2026',
    interview_time: '10:00',
    mode: 'In-Person',
    interviewer: 'HR Manager',
    round: 'Technical Interview',
    duration: '30 Minutes',
    meeting_link: ''
  });

  assert.equal(payload.candidate_id, 3);
  assert.equal(payload.interview_date, '2026-07-24');
  assert.equal(payload.interview_time, '10:00');
  assert.equal(payload.duration, 30);
  assert.equal(payload.mode, 'In-Person');
  assert.equal(payload.round, 'Technical Interview');
  assert.equal(payload.status, 'Scheduled');
});
