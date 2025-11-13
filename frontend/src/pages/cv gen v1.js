const express = require('express');
const cors = require('cors');
const { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    AlignmentType, 
    Table, 
    TableRow, 
    TableCell, 
    WidthType, 
    BorderStyle,
    PageBreak,
    ShadingType,
    UnderlineType,
    ExternalHyperlink,
    convertInchesToTwip,
    TabStopPosition,
    TabStopType
} = require('docx');
const fs = require('fs');
const path = require('path');

// Import translation system from separate file
const translations = require('./translations');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const generatedDir = path.join(__dirname, 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir);
}

function createCV(data) {
    const language = data.language || 'en';
    const t = translations[language];
    const isRTL = language === 'ar';
    
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                        size: 20,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { 
                            after: 90,
                            line: 270,
                            lineRule: "auto" 
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
            },
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: {
                        font: "Arial",
                        size: 20,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { after: 90, line: 270, lineRule: "auto" },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
                {
                    id: "SectionHeading",
                    name: "SectionHeading",
                    run: {
                        font: "Arial",
                        size: 28,
                        bold: true,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { 
                            after: 90,
                            before: 160
                        },
                        keepNext: true,
                        keepLines: true,
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
                {
                    id: "SubHeading",
                    name: "SubHeading",
                    run: {
                        font: "Arial",
                        size: 20,
                        bold: true,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { 
                            after: 50,
                            before: 90
                        },
                        keepNext: true,
                        keepLines: true,
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
                {
                    id: "JobTitle",
                    name: "JobTitle",
                    run: {
                        font: "Arial",
                        size: 22,
                        bold: true,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { after: 60 },
                        keepNext: true,
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
                {
                    id: "RightAlignedDate",
                    name: "RightAlignedDate",
                    run: {
                        font: "Arial",
                        size: 19,
                        bold: true,
                        rightToLeft: isRTL
                    },
                    paragraph: {
                        spacing: { after: 80 },
                        tabStops: [
                            {
                                type: isRTL ? TabStopType.LEFT : TabStopType.RIGHT,
                                position: convertInchesToTwip(7.0),
                            },
                        ],
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    },
                },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "bullet",
                    levels: [
                        {
                            level: 0,
                            format: "bullet",
                            text: "•",
                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { 
                                        left: isRTL ? 0 : 360, 
                                        right: isRTL ? 360 : 0,
                                        hanging: 260 
                                    },
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
                        top: 650,
                        right: 720,
                        bottom: 650,
                        left: 720,
                    },
                },
            },
            children: [
                // Name - Large centered text
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: data.name.toUpperCase(),
                            bold: true,
                            size: 68,
                            font: "Arial",
                            rightToLeft: isRTL
                        }),
                    ],
                    spacing: { after: 80, line: 270 },
                }),

                // Job title centered
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: data.title,
                            bold: true,
                            size: 26,
                            font: "Arial",
                            rightToLeft: isRTL
                        }),
                    ],
                    spacing: { after: 170 },
                }),

                // Contact Information
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.contactInformation,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
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
                                                new TextRun({ text: "• ", size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: t.mobile, bold: true, size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: ": " + data.phone, size: 20, rightToLeft: isRTL }),
                                            ],
                                            spacing: { line: 270, after: 50 },
                                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
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
                                            children: [
                                                new TextRun({ text: "• ", size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: t.github, bold: true, size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: ": ", size: 20, rightToLeft: isRTL }),
                                                new ExternalHyperlink({
                                                    children: [
                                                        new TextRun({
                                                            text: data.github.display,
                                                            style: "Hyperlink",
                                                            size: 20,
                                                            rightToLeft: isRTL
                                                        }),
                                                    ],
                                                    link: data.github.url,
                                                }),
                                            ],
                                            spacing: { line: 270, after: 50 },
                                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
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
                                                new TextRun({ text: "• ", size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: t.email, bold: true, size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: ": " + data.email, size: 20, rightToLeft: isRTL }),
                                            ],
                                            spacing: { line: 270, after: 50 },
                                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
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
                                            children: [
                                                new TextRun({ text: "• ", size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: t.linkedin, bold: true, size: 20, rightToLeft: isRTL }),
                                                new TextRun({ text: ": ", size: 20, rightToLeft: isRTL }),
                                                new ExternalHyperlink({
                                                    children: [
                                                        new TextRun({
                                                            text: data.linkedin.display,
                                                            style: "Hyperlink",
                                                            size: 20,
                                                            rightToLeft: isRTL
                                                        }),
                                                    ],
                                                    link: data.linkedin.url,
                                                }),
                                            ],
                                            spacing: { line: 270, after: 50 },
                                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
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

                // Professional Summary
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.professionalSummary,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.summary,
                            size: 20,
                            font: "Arial",
                            rightToLeft: isRTL
                        }),
                    ],
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    spacing: { after: 170, line: 290, lineRule: "auto" },
                }),

                // Work Experience
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.workExperience,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                ...data.experience.flatMap((job, jobIndex) => [
                    new Paragraph({
                        style: "JobTitle",
                        children: [
                            new TextRun({
                                text: job.title,
                                rightToLeft: isRTL
                            }),
                        ],
                    }),
                    new Paragraph({
                        style: "RightAlignedDate",
                        children: [
                            new TextRun({
                                text: job.company,
                                rightToLeft: isRTL
                            }),
                            new TextRun({
                                text: (isRTL ? job.period + "\t" : "\t" + job.period),
                                rightToLeft: isRTL
                            }),
                        ],
                    }),
                    ...job.responsibilities.map((resp, idx) => 
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: resp,
                                    size: 19,
                                    font: "Arial",
                                    rightToLeft: isRTL
                                }),
                            ],
                            numbering: { level: 0, reference: "bullet" },
                            spacing: { 
                                after: (idx === job.responsibilities.length - 1) ? 
                                    (jobIndex === data.experience.length - 1 ? 170 : 110) : 60,
                                line: 270,
                                lineRule: "auto"
                            },
                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                        })
                    ),
                ]),

                // Education
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.education,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.education.degree,
                            bold: true,
                            size: 22,
                            font: "Arial",
                            rightToLeft: isRTL
                        }),
                    ],
                    spacing: { after: 60 },
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                }),

                new Paragraph({
                    style: "RightAlignedDate",
                    children: [
                        new TextRun({
                            text: data.education.university,
                            rightToLeft: isRTL
                        }),
                        new TextRun({
                            text: (isRTL ? data.education.graduation + "\t" + t.graduated + ": " : "\t" + t.graduated + ": " + data.education.graduation),
                            rightToLeft: isRTL
                        }),
                    ],
                    spacing: { after: 0 },
                }),

                // Page break before skills
                new Paragraph({
                    children: [new PageBreak()],
                }),

                // Skills
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.skills,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                // Languages & Databases
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: t.languagesDatabases,
                            rightToLeft: isRTL
                        }),
                    ],
                }),

                ...data.skills.languages.map((skill, idx) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: skill,
                                size: 19,
                                font: "Arial",
                                rightToLeft: isRTL
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.languages.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    })
                ),

                // Tools & Technologies
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: t.toolsTechnologies,
                            rightToLeft: isRTL
                        }),
                    ],
                }),

                ...data.skills.tools.map((skill, idx) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: skill,
                                size: 19,
                                font: "Arial",
                                rightToLeft: isRTL
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.tools.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    })
                ),

                // Core Competencies
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: t.coreCompetencies,
                            rightToLeft: isRTL
                        }),
                    ],
                }),

                ...data.skills.core.map((skill, idx) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: skill,
                                size: 19,
                                font: "Arial",
                                rightToLeft: isRTL
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.core.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    })
                ),

                // Professional Skills
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: t.professionalSkills,
                            rightToLeft: isRTL
                        }),
                    ],
                }),

                ...data.skills.professional.map((skill, idx) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: skill,
                                size: 19,
                                font: "Arial",
                                rightToLeft: isRTL
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.professional.length - 1 ? 110 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    })
                ),

                // Languages
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: t.languages,
                            rightToLeft: isRTL
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                ...data.languages.map((lang, idx) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: lang,
                                bold: true,
                                size: 19,
                                font: "Arial",
                                rightToLeft: isRTL
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: 60,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT
                    })
                ),
            ],
        }],
    });

    return doc;
}

app.post('/generate-cv', async (req, res) => {
    try {
        const cvData = req.body;
        const doc = createCV(cvData);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${cvData.name.replace(/\s+/g, '_')}_CV_${cvData.language || 'en'}.docx`;
        const filepath = path.join(generatedDir, filename);

        fs.writeFileSync(filepath, buffer);

        res.json({
            success: true,
            filename: filename,
            downloadUrl: `/download/${filename}`,
            language: cvData.language || 'en'
        });
    } catch (error) {
        console.error('Error generating CV:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate CV'
        });
    }
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(generatedDir, filename);

    if (fs.existsSync(filepath)) {
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).send('File download error');
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`CV Generator server running on http://localhost:${PORT}`);
});