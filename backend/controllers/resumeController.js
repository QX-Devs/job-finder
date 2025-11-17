const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, ExternalHyperlink, convertInchesToTwip, TabStopType, HeadingLevel, ShadingType } = require('docx');
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
  const safe = (v, d = '') => (v === undefined || v === null || v === '' ? d : String(v));
  const name = safe(userProfile?.fullName, '');
  const email = safe(userProfile?.email, '');
  const phone = safe(userProfile?.phone, '');
  
  // Handle GitHub and LinkedIn URLs - extract display text
  const githubUrl = safe(data.github, '');
  const githubDisplay = githubUrl ? (githubUrl.includes('github.com/') ? githubUrl.split('github.com/')[1].replace(/\/$/, '') : githubUrl) : '';
  
  const linkedinUrl = safe(data.linkedin, '');
  const linkedinDisplay = linkedinUrl ? (linkedinUrl.includes('linkedin.com/in/') ? linkedinUrl.split('linkedin.com/in/')[1].replace(/\/$/, '') : linkedinUrl) : '';

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];

  // Format date from YYYY-MM to readable format
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    if (!year) return dateStr;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return month ? `${monthNames[parseInt(month) - 1]} ${year}` : year;
  };

  function formatTimestamp() {
    const d = new Date();
  
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
  
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }
  // Format experience period
  const formatPeriod = (startDate, endDate, current) => {
    const start = formatDate(startDate);
    if (current) return start ? `${start} - Present` : 'Present';
    const end = formatDate(endDate);
    return start && end ? `${start} - ${end}` : (start || end || '');
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 18, // Reduced from 20 (10pt -> 9pt)
          },
          paragraph: {
            spacing: { 
              after: 60, // Reduced from 90
              line: 240, // Reduced from 270 (1.2x instead of 1.35x)
              lineRule: 'auto' 
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Arial',
            size: 18, // Reduced from 20
          },
          paragraph: {
            spacing: { after: 60, line: 240, lineRule: 'auto' }, // Reduced spacing
          },
        },
        {
          id: 'SectionHeading',
          name: 'SectionHeading',
          run: {
            font: 'Arial',
            size: 24, // Reduced from 28 (14pt -> 12pt)
            bold: true,
          },
          paragraph: {
            spacing: { 
              after: 60, // Reduced from 90
              before: 100 // Reduced from 160
            },
            keepNext: true,
            keepLines: true,
          },
        },
        {
          id: 'SubHeading',
          name: 'SubHeading',
          run: {
            font: 'Arial',
            size: 18, // Reduced from 20
            bold: true,
          },
          paragraph: {
            spacing: { 
              after: 40, // Reduced from 50
              before: 60 // Reduced from 90
            },
            keepNext: true,
            keepLines: true,
          },
        },
        {
          id: 'JobTitle',
          name: 'JobTitle',
          run: {
            font: 'Arial',
            size: 20, // Reduced from 22
            bold: true,
          },
          paragraph: {
            spacing: { after: 40 }, // Reduced from 60
            keepNext: true,
          },
        },
        {
          id: 'RightAlignedDate',
          name: 'RightAlignedDate',
          run: {
            font: 'Arial',
            size: 17, // Reduced from 19
            bold: true,
          },
          paragraph: {
            spacing: { after: 50 }, // Reduced from 80
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.0),
              },
            ],
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullet',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 260 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: convertInchesToTwip(8.5),
            height: convertInchesToTwip(11),
          },
          margin: {
            top: 500, // Reduced from 650 (0.5" -> 0.42")
            right: 600, // Reduced from 720 (0.6" -> 0.5")
            bottom: 500, // Reduced from 650
            left: 600, // Reduced from 720
          },
        },
      },
      children: [
        // Name - Large centered text
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: name.toUpperCase(),
              bold: true,
              size: 52, // Reduced from 68 (34pt -> 26pt)
              font: 'Arial',
            }),
          ],
          spacing: { after: 50, line: 240 }, // Reduced spacing
        }),

        // Title centered
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: safe(data.title),
              bold: true,
              size: 22, // Reduced from 26 (13pt -> 11pt)
              font: 'Arial',
            }),
          ],
          spacing: { after: 100 }, // Reduced from 170
        }),

        // CONTACT INFORMATION
        new Paragraph({
          style: 'SectionHeading',
          children: [
            new TextRun({
              text: 'CONTACT INFORMATION',
            }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
        }),

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          columnWidths: [5000, 5000],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'Mobile', bold: true, size: 18 }),
                        new TextRun({ text: ': ' + phone, size: 18 }),
                      ],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: githubUrl ? [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'GitHub', bold: true, size: 18 }),
                        new TextRun({ text: ': ', size: 18 }),
                        new ExternalHyperlink({
                          children: [
                            new TextRun({
                              text: githubDisplay || githubUrl,
                              style: 'Hyperlink',
                              size: 18,
                            }),
                          ],
                          link: githubUrl,
                        }),
                      ] : [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'GitHub', bold: true, size: 18 }),
                        new TextRun({ text: ': N/A', size: 18 }),
                      ],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'Email', bold: true, size: 18 }),
                        new TextRun({ text: ': ' + email, size: 18 }),
                      ],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: linkedinUrl ? [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'LinkedIn', bold: true, size: 18 }),
                        new TextRun({ text: ': ', size: 18 }),
                        new ExternalHyperlink({
                          children: [
                            new TextRun({
                              text: linkedinDisplay || linkedinUrl,
                              style: 'Hyperlink',
                              size: 18,
                            }),
                          ],
                          link: linkedinUrl,
                        }),
                      ] : [
                        new TextRun({ text: '• ', size: 18 }),
                        new TextRun({ text: 'LinkedIn', bold: true, size: 18 }),
                        new TextRun({ text: ': N/A', size: 18 }),
                      ],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
          ],
        }),

        // PROFESSIONAL SUMMARY
        new Paragraph({
          style: 'SectionHeading',
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
            }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: safe(data.summary),
              size: 18, // Reduced from 20
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240, lineRule: 'auto' }, // Reduced spacing
        }),

        // WORK EXPERIENCE
        ...(experience.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'WORK EXPERIENCE',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
          }),
        ] : []),
        ...experience.flatMap((job, jobIndex) => {
          const position = safe(job.position || job.title);
          const company = safe(job.company);
          const period = formatPeriod(job.startDate, job.endDate, job.current);
          const responsibilities = Array.isArray(job.description) 
            ? job.description 
            : (job.description ? job.description.split('\n').filter(Boolean) : []);

          return [
            new Paragraph({
              style: 'JobTitle',
              children: [
                new TextRun({
                  text: position,
                }),
              ],
            }),
            new Paragraph({
              style: 'RightAlignedDate',
              children: [
                new TextRun({
                  text: company,
                }),
                new TextRun({
                  text: '\t' + period,
                }),
              ],
            }),
            ...responsibilities.map((resp, idx) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: resp,
                    size: 17, // Reduced from 19
                    font: 'Arial',
                  }),
                ],
                numbering: { level: 0, reference: 'bullet' },
                spacing: { 
                  after: (idx === responsibilities.length - 1) ? 
                    (jobIndex === experience.length - 1 ? 100 : 70) : 40, // Reduced spacing
                  line: 240, // Reduced from 270
                  lineRule: 'auto'
                },
                alignment: AlignmentType.JUSTIFIED,
              })
            ),
          ];
        }),

        // EDUCATION
        ...(education.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'EDUCATION',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
          }),
        ] : []),
        ...education.map((edu, eduIndex) => [
          new Paragraph({
            children: [
              new TextRun({
                text: safe(edu.degree),
                bold: true,
                size: 20, // Reduced from 22
                font: 'Arial',
              }),
            ],
            spacing: { after: 40 }, // Reduced from 60
          }),
          new Paragraph({
            style: 'RightAlignedDate',
            children: [
              new TextRun({
                text: safe(edu.institution),
              }),
              new TextRun({
                text: '\tGraduated: ' + formatDate(edu.graduationDate || edu.graduationYear),
              }),
            ],
            spacing: { after: eduIndex === education.length - 1 ? 0 : 0 },
          }),
        ]).flat(),

        // SKILLS (no page break - keep with Languages section)
        ...(skills.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'SKILLS',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            keepNext: languages.length > 0, // Keep Skills with Languages if Languages exist
          }),
        ] : []),
        ...(skills.length > 0 ? skills.map((skill, idx) => 
          new Paragraph({
            children: [
              new TextRun({
                text: typeof skill === 'string' ? skill : (skill.skillName || ''),
                size: 17, // Reduced from 19
                font: 'Arial',
              }),
            ],
            numbering: { level: 0, reference: 'bullet' },
            spacing: { 
              after: idx === skills.length - 1 ? 60 : 40, // Reduced spacing
              line: 220, // Reduced from 250
              lineRule: 'auto'
            },
            alignment: AlignmentType.JUSTIFIED,
            keepNext: (idx === skills.length - 1) && languages.length > 0, // Keep last skill with Languages section
          })
        ) : []),

        // LANGUAGES
        ...(languages.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'LANGUAGES',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
          }),
        ] : []),
        ...languages.map((lang, idx) => 
          new Paragraph({
            children: [
              new TextRun({
                text: typeof lang === 'string' ? lang : (lang.language || ''),
                bold: true,
                size: 17, // Reduced from 19
                font: 'Arial',
              }),
            ],
            numbering: { level: 0, reference: 'bullet' },
            spacing: { 
              after: 40, // Reduced from 60
              line: 220, // Reduced from 250
              lineRule: 'auto'
            },
          })
        ),
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
    const safeName = (req.user.fullName || 'resume').replace(/[^a-z0-9_\-]+/gi, '-');
    const timestamp = formatTimestamp();
    const filename = `${safeName}_${timestamp}.docx`;
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

    return res.json({ 
      success: true, 
      resumeId: record.id, 
      downloadUrl: `/api/files/${filename}`, 
      filename 
    });
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
