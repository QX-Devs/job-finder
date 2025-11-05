const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, ExternalHyperlink, convertInchesToTwip, TabStopType } = require('docx');
const { Resume } = require('../models');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}
const UPLOADS_DIR = path.join(GENERATED_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function buildDocxFromResume(data, userProfile) {
  const safe = (v, d = '') => (v === undefined || v === null ? d : v);
  const name = safe(userProfile?.fullName, '');
  const email = safe(userProfile?.email, '');
  const phone = safe(userProfile?.phone, '');
  const githubUrl = safe(data.github, '');
  const linkedinUrl = safe(data.linkedin, '');

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20 }, paragraph: { spacing: { after: 90, line: 270 } } },
      },
      paragraphStyles: [
        { id: 'SectionHeading', name: 'SectionHeading', run: { font: 'Arial', size: 28, bold: true }, paragraph: { spacing: { after: 90, before: 160 }, keepNext: true, keepLines: true } },
        { id: 'JobTitle', name: 'JobTitle', run: { font: 'Arial', size: 22, bold: true }, paragraph: { spacing: { after: 60 }, keepNext: true } },
        { id: 'RightAlignedDate', name: 'RightAlignedDate', run: { font: 'Arial', size: 19, bold: true }, paragraph: { spacing: { after: 80 }, tabStops: [{ type: TabStopType.RIGHT, position: convertInchesToTwip(7.0) }] } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) }, margin: { top: 650, right: 720, bottom: 650, left: 720 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: name.toUpperCase(), bold: true, size: 68, font: 'Arial' }) ], spacing: { after: 80, line: 270 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: safe(data.title), bold: true, size: 26, font: 'Arial' }) ], spacing: { after: 170 } }),

        new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'CONTACT INFORMATION' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }, columnWidths: [5000, 5000], rows: [
          new TableRow({ children: [
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: '• ' }), new TextRun({ text: 'Mobile', bold: true }), new TextRun({ text: `: ${phone}` }) ], spacing: { line: 270, after: 50 } }) ] }),
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: '• ' }), new TextRun({ text: 'GitHub', bold: true }), new TextRun({ text: ': ' }), new ExternalHyperlink({ children: [ new TextRun({ text: githubUrl, style: 'Hyperlink' }) ], link: githubUrl }) ], spacing: { line: 270, after: 50 } }) ] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: '• ' }), new TextRun({ text: 'Email', bold: true }), new TextRun({ text: `: ${email}` }) ], spacing: { line: 270, after: 50 } }) ] }),
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: '• ' }), new TextRun({ text: 'LinkedIn', bold: true }), new TextRun({ text: ': ' }), new ExternalHyperlink({ children: [ new TextRun({ text: linkedinUrl, style: 'Hyperlink' }) ], link: linkedinUrl }) ], spacing: { line: 270, after: 50 } }) ] }),
          ]}),
        ]}),

        new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'PROFESSIONAL SUMMARY' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }),
        new Paragraph({ children: [ new TextRun({ text: safe(data.summary) }) ], alignment: AlignmentType.JUSTIFIED, spacing: { after: 170, line: 290 } }),

        ...(experience.length ? [ new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'WORK EXPERIENCE' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }) ] : []),
        ...experience.flatMap((job, jobIndex) => [
          new Paragraph({ style: 'JobTitle', children: [ new TextRun({ text: safe(job.position || job.title) }) ] }),
          new Paragraph({ style: 'RightAlignedDate', children: [ new TextRun({ text: safe(job.company) }), new TextRun({ text: '\t' + (safe(job.startDate) + (job.current ? ' - Present' : (job.endDate ? ' - ' + job.endDate : ''))) }) ] }),
          ...(Array.isArray(job.description) ? job.description : (safe(job.description, '') ? [safe(job.description)] : [])).map((resp, idx) => new Paragraph({ children: [ new TextRun({ text: resp, size: 19, font: 'Arial' }) ], spacing: { after: idx === 0 ? 60 : 50, line: 270 }, alignment: AlignmentType.JUSTIFIED }))
        ]),

        ...(education.length ? [ new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'EDUCATION' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }) ] : []),
        ...education.map(edu => [
          new Paragraph({ children: [ new TextRun({ text: safe(edu.degree), bold: true, size: 22, font: 'Arial' }) ], spacing: { after: 60 } }),
          new Paragraph({ style: 'RightAlignedDate', children: [ new TextRun({ text: safe(edu.institution) }), new TextRun({ text: '\tGraduated: ' + safe(edu.graduationYear || edu.graduationDate, '') }) ] })
        ]).flat(),

        new Paragraph({ children: [ new PageBreak() ] }),

        ...(skills.length ? [ new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'SKILLS' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }) ] : []),
        ...skills.map((s) => new Paragraph({ children: [ new TextRun({ text: typeof s === 'string' ? s : (s.skillName || '') }) ], spacing: { after: 50, line: 250 }, alignment: AlignmentType.JUSTIFIED })),

        ...(languages.length ? [ new Paragraph({ style: 'SectionHeading', children: [ new TextRun({ text: 'LANGUAGES' }) ], border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } } }) ] : []),
        ...languages.map((lang) => new Paragraph({ children: [ new TextRun({ text: typeof lang === 'string' ? lang : (lang.language || '') , bold: true, size: 19, font: 'Arial' }) ], spacing: { after: 60, line: 250 } })),
      ],
    }],
  });

  return doc;
}

exports.createResume = async (req, res) => {
  try {
    const { title = 'My Resume', template = 'modern', content = {}, isPublic = false } = req.body;
    const record = await Resume.create({ userId: req.user.id, title, template, content, isPublic, lastModified: new Date() });
    return res.status(201).json({ success: true, data: { id: record.id } });
  } catch (err) {
    console.error('Create resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save resume' });
  }
};

exports.generateDocx = async (req, res) => {
  try {
    const resumeData = req.body; // expects { title, summary, skills[], experience[], education[], languages[], github, linkedin }
    const doc = buildDocxFromResume(resumeData, req.user);
    const buffer = await Packer.toBuffer(doc);
    const safeName = (req.user.fullName || 'resume').replace(/[^a-z0-9_\-]+/gi, '_');
    const filename = `${safeName}_${Date.now()}.docx`;
    const filepath = path.join(GENERATED_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    // Save or update resume content to DB
    const record = await Resume.create({
      userId: req.user.id,
      title: resumeData.title || 'My Resume',
      template: resumeData.template || 'modern',
      content: resumeData,
      isPublic: false,
      lastModified: new Date(),
    });

    return res.json({ success: true, resumeId: record.id, downloadUrl: `/api/files/${filename}`, filename });
  } catch (err) {
    console.error('Generate DOCX error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate resume' });
  }
};

exports.listResumes = async (req, res) => {
  try {
    const resumes = await Resume.findAll({ where: { userId: req.user.id } });
    return res.json({ success: true, data: resumes });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch resumes' });
  }
};


// Upload an existing CV file and create a resume record referencing it
exports.uploadResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const storedFilename = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const size = req.file.size;

    const publicPath = `/api/files/uploads/${storedFilename}`;

    const content = {
      uploadedFile: {
        originalName,
        storedFilename,
        mimeType,
        size,
        url: publicPath
      }
    };

    const record = await Resume.create({
      userId: req.user.id,
      title: originalName || 'Uploaded CV',
      template: 'uploaded',
      content,
      isPublic: false,
      lastModified: new Date()
    });

    return res.status(201).json({ success: true, data: { id: record.id, file: content.uploadedFile } });
  } catch (err) {
    console.error('Upload resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload resume' });
  }
};

// Securely download an uploaded resume file if owned by the user
exports.downloadUploadedResume = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    // Verify the user owns a resume pointing to this stored filename
    const record = await Resume.findOne({
      where: {
        userId: req.user.id,
        content: {
          uploadedFile: { storedFilename: filename }
        }
      }
    });

    // If above JSON query doesn't work with dialect, fallback to scan
    let ownerRecord = record;
    if (!ownerRecord) {
      const all = await Resume.findAll({ where: { userId: req.user.id } });
      ownerRecord = all.find(r => r.content?.uploadedFile?.storedFilename === filename);
      if (!ownerRecord) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
    }

    // Ensure path is within uploads dir
    const safeBase = path.resolve(UPLOADS_DIR);
    const target = path.resolve(UPLOADS_DIR, filename);
    if (!target.startsWith(safeBase)) {
      return res.status(400).json({ success: false, error: 'Invalid file path' });
    }
    if (!fs.existsSync(target)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const downloadName = ownerRecord.content?.uploadedFile?.originalName || filename;
    return res.download(target, downloadName);
  } catch (err) {
    console.error('Download resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to download file' });
  }
};
