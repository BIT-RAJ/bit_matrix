const API_BASE = '/api';

export async function uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Upload failed' })); throw new Error(err.error); }
    return res.json();
}

export async function analyzeResume(resumeText, jobRole = '') {
    const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Analysis failed' })); throw new Error(err.error); }
    return res.json();
}

export async function generateInterviewQuestions(resumeText, jobRole = '') {
    const res = await fetch(`${API_BASE}/interview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Failed to generate questions' })); throw new Error(err.error); }
    return res.json();
}

export async function generateCoverLetter(resumeText, jobRole = '', companyName = '') {
    const res = await fetch(`${API_BASE}/cover-letter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole, companyName }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Failed to generate cover letter' })); throw new Error(err.error); }
    return res.json();
}

export async function compareWithJD(resumeText, jobDescription) {
    const res = await fetch(`${API_BASE}/jd-compare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobDescription }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Comparison failed' })); throw new Error(err.error); }
    return res.json();
}

export async function rewriteResume(resumeText, jobRole = '', style = '') {
    const res = await fetch(`${API_BASE}/rewrite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole, style }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Rewrite failed' })); throw new Error(err.error); }
    return res.json();
}

export async function estimateSalary(resumeText, jobRole = '', location = '') {
    const res = await fetch(`${API_BASE}/salary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole, location }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Salary estimation failed' })); throw new Error(err.error); }
    return res.json();
}

export async function getCareerPaths(resumeText, jobRole = '') {
    const res = await fetch(`${API_BASE}/career-paths`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Career path generation failed' })); throw new Error(err.error); }
    return res.json();
}

export async function gradeAnswer(question, userAnswer, resumeText = '') {
    const res = await fetch(`${API_BASE}/grade-answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, userAnswer, resumeText }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Grading failed' })); throw new Error(err.error); }
    return res.json();
}

export async function getCompanyQuestions(resumeText, companyName, jobRole = '') {
    const res = await fetch(`${API_BASE}/company-questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, companyName, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Failed to generate questions' })); throw new Error(err.error); }
    return res.json();
}

export async function optimizeLinkedIn(resumeText, jobRole = '') {
    const res = await fetch(`${API_BASE}/linkedin-optimize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'LinkedIn optimization failed' })); throw new Error(err.error); }
    return res.json();
}

export async function generateEmail(resumeText, emailType, recipientRole = '', companyName = '') {
    const res = await fetch(`${API_BASE}/email-template`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, emailType, recipientRole, companyName }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Email generation failed' })); throw new Error(err.error); }
    return res.json();
}

// ---- Voice Interview ----
export async function startVoiceInterview(resumeText, jobRole = '') {
    const res = await fetch(`${API_BASE}/voice-interview/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Failed to start interview' })); throw new Error(err.error); }
    return res.json();
}

export async function sendVoiceResponse(resumeText, jobRole, conversationHistory, userAnswer, currentDifficulty, questionNumber) {
    const res = await fetch(`${API_BASE}/voice-interview/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText, jobRole, conversationHistory, userAnswer, currentDifficulty, questionNumber }) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Failed to get interview response' })); throw new Error(err.error); }
    return res.json();
}

// ---- Local storage helpers ----
const HISTORY_KEY = 'resumeai_history';
const MAX_HISTORY = 20;

export function saveToHistory(entry) {
    try {
        const history = getHistory();
        history.unshift({ id: Date.now(), timestamp: new Date().toISOString(), ...entry });
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch { /* Ignore quota errors */ }
}

export function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

export function clearHistory() { localStorage.removeItem(HISTORY_KEY); }

export function deleteFromHistory(id) {
    const history = getHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
}

// ---- Readability helpers (client-side) ----
export function computeReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(Boolean);
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const avgWordsPerSentence = sentences.length ? words.length / sentences.length : 0;
    const avgSyllablesPerWord = words.length ? syllables / words.length : 0;
    const fleschScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord));
    let grade = '';
    if (fleschScore >= 90) grade = '5th Grade';
    else if (fleschScore >= 80) grade = '6th Grade';
    else if (fleschScore >= 70) grade = '7th Grade';
    else if (fleschScore >= 60) grade = '8th-9th Grade';
    else if (fleschScore >= 50) grade = '10th-12th Grade';
    else if (fleschScore >= 30) grade = 'College';
    else grade = 'Post-Graduate';
    return { fleschScore: Math.round(fleschScore), grade, wordCount: words.length, sentenceCount: sentences.length, avgWordsPerSentence: avgWordsPerSentence.toFixed(1) };
}

function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const m = word.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
}

// ---- Keyword density (client-side) ----
export function computeKeywordDensity(text) {
    const stop = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'must', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'for', 'at', 'by', 'to', 'in', 'on', 'of', 'with', 'from', 'up', 'out', 'off', 'over', 'into', 'onto', 'as', 'if', 'than', 'that', 'this', 'these', 'those', 'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their', 'i', 'me', 'we', 'you', 'he', 'she', 'they', 'them', 'us', 'who', 'what', 'which', 'how', 'when', 'where', 'why']);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([word, count]) => ({ word, count, percent: ((count / words.length) * 100).toFixed(1) }));
}

// ---- Theme helpers ----
const THEME_KEY = 'resumeai_theme';
export function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
export function setTheme(theme) { localStorage.setItem(THEME_KEY, theme); document.documentElement.setAttribute('data-theme', theme); }
