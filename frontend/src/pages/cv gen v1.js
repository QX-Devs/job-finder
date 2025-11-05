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
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                        size: 20,
                    },
                    paragraph: {
                        spacing: { 
                            after: 90,
                            line: 270,
                            lineRule: "auto" 
                        },
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
                    },
                    paragraph: {
                        spacing: { after: 90, line: 270, lineRule: "auto" },
                    },
                },
                {
                    id: "SectionHeading",
                    name: "SectionHeading",
                    run: {
                        font: "Arial",
                        size: 28,
                        bold: true,
                    },
                    paragraph: {
                        spacing: { 
                            after: 90,
                            before: 160
                        },
                        keepNext: true,
                        keepLines: true,
                    },
                },
                {
                    id: "SubHeading",
                    name: "SubHeading",
                    run: {
                        font: "Arial",
                        size: 20,
                        bold: true,
                    },
                    paragraph: {
                        spacing: { 
                            after: 50,
                            before: 90
                        },
                        keepNext: true,
                        keepLines: true,
                    },
                },
                {
                    id: "JobTitle",
                    name: "JobTitle",
                    run: {
                        font: "Arial",
                        size: 22,
                        bold: true,
                    },
                    paragraph: {
                        spacing: { after: 60 },
                        keepNext: true,
                    },
                },
                {
                    id: "RightAlignedDate",
                    name: "RightAlignedDate",
                    run: {
                        font: "Arial",
                        size: 19,
                        bold: true,
                    },
                    paragraph: {
                        spacing: { after: 80 },
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
                    reference: "bullet",
                    levels: [
                        {
                            level: 0,
                            format: "bullet",
                            text: "•",
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
                        }),
                    ],
                    spacing: { after: 80, line: 270 },
                }),

                // Title centered
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: data.title,
                            bold: true,
                            size: 26,
                            font: "Arial",
                        }),
                    ],
                    spacing: { after: 170 },
                }),

                // CONTACT INFORMATION
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "CONTACT INFORMATION",
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
                                                new TextRun({ text: "• ", size: 20 }),
                                                new TextRun({ text: "Mobile", bold: true, size: 20 }),
                                                new TextRun({ text: ": " + data.phone, size: 20 }),
                                            ],
                                            spacing: { line: 270, after: 50 },
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
                                                new TextRun({ text: "• ", size: 20 }),
                                                new TextRun({ text: "GitHub", bold: true, size: 20 }),
                                                new TextRun({ text: ": ", size: 20 }),
                                                new ExternalHyperlink({
                                                    children: [
                                                        new TextRun({
                                                            text: data.github.display,
                                                            style: "Hyperlink",
                                                            size: 20,
                                                        }),
                                                    ],
                                                    link: data.github.url,
                                                }),
                                            ],
                                            spacing: { line: 270, after: 50 },
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
                                                new TextRun({ text: "• ", size: 20 }),
                                                new TextRun({ text: "Email", bold: true, size: 20 }),
                                                new TextRun({ text: ": " + data.email, size: 20 }),
                                            ],
                                            spacing: { line: 270, after: 50 },
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
                                                new TextRun({ text: "• ", size: 20 }),
                                                new TextRun({ text: "LinkedIn", bold: true, size: 20 }),
                                                new TextRun({ text: ": ", size: 20 }),
                                                new ExternalHyperlink({
                                                    children: [
                                                        new TextRun({
                                                            text: data.linkedin.display,
                                                            style: "Hyperlink",
                                                            size: 20,
                                                        }),
                                                    ],
                                                    link: data.linkedin.url,
                                                }),
                                            ],
                                            spacing: { line: 270, after: 50 },
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
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "PROFESSIONAL SUMMARY",
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
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 170, line: 290, lineRule: "auto" },
                }),

                // WORK EXPERIENCE
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "WORK EXPERIENCE",
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
                            }),
                        ],
                    }),
                    new Paragraph({
                        style: "RightAlignedDate",
                        children: [
                            new TextRun({
                                text: job.company,
                            }),
                            new TextRun({
                                text: "\t" + job.period,
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
                                }),
                            ],
                            numbering: { level: 0, reference: "bullet" },
                            spacing: { 
                                after: (idx === job.responsibilities.length - 1) ? 
                                    (jobIndex === data.experience.length - 1 ? 170 : 110) : 60,
                                line: 270,
                                lineRule: "auto"
                            },
                            alignment: AlignmentType.JUSTIFIED,
                        })
                    ),
                ]),

                // EDUCATION
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "EDUCATION",
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
                        }),
                    ],
                    spacing: { after: 60 },
                }),

                new Paragraph({
                    style: "RightAlignedDate",
                    children: [
                        new TextRun({
                            text: data.education.university,
                        }),
                        new TextRun({
                            text: "\tGraduated: " + data.education.graduation,
                        }),
                    ],
                    spacing: { after: 0 },
                }),

                // Page break before SKILLS
                new Paragraph({
                    children: [new PageBreak()],
                }),

                // SKILLS
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "SKILLS",
                        }),
                    ],
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                }),

                // Languages & Databases
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: "Languages & Databases",
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
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.languages.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: AlignmentType.JUSTIFIED,
                    })
                ),

                // Tools & Technologies
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: "Tools & Technologies",
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
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.tools.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: AlignmentType.JUSTIFIED,
                    })
                ),

                // Core Competencies
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: "Core Competencies",
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
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.core.length - 1 ? 90 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: AlignmentType.JUSTIFIED,
                    })
                ),

                // Professional Skills
                new Paragraph({
                    style: "SubHeading",
                    children: [
                        new TextRun({
                            text: "Professional Skills",
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
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: idx === data.skills.professional.length - 1 ? 110 : 50,
                            line: 250,
                            lineRule: "auto"
                        },
                        alignment: AlignmentType.JUSTIFIED,
                    })
                ),

                // LANGUAGES
                new Paragraph({
                    style: "SectionHeading",
                    children: [
                        new TextRun({
                            text: "LANGUAGES",
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
                            }),
                        ],
                        numbering: { level: 0, reference: "bullet" },
                        spacing: { 
                            after: 60,
                            line: 250,
                            lineRule: "auto"
                        },
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
        const filename = `${cvData.name.replace(/\s+/g, '_')}_CV.docx`;
        const filepath = path.join(generatedDir, filename);

        fs.writeFileSync(filepath, buffer);

        res.json({
            success: true,
            filename: filename,
            downloadUrl: `/download/${filename}`
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
                res.status(500).send('Error downloading file');
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
    console.log(`CV Generator server running at http://localhost:${PORT}`);
});
