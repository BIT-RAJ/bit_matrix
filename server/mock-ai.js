// --------------- Mock AI Fallback ---------------
// Generates realistic responses when all Gemini models are unavailable.
// Parses the resume text to produce contextual (not random) results.

function extractSkillsFromText(text) {
  const knownSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI',
    'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'Material UI',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'DynamoDB', 'Supabase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform',
    'Git', 'GitHub', 'GitLab', 'Linux', 'REST API', 'GraphQL', 'gRPC',
    'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Figma', 'Photoshop', 'Agile', 'Scrum', 'JIRA',
    'Data Structures', 'Algorithms', 'System Design', 'OOP', 'Microservices',
  ];
  const lower = text.toLowerCase();
  return knownSkills.filter(s => lower.includes(s.toLowerCase()));
}

function extractName(text) {
  const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const first = lines[0].trim();
    if (first.length < 40 && !first.includes('@') && !first.includes('http')) return first;
  }
  return 'the candidate';
}

function extractBullets(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l =>
    (l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l)) && l.length > 15 && l.length < 200
  );
  return lines.map(l => l.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '')).slice(0, 6);
}

function getMockAnalysis(resumeText, jobRole) {
  const skills = extractSkillsFromText(resumeText);
  const name = extractName(resumeText);
  const bullets = extractBullets(resumeText);
  const role = jobRole || 'Software Developer';
  const wordCount = resumeText.split(/\s+/).length;
  const score = Math.min(78, Math.max(45, Math.round(40 + skills.length * 3 + Math.min(wordCount / 50, 20))));
  const atsScore = Math.min(75, Math.max(40, score - 5 + Math.round(Math.random() * 10)));

  const missingSkillsPool = [
    { skill: 'Docker', reason: `Containerization is essential for modern ${role} roles`, priority: 'high' },
    { skill: 'CI/CD Pipelines', reason: 'Automated deployment shows DevOps awareness', priority: 'high' },
    { skill: 'System Design', reason: `Senior ${role} roles require architecture skills`, priority: 'medium' },
    { skill: 'Unit Testing', reason: 'Testing skills show code quality commitment', priority: 'high' },
    { skill: 'TypeScript', reason: 'Type safety is increasingly required in production codebases', priority: 'medium' },
    { skill: 'Cloud Services (AWS/GCP)', reason: `Most ${role} positions require cloud experience`, priority: 'high' },
    { skill: 'GraphQL', reason: 'Modern API design patterns are valued', priority: 'low' },
    { skill: 'Performance Optimization', reason: 'Shows depth of engineering knowledge', priority: 'medium' },
  ].filter(s => !skills.map(sk => sk.toLowerCase()).includes(s.skill.toLowerCase()));

  const improvedBullets = bullets.length > 0
    ? bullets.map(b => ({
        original: b,
        improved: `Spearheaded ${b.toLowerCase().replace(/^(managed|worked on|helped|did|made)\s*/i, '')} — driving measurable impact and cross-functional collaboration`
      }))
    : [
        { original: 'Worked on web applications', improved: 'Architected and delivered 5+ production web applications serving 10K+ users, reducing page load time by 40%' },
        { original: 'Helped with database management', improved: 'Optimized database queries and indexing strategies, improving API response times by 60% across 3 microservices' },
        { original: 'Did code reviews', improved: 'Led code review process for a team of 6 engineers, reducing production bugs by 35% through systematic quality checks' },
        { original: 'Made API endpoints', improved: 'Designed and implemented RESTful API architecture handling 100K+ daily requests with 99.9% uptime' },
      ];

  return {
    overallScore: score,
    scoreSummary: `Resume shows ${skills.length > 5 ? 'strong' : 'moderate'} technical foundation for ${role}. Key improvements in quantification and formatting recommended.`,
    atsScore,
    atsFeedback: `ATS compatibility is ${atsScore >= 60 ? 'decent' : 'below average'} — add more role-specific keywords and use standard section headings.`,
    atsKeywords: {
      found: skills.slice(0, 7),
      missing: ['Team Leadership', 'Agile Methodology', 'Cross-functional', 'Data-driven', 'Scalability', 'Performance Optimization', 'CI/CD'].filter(k => !resumeText.toLowerCase().includes(k.toLowerCase())).slice(0, 6)
    },
    improvedBullets: improvedBullets.slice(0, 5),
    missingSkills: missingSkillsPool.slice(0, 5),
    projectRecommendations: [
      { title: `${role} Portfolio Dashboard`, description: `Build a responsive dashboard showcasing key metrics relevant to ${role} positions, demonstrating frontend and data visualization skills.`, difficulty: 'intermediate' },
      { title: 'Open Source Contribution', description: 'Contribute to a popular open-source project in your tech stack to demonstrate collaboration and code quality.', difficulty: 'intermediate' },
      { title: 'Full-Stack CRUD Application', description: 'Build an end-to-end application with authentication, database, and deployment to showcase full-stack capabilities.', difficulty: 'beginner' },
      { title: 'System Design Case Study', description: 'Document the architecture decisions for a scalable system, showing problem-solving and design thinking.', difficulty: 'advanced' },
    ],
    sectionFeedback: {
      education: { score: 7, feedback: 'Education section is present and adequately formatted.', suggestions: ['Add relevant coursework', 'Include GPA if above 3.5', 'Add academic projects or honors'] },
      experience: { score: score >= 60 ? 6 : 5, feedback: 'Experience section needs stronger action verbs and quantified achievements.', suggestions: ['Start every bullet with a strong action verb', 'Add metrics (%, $, numbers) to each bullet', 'Focus on impact, not just responsibilities'] },
      skills: { score: skills.length > 5 ? 7 : 5, feedback: `${skills.length} technical skills identified. ${skills.length > 5 ? 'Good breadth of skills.' : 'Consider expanding your skills section.'}`, suggestions: ['Group skills by category (Languages, Frameworks, Tools)', 'Add proficiency levels', 'Include soft skills relevant to the role'] },
      projects: { score: 6, feedback: 'Projects section could better highlight technical complexity and outcomes.', suggestions: ['Add GitHub links to projects', 'Describe the tech stack used', 'Quantify project impact or scale'] },
      overall_format: { score: 6, feedback: 'Format is readable but could be more polished for ATS systems.', suggestions: ['Use consistent date formatting', 'Keep to 1-2 pages maximum', 'Use standard section headings', 'Ensure proper margins and font sizes'] }
    },
    grammarIssues: [
      { original: 'Responsible for developing', corrected: 'Developed', explanation: 'Avoid passive phrases like "Responsible for" — use direct action verbs instead.' },
      { original: 'Worked on various projects', corrected: 'Delivered 5+ projects spanning frontend and backend development', explanation: 'Vague language weakens impact. Be specific about what you worked on and quantify.' },
      { original: 'Good communication skills', corrected: 'Demonstrated strong communication skills through cross-team collaboration and stakeholder presentations', explanation: 'Show, don\'t tell — provide evidence of soft skills rather than just listing them.' },
    ],
    linkedinSummary: `${name !== 'the candidate' ? name : 'Passionate professional'} with expertise in ${skills.slice(0, 3).join(', ') || 'software development'}. Experienced in building scalable solutions and driving engineering excellence. Seeking to leverage technical depth and collaborative mindset in a ${role} role to deliver impactful products.`,
    strengths: [
      skills.length > 5 ? 'Strong and diverse technical skill set' : 'Foundational technical skills present',
      'Resume covers key sections (Education, Experience, Skills)',
      'Shows progression and growth potential',
    ],
    weaknesses: [
      'Bullet points lack quantified achievements and metrics',
      'Missing keywords important for ATS optimization',
      'Could better highlight leadership and collaboration experience',
    ],
    _mockAI: true,
  };
}

function getMockInterview(resumeText, jobRole) {
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';

  return {
    questions: [
      { id: 1, category: 'Technical', difficulty: 'Medium', question: `Explain how you would design a scalable architecture for a ${role} project using ${skills[0] || 'modern technologies'}.`, suggestedAnswer: `I would start by identifying the core requirements and expected scale. Using a microservices approach with ${skills.slice(0, 2).join(' and ') || 'appropriate frameworks'}, I'd ensure separation of concerns, implement caching layers, and design for horizontal scaling. I'd also set up monitoring and CI/CD pipelines early.`, tip: 'Structure your answer: Requirements → Architecture → Trade-offs → Monitoring', followUp: 'How would you handle a 10x increase in traffic?' },
      { id: 2, category: 'Technical', difficulty: 'Easy', question: `What is your experience with ${skills[1] || 'version control'} and how have you used it in team projects?`, suggestedAnswer: `I've used ${skills[1] || 'Git'} extensively for collaborative development, including branching strategies, pull requests, code reviews, and resolving merge conflicts. I follow GitFlow or trunk-based development depending on team size.`, tip: 'Mention specific workflows and tools you\'ve used', followUp: 'How do you handle merge conflicts in a large team?' },
      { id: 3, category: 'Technical', difficulty: 'Hard', question: `Describe a complex technical problem you solved. What was your debugging approach?`, suggestedAnswer: 'I encountered a production performance issue where API response times spiked during peak hours. I used profiling tools to identify a database query bottleneck, implemented query optimization and caching, reducing response times by 70%. I also set up alerts to catch similar issues proactively.', tip: 'Use the STAR method: Situation, Task, Action, Result', followUp: 'How do you prevent such issues from reaching production?' },
      { id: 4, category: 'Technical', difficulty: 'Medium', question: `How do you ensure code quality and maintainability in your projects?`, suggestedAnswer: 'I follow clean code principles, write unit and integration tests, use linting tools, and participate actively in code reviews. I also document critical architectural decisions and maintain up-to-date README files for every project.', tip: 'Reference specific tools and practices (ESLint, Jest, SonarQube, etc.)', followUp: 'What\'s your approach to technical debt?' },
      { id: 5, category: 'Behavioral', difficulty: 'Medium', question: 'Tell me about a time you disagreed with a team member. How did you resolve it?', suggestedAnswer: 'During a sprint planning session, a colleague and I disagreed on the tech stack choice. I proposed we create small proof-of-concepts for both options and evaluate them against our requirements. This data-driven approach led to a consensus, and we chose the option that better served scalability needs.', tip: 'Show emotional intelligence, active listening, and collaborative resolution', followUp: 'What did you learn from that experience?' },
      { id: 6, category: 'Behavioral', difficulty: 'Easy', question: 'Describe a project you\'re most proud of and why.', suggestedAnswer: `I'm most proud of a project where I ${skills.length > 0 ? `leveraged ${skills[0]}` : 'applied my technical skills'} to build a solution that directly impacted users. The project taught me about end-to-end ownership, from requirements gathering to deployment and monitoring.`, tip: 'Connect the project to personal growth and tangible impact', followUp: 'What would you do differently if you could start over?' },
      { id: 7, category: 'Behavioral', difficulty: 'Medium', question: 'How do you handle tight deadlines and competing priorities?', suggestedAnswer: 'I prioritize tasks using an impact-effort matrix and communicate proactively with stakeholders about realistic timelines. I break large tasks into smaller deliverables, focus on MVP first, and delegate when possible. Transparency about progress helps manage expectations.', tip: 'Demonstrate time management, communication, and prioritization skills', followUp: 'Give an example of when you had to say no to a request.' },
      { id: 8, category: 'Situational', difficulty: 'Hard', question: `If you joined our team as a ${role} and found the codebase had significant technical debt, how would you approach it?`, suggestedAnswer: 'I\'d first understand the existing architecture and identify the highest-impact areas of technical debt. I\'d propose a gradual refactoring plan that can be executed alongside feature development — addressing the most critical issues first. I\'d advocate for allocating a percentage of each sprint to debt reduction and get buy-in from the team.', tip: 'Show pragmatism — acknowledge business needs while advocating for quality', followUp: 'How would you convince management to invest in refactoring?' },
      { id: 9, category: 'Situational', difficulty: 'Medium', question: 'A critical production bug is reported during off-hours. How do you handle it?', suggestedAnswer: 'I\'d acknowledge the alert, quickly assess severity and user impact, and communicate status to the team. For critical issues, I\'d implement a quick fix or rollback to restore service, then do a proper root cause analysis the next day. I\'d document the incident and propose preventive measures.', tip: 'Show calm under pressure and structured incident response', followUp: 'How would you set up processes to reduce such incidents?' },
      { id: 10, category: 'Situational', difficulty: 'Easy', question: 'You receive unclear requirements for a feature. What do you do?', suggestedAnswer: 'I\'d schedule a quick clarification meeting with the product owner, prepare specific questions, and propose my understanding of the requirements in writing. I\'d suggest creating user stories with clear acceptance criteria before starting development, and might build a quick prototype to validate assumptions.', tip: 'Proactive communication prevents wasted effort', followUp: 'How do you handle scope creep during development?' },
    ],
    _mockAI: true,
  };
}

function getMockCoverLetter(resumeText, jobRole, companyName) {
  const name = extractName(resumeText);
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';
  const company = companyName || 'your organization';

  return {
    coverLetter: `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${role} position at ${company}. With hands-on experience in ${skills.slice(0, 3).join(', ') || 'software development'} and a proven track record of delivering high-quality solutions, I am confident I can make a meaningful contribution to your team.\n\nThroughout my career, I have developed strong expertise in building scalable applications and collaborating effectively with cross-functional teams. My experience with ${skills.slice(0, 2).join(' and ') || 'modern development practices'} has equipped me to tackle complex challenges and deliver results that drive business value. I am particularly drawn to ${company}'s commitment to innovation and would welcome the opportunity to bring my technical skills and problem-solving mindset to your engineering team.\n\nI am excited about the prospect of contributing to ${company}'s mission and growth. I would welcome the opportunity to discuss how my background and skills align with your team's needs. Thank you for considering my application.\n\nSincerely,\n${name !== 'the candidate' ? name : '[Your Name]'}`,
    keyPoints: [
      `Technical expertise in ${skills.slice(0, 3).join(', ') || 'relevant technologies'}`,
      'Track record of delivering scalable solutions',
      'Strong cross-functional collaboration skills',
      `Alignment with ${company}'s mission and values`,
    ],
    customizationTips: [
      `Research ${company}'s recent projects and reference them specifically`,
      'Add quantified achievements from your most relevant experience',
      'Mention a specific product or initiative at the company that excites you',
      'Tailor the skills mentioned to match the exact job description',
    ],
    _mockAI: true,
  };
}

function getMockJDCompare(resumeText, jobDescription) {
  const resumeSkills = extractSkillsFromText(resumeText);
  const jdSkills = extractSkillsFromText(jobDescription);
  const matched = resumeSkills.filter(s => jdSkills.map(j => j.toLowerCase()).includes(s.toLowerCase()));
  const missing = jdSkills.filter(s => !resumeSkills.map(r => r.toLowerCase()).includes(s.toLowerCase()));
  const score = Math.min(90, Math.max(30, Math.round((matched.length / Math.max(jdSkills.length, 1)) * 100)));

  return {
    matchScore: score,
    matchSummary: `Resume matches ${score}% of the job requirements. ${missing.length > 0 ? `Key gaps in ${missing.slice(0, 2).join(' and ')}.` : 'Good alignment overall.'}`,
    matchedSkills: matched.length > 0 ? matched : ['General software development experience'],
    missingSkills: missing.length > 0 ? missing : ['No major skill gaps detected'],
    matchedExperience: ['Software development experience aligns with role requirements', 'Technical project experience is relevant', 'Educational background supports the role'],
    gaps: missing.length > 0 ? missing.map(s => `No demonstrated experience with ${s}`) : ['Consider adding more quantified achievements'],
    tailoringTips: [
      'Mirror the exact keywords from the job description in your resume',
      'Reorder your skills section to prioritize JD-matched skills first',
      `Add projects or coursework demonstrating ${missing[0] || 'additional relevant'} skills`,
      'Quantify your achievements to match the impact level the JD implies',
    ],
    keywordMatches: { found: matched.slice(0, 6), missing: missing.slice(0, 6) },
    _mockAI: true,
  };
}

function getMockRewrite(resumeText, jobRole, style) {
  const name = extractName(resumeText);
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';

  return {
    rewrittenResume: `${name !== 'the candidate' ? name.toUpperCase() : 'YOUR NAME'}\n${role} | ${skills.slice(0, 4).join(' • ') || 'Full-Stack Development'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROFESSIONAL SUMMARY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nResults-driven ${role} with expertise in ${skills.slice(0, 3).join(', ') || 'modern technologies'}. Proven track record of delivering scalable solutions and collaborating effectively with cross-functional teams. Passionate about clean code, performance optimization, and continuous learning.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTECHNICAL SKILLS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${skills.length > 0 ? skills.join(' | ') : 'Add your technical skills here'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEXPERIENCE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[Your experience rewritten with strong action verbs and quantified impact]\n• Architected and delivered production-grade applications serving thousands of users\n• Optimized system performance, reducing load times by 40% and improving user retention\n• Led code reviews and mentored junior developers, improving team velocity by 25%\n• Implemented CI/CD pipelines, reducing deployment time from hours to minutes\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEDUCATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[Your education details, formatted consistently]`,
    changesSummary: [
      'Added a compelling professional summary section',
      'Restructured with clear section headings for ATS compatibility',
      'Replaced passive language with strong action verbs',
      'Added quantified metrics to experience bullets',
      `Reorganized skills to highlight ${role}-relevant technologies first`,
    ],
    improvementScore: 35,
    _mockAI: true,
  };
}

function getMockSalary(resumeText, jobRole, location) {
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';
  const loc = location || 'US Average';
  const level = skills.length > 8 ? 'Senior' : skills.length > 4 ? 'Mid-Level' : 'Junior';
  const base = level === 'Senior' ? 130000 : level === 'Mid-Level' ? 95000 : 65000;

  return {
    estimatedLevel: level,
    yearsExperience: level === 'Senior' ? '5-8' : level === 'Mid-Level' ? '2-5' : '0-2',
    salaryRange: { low: base - 15000, mid: base, high: base + 25000, currency: 'USD' },
    factors: [
      `Technical skill breadth (${skills.length} technologies identified)`,
      `Target role: ${role}`,
      `Location: ${loc}`,
      'Current market demand for these skills',
      'Experience level based on resume content',
    ],
    negotiationTips: [
      'Research company-specific salary ranges on Glassdoor and Levels.fyi',
      'Highlight unique skills or certifications that add value',
      'Consider total compensation: base + equity + bonus + benefits',
      'Practice stating your desired range confidently with data to back it up',
      'Don\'t reveal your current salary — focus on market value instead',
    ],
    marketInsights: `The ${role} market in ${loc} is competitive. ${level}-level candidates with skills in ${skills.slice(0, 3).join(', ') || 'modern technologies'} are in strong demand. Remote opportunities have expanded salary ranges, and candidates with cloud and DevOps experience often command a premium.`,
    _mockAI: true,
  };
}

function getMockCareerPaths(resumeText, jobRole) {
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';

  return {
    currentLevel: skills.length > 8 ? 'Mid-Senior Level' : skills.length > 4 ? 'Mid Level' : 'Early Career',
    paths: [
      {
        title: `Senior ${role} → Tech Lead`,
        timeline: '2-4 years',
        steps: ['Deepen expertise in core technologies', 'Lead a small team or project', 'Mentor junior developers', 'Take ownership of architectural decisions'],
        requiredSkills: ['System Design', 'Technical Mentoring', 'Code Review Leadership', 'Architecture Patterns'],
        potentialRoles: [`Senior ${role}`, 'Tech Lead', 'Staff Engineer'],
        salaryGrowth: '30-60%',
      },
      {
        title: 'Engineering Management Track',
        timeline: '3-5 years',
        steps: ['Develop people management skills', 'Lead sprint planning and retrospectives', 'Build cross-team relationships', 'Get certified in project management (PMP/Scrum Master)'],
        requiredSkills: ['People Management', 'Strategic Planning', 'Stakeholder Communication', 'Budget Management'],
        potentialRoles: ['Engineering Manager', 'Director of Engineering', 'VP Engineering'],
        salaryGrowth: '40-80%',
      },
      {
        title: 'Specialist / Domain Expert',
        timeline: '2-3 years',
        steps: ['Deep-dive into a niche area (ML, Security, Cloud Architecture)', 'Publish articles or give talks', 'Contribute to open-source projects', 'Obtain relevant certifications'],
        requiredSkills: ['Deep Domain Knowledge', 'Public Speaking', 'Technical Writing', 'Research Skills'],
        potentialRoles: ['Principal Engineer', 'Solutions Architect', 'Domain Expert', 'Developer Advocate'],
        salaryGrowth: '35-70%',
      },
    ],
    certifications: [
      { name: 'AWS Solutions Architect', value: 'Validates cloud architecture skills — highly valued in the industry' },
      { name: 'Certified Kubernetes Administrator', value: 'Demonstrates container orchestration expertise for DevOps roles' },
      { name: 'Professional Scrum Master (PSM)', value: 'Useful for leadership and engineering management track' },
    ],
    generalAdvice: `Based on your current skill set in ${skills.slice(0, 3).join(', ') || 'software development'}, you have strong growth potential. Focus on deepening one or two core competencies while broadening your understanding of system design and architecture. Build your personal brand through open-source contributions, technical blog posts, or conference talks. Network actively within your target industry and seek mentorship from senior professionals in your desired career path.`,
    _mockAI: true,
  };
}

function getMockGradeAnswer(question, userAnswer) {
  const wordCount = userAnswer.split(/\s+/).length;
  const score = Math.min(8, Math.max(4, Math.round(3 + wordCount / 15)));
  const grades = { 8: 'A', 7: 'B+', 6: 'B', 5: 'C+', 4: 'C' };

  return {
    score,
    grade: grades[score] || 'B',
    strengths: [
      wordCount > 30 ? 'Good level of detail in the response' : 'Concise and to the point',
      'Addresses the core question',
      'Shows relevant thinking about the topic',
    ],
    improvements: [
      'Add a specific example from your experience using the STAR method',
      'Quantify the impact or results of your actions',
      'Connect your answer back to how it benefits the hiring company',
    ],
    revisedAnswer: `${userAnswer.trim()} — To strengthen this answer, I would add specific metrics: for example, this approach improved efficiency by X% or saved Y hours per week. I would also connect this to the company's goals by explaining how these skills directly benefit the team.`,
    tip: 'Always use the STAR method (Situation, Task, Action, Result) for behavioral questions, and include measurable outcomes.',
    _mockAI: true,
  };
}

function getMockCompanyQuestions(resumeText, companyName, jobRole) {
  const role = jobRole || 'Software Engineer';
  return {
    company: companyName,
    interviewStyle: `${companyName} typically uses a mix of technical and behavioral interviews, assessing problem-solving skills, cultural fit, and technical depth.`,
    questions: [
      { id: 1, type: 'Technical', question: `Design a simplified version of ${companyName}'s core product feature. Explain your architecture.`, why: `${companyName} values system design thinking`, suggestedApproach: 'Start with requirements, draw a high-level architecture, then deep-dive into key components.', sampleAnswer: 'I would begin by clarifying user requirements and expected scale...' },
      { id: 2, type: 'Behavioral', question: `Tell me about a time you had to deliver results under tight deadlines at a previous role.`, why: `${companyName} values execution and delivery`, suggestedApproach: 'Use STAR format with specific metrics.', sampleAnswer: 'During a critical product launch, I prioritized features using impact analysis...' },
      { id: 3, type: 'Culture Fit', question: `What about ${companyName}'s mission resonates with you?`, why: 'Assesses genuine interest and cultural alignment', suggestedApproach: `Research ${companyName}'s values and connect them to your personal goals.`, sampleAnswer: `I admire ${companyName}'s focus on innovation and user-centric design...` },
      { id: 4, type: 'Technical', question: `How would you optimize a slow database query in a production system?`, why: 'Tests practical problem-solving skills', suggestedApproach: 'Explain diagnosis process, then optimization techniques.', sampleAnswer: 'I would start by analyzing the query execution plan, then look at indexing strategies...' },
      { id: 5, type: 'System Design', question: `Design a real-time notification system that can scale to millions of users.`, why: `${companyName} products operate at significant scale`, suggestedApproach: 'Discuss WebSockets, message queues, and scalability patterns.', sampleAnswer: 'I would use a pub/sub architecture with WebSocket connections...' },
      { id: 6, type: 'Behavioral', question: 'Describe a situation where you had to learn a new technology quickly.', why: 'Tests adaptability and learning agility', suggestedApproach: 'Highlight the learning process, resources used, and outcome.', sampleAnswer: 'When our team adopted Kubernetes, I spent two weeks doing hands-on labs...' },
      { id: 7, type: 'Case Study', question: `If ${companyName}'s ${role} team noticed a 20% drop in user engagement, how would you investigate?`, why: 'Tests analytical and product thinking', suggestedApproach: 'Structure: Define metrics → Hypothesize causes → Investigate data → Propose solutions.', sampleAnswer: 'First, I would confirm the metric definition and time range...' },
      { id: 8, type: 'Technical', question: 'Explain the difference between SQL and NoSQL databases. When would you choose each?', why: 'Fundamental knowledge assessment', suggestedApproach: 'Compare use cases, consistency models, and scalability characteristics.', sampleAnswer: 'SQL databases excel at structured, relational data with ACID transactions...' },
    ],
    tips: [
      `Research ${companyName}'s engineering blog and recent product launches`,
      'Prepare 3-4 STAR stories from your experience',
      `Practice whiteboard coding if applying for ${role}`,
      `Understand ${companyName}'s core products and competitive landscape`,
    ],
    _mockAI: true,
  };
}

function getMockLinkedIn(resumeText, jobRole) {
  const name = extractName(resumeText);
  const skills = extractSkillsFromText(resumeText);
  const role = jobRole || 'Software Developer';

  return {
    headline: `${role} | ${skills.slice(0, 3).join(' • ') || 'Full-Stack Development'} | Building scalable solutions that drive impact`,
    about: `I'm a passionate ${role} who thrives on turning complex problems into elegant, scalable solutions. With expertise in ${skills.slice(0, 4).join(', ') || 'modern software technologies'}, I bring both technical depth and a collaborative mindset to every team I join.\n\nThroughout my career, I've focused on delivering high-quality code, mentoring fellow developers, and staying at the cutting edge of technology. I believe in writing clean, testable code and building systems that are both performant and maintainable.\n\nI'm always open to connecting with fellow engineers, discussing new technologies, or exploring exciting opportunities. Let's build something great together!`,
    skills: skills.length > 0 ? skills.slice(0, 10) : ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'REST APIs', 'Agile'],
    featuredSection: [
      'Pin your best GitHub project with a compelling description',
      'Share a technical blog post or article you\'ve written',
      'Add a portfolio link or project demo video',
    ],
    experienceTips: [
      'Use the same strong action verbs as your resume',
      'Add media (screenshots, links) to each experience entry',
      'Request recommendations from colleagues and managers',
    ],
    keywords: [role, ...skills.slice(0, 5), 'Software Engineering', 'Problem Solving', 'Team Collaboration'],
    connectivityTips: [
      'Engage with posts from people in your target companies',
      'Join LinkedIn groups related to your tech stack',
      'Post weekly about something you learned or built',
      'Send personalized connection requests mentioning shared interests',
    ],
    _mockAI: true,
  };
}

function getMockEmail(resumeText, emailType, recipientRole, companyName) {
  const name = extractName(resumeText);
  const skills = extractSkillsFromText(resumeText);
  const company = companyName || 'the company';
  const recipient = recipientRole || 'Hiring Manager';
  const displayName = name !== 'the candidate' ? name : '[Your Name]';

  const templates = {
    'Follow-up': {
      subject: `Following Up — ${displayName}'s Application`,
      body: `Dear ${recipient},\n\nI hope this message finds you well. I recently applied for a position at ${company} and wanted to follow up on my application.\n\nI remain very enthusiastic about the opportunity to contribute to your team, particularly with my experience in ${skills.slice(0, 2).join(' and ') || 'software development'}. I believe my background aligns well with your team's needs.\n\nI would welcome the chance to discuss how I can add value to ${company}. Please let me know if there are any updates on the hiring process or if you need any additional information from my end.\n\nThank you for your time and consideration.\n\nBest regards,\n${displayName}`,
    },
    'Networking': {
      subject: `Connecting Over Shared Interest in Technology`,
      body: `Hi ${recipient},\n\nI came across your profile and was impressed by your work at ${company}. As a fellow professional in ${skills[0] || 'software engineering'}, I'd love to connect and learn about your experience.\n\nI'm currently exploring opportunities in the field and would greatly appreciate any insights you could share about working at ${company} or the industry in general.\n\nWould you be open to a brief 15-minute chat? I'm flexible with scheduling and happy to meet at your convenience.\n\nBest regards,\n${displayName}`,
    },
    'Thank You': {
      subject: `Thank You for the Interview — ${displayName}`,
      body: `Dear ${recipient},\n\nThank you for taking the time to meet with me today. I thoroughly enjoyed our conversation about the role at ${company} and learning more about the team's exciting projects.\n\nOur discussion reinforced my enthusiasm for the position. I'm particularly excited about the opportunity to apply my ${skills.slice(0, 2).join(' and ') || 'technical'} skills to contribute to your team's goals.\n\nPlease don't hesitate to reach out if you need any additional information. I look forward to hearing from you.\n\nWarm regards,\n${displayName}`,
    },
  };

  const tmpl = templates[emailType] || templates['Follow-up'];

  return {
    subject: tmpl.subject,
    body: tmpl.body,
    tips: [
      'Send within 24 hours for maximum impact',
      'Keep the email concise — under 200 words',
      'Personalize each email with specific details from your interaction',
      'Proofread carefully before sending',
    ],
    alternatives: [
      { subject: `Quick Follow-Up — ${displayName}`, opening: `I wanted to touch base regarding my application for the position at ${company}...` },
      { subject: `${displayName} — Excited About the Opportunity at ${company}`, opening: `Thank you again for considering my application. I'm writing to reiterate my strong interest...` },
    ],
    _mockAI: true,
  };
}

module.exports = {
  getMockAnalysis,
  getMockInterview,
  getMockCoverLetter,
  getMockJDCompare,
  getMockRewrite,
  getMockSalary,
  getMockCareerPaths,
  getMockGradeAnswer,
  getMockCompanyQuestions,
  getMockLinkedIn,
  getMockEmail,
};
