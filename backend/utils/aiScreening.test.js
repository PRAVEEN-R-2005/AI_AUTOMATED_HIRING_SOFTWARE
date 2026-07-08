const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAnalysisForPersistence } = require('../controllers/aiController');

test('normalizes AI analysis into persisted screening fields', () => {
  const normalized = normalizeAnalysisForPersistence({
    overallScore: 83,
    skillsScore: 75,
    experienceScore: 100,
    educationScore: 70,
    matchedSkills: 'Python, SQL',
    missingSkills: 'Docker',
    additionalSkills: 'AWS',
    strengths: 'Strong backend fit',
    considerations: 'Review container experience',
    aiSummary: 'Solid candidate',
    recommendation: 'Strong Match - Recommended for Interview'
  }, 'Completed');

  assert.equal(normalized.matchScore, 83);
  assert.equal(normalized.overallFit, 83);
  assert.equal(normalized.recommendation, 'Strong Match - Recommended for Interview');
  assert.equal(normalized.screeningStatus, 'Completed');
  assert.equal(normalized.technicalSkillsFit, 75);
  assert.equal(normalized.experienceDurationAlignment, 100);
  assert.equal(normalized.academicQualificationFit, 70);
});
