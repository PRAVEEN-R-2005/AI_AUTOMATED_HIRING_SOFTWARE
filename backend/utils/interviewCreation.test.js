const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInterviewPayload } = require('../controllers/interviewController');

test('normalizes interview form values into a backend-safe payload', () => {
  const payload = normalizeInterviewPayload({
    candidate_id: '3',
    application_id: '42',
    job_id: '7',
    candidate_name: 'Pradeep S',
    email: 'pradeepsb06@gmail.com',
    phone: 'N/A',
    ai_score: '83',
    interview_date: '24-07-2026',
    interview_time: '10:00',
    mode: 'In-Person',
    interviewer_id: '11',
    interviewer_name: 'Praveen',
    round: 'Technical Interview',
    duration: '30 Minutes',
    meeting_link: ''
  });

  assert.equal(payload.candidate_id, 3);
  assert.equal(payload.application_id, 42);
  assert.equal(payload.job_id, 7);
  assert.equal(payload.interviewer_id, 11);
  assert.equal(payload.interviewer_name, 'Praveen');
  assert.equal(payload.interview_date, '2026-07-24');
  assert.equal(payload.interview_time, '10:00');
  assert.equal(payload.duration, 30);
  assert.equal(payload.mode, 'In-Person');
  assert.equal(payload.round, 'Technical Interview');
  assert.equal(payload.status, 'Scheduled');
});
