import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ReactCountryFlag from 'react-country-flag';
import { 
  User, Briefcase, GraduationCap, Code, Globe, 
  Plus, X, ArrowRight, ArrowLeft, Save, Github, Linkedin, Sparkles, Phone, BookOpen
} from 'lucide-react';
import api from '../services/api';
import resumeService from '../services/resumeService';
import authService from '../services/authService';
import courseService from '../services/courseService';
import { sanitizeText, sanitizeMultilineText, sanitizeTextArray } from '../utils/textSanitizer';
import './CVGenerator.css';

// Country codes for phone number
const countryCodes = [
  { code: '+962', country: 'الأردن', countryCode: 'JO' },
  { code: '+1', country: 'الولايات المتحدة/كندا', countryCode: 'US' },
  { code: '+44', country: 'المملكة المتحدة', countryCode: 'GB' },
  { code: '+91', country: 'الهند', countryCode: 'IN' },
  { code: '+86', country: 'الصين', countryCode: 'CN' },
  { code: '+81', country: 'اليابان', countryCode: 'JP' },
  { code: '+49', country: 'ألمانيا', countryCode: 'DE' },
  { code: '+33', country: 'فرنسا', countryCode: 'FR' },
  { code: '+39', country: 'إيطاليا', countryCode: 'IT' },
  { code: '+34', country: 'إسبانيا', countryCode: 'ES' },
  { code: '+7', country: 'روسيا', countryCode: 'RU' },
  { code: '+61', country: 'أستراليا', countryCode: 'AU' },
  { code: '+55', country: 'البرازيل', countryCode: 'BR' },
  { code: '+82', country: 'كوريا الجنوبية', countryCode: 'KR' },
  { code: '+52', country: 'المكسيك', countryCode: 'MX' },
  { code: '+31', country: 'هولندا', countryCode: 'NL' },
  { code: '+46', country: 'السويد', countryCode: 'SE' },
  { code: '+47', country: 'النرويج', countryCode: 'NO' },
  { code: '+45', country: 'الدنمارك', countryCode: 'DK' },
  { code: '+41', country: 'سويسرا', countryCode: 'CH' },
  { code: '+43', country: 'النمسا', countryCode: 'AT' },
  { code: '+32', country: 'بلجيكا', countryCode: 'BE' },
  { code: '+351', country: 'البرتغال', countryCode: 'PT' },
  { code: '+30', country: 'اليونان', countryCode: 'GR' },
  { code: '+48', country: 'بولندا', countryCode: 'PL' },
  { code: '+420', country: 'التشيك', countryCode: 'CZ' },
  { code: '+36', country: 'المجر', countryCode: 'HU' },
  { code: '+40', country: 'رومانيا', countryCode: 'RO' },
  { code: '+64', country: 'نيوزيلندا', countryCode: 'NZ' },
  { code: '+65', country: 'سنغافورة', countryCode: 'SG' },
  { code: '+60', country: 'ماليزيا', countryCode: 'MY' },
  { code: '+66', country: 'تايلاند', countryCode: 'TH' },
  { code: '+84', country: 'فيتنام', countryCode: 'VN' },
  { code: '+63', country: 'الفلبين', countryCode: 'PH' },
  { code: '+62', country: 'إندونيسيا', countryCode: 'ID' },
  { code: '+971', country: 'الإمارات', countryCode: 'AE' },
  { code: '+966', country: 'السعودية', countryCode: 'SA' },
  { code: '+972', country: 'إسرائيل', countryCode: 'IL' },
  { code: '+90', country: 'تركيا', countryCode: 'TR' },
  { code: '+20', country: 'مصر', countryCode: 'EG' },
  { code: '+27', country: 'جنوب أفريقيا', countryCode: 'ZA' },
  { code: '+234', country: 'نيجيريا', countryCode: 'NG' },
  { code: '+254', country: 'كينيا', countryCode: 'KE' },
  { code: '+54', country: 'الأرجنتين', countryCode: 'AR' },
  { code: '+56', country: 'تشيلي', countryCode: 'CL' },
  { code: '+57', country: 'كولومبيا', countryCode: 'CO' },
];

// Common degree options
const DEGREE_OPTIONS = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate (PhD)',
  'Professional Degree (MD, JD, etc.)',
  'Certificate',
  'Diploma',
  'Other'
];

// Common language options
const LANGUAGE_OPTIONS = [
  'Arabic',
  'Bengali',
  'Chinese (Mandarin)',
  'Chinese (Cantonese)',
  'Dutch',
  'English',
  'French',
  'German',
  'Greek',
  'Hebrew',
  'Hindi',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Persian (Farsi)',
  'Polish',
  'Portuguese',
  'Russian',
  'Spanish',
  'Swedish',
  'Turkish',
  'Ukrainian',
  'Urdu',
  'Vietnamese',
  'Other'
];

// Comprehensive CS/CIS/SE Skills List
const CS_SKILLS = [
  // Programming Languages
  'C',
  'C#',
  'C++',
  'C Programming',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Scala',
  'Perl',
  'R',
  'MATLAB',
  'Dart',
  'Haskell',
  'Lua',
  'Objective-C',
  'Groovy',
  'Clojure',
  'Erlang',
  'Elixir',
  'F#',
  'Visual Basic',
  'VB.NET',
  'Fortran',
  'COBOL',
  'Assembly',
  'Prolog',
  'Lisp',
  'Scheme',
  'OCaml',
  'F#',
  'Crystal',
  'Nim',
  'Zig',
  'V',
  'Julia',
  'Wolfram Language',
  'Shell',
  'PowerShell',
  
  // Web Development
  'HTML',
  'HTML5',
  'CSS',
  'CSS3',
  'SASS',
  'SCSS',
  'LESS',
  'Bootstrap',
  'Tailwind CSS',
  'Material-UI',
  'Ant Design',
  'Chakra UI',
  'Styled Components',
  'Emotion',
  'React',
  'React Native',
  'React Hooks',
  'Redux',
  'Redux Toolkit',
  'MobX',
  'Zustand',
  'Angular',
  'AngularJS',
  'Vue.js',
  'Vue.js 3',
  'Vuex',
  'Pinia',
  'Next.js',
  'Nuxt.js',
  'Svelte',
  'SvelteKit',
  'Remix',
  'Gatsby',
  'Astro',
  'jQuery',
  'Backbone.js',
  'Ember.js',
  'Meteor',
  'Node.js',
  'Express.js',
  'NestJS',
  'Koa.js',
  'Hapi.js',
  'Fastify',
  'Socket.io',
  'Django',
  'Flask',
  'FastAPI',
  'Tornado',
  'Bottle',
  'CherryPy',
  'Laravel',
  'Symfony',
  'CodeIgniter',
  'Zend Framework',
  'CakePHP',
  'Yii',
  'ASP.NET',
  'ASP.NET Core',
  'ASP.NET MVC',
  'Blazor',
  'Spring Boot',
  'Spring Framework',
  'Spring MVC',
  'Spring Security',
  'Hibernate',
  'Struts',
  'Rails',
  'Sinatra',
  'Hanami',
  'REST API',
  'GraphQL',
  'Apollo GraphQL',
  'gRPC',
  'WebSocket',
  'WebRTC',
  'JSON',
  'XML',
  'YAML',
  'AJAX',
  'Fetch API',
  'Axios',
  
  // Mobile Development
  'Android Development',
  'iOS Development',
  'React Native',
  'Flutter',
  'Xamarin',
  'Ionic',
  'Cordova',
  'PhoneGap',
  'SwiftUI',
  'Kotlin Multiplatform',
  'Xcode',
  'Android Studio',
  'Android SDK',
  'iOS SDK',
  'App Store',
  'Google Play',
  'APK',
  'Mobile UI/UX',
  
  // Databases
  'SQL',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Oracle',
  'SQL Server',
  'SQLite',
  'Redis',
  'Cassandra',
  'DynamoDB',
  'Elasticsearch',
  'Neo4j',
  'Firebase',
  'Firestore',
  'Realtime Database',
  'MariaDB',
  'NoSQL',
  'CouchDB',
  'RavenDB',
  'InfluxDB',
  'TimescaleDB',
  'CockroachDB',
  'ArangoDB',
  'Couchbase',
  'HBase',
  'ClickHouse',
  'Snowflake',
  'BigQuery',
  'Amazon Redshift',
  'Database Design',
  'Database Administration',
  'SQL Optimization',
  'Query Optimization',
  'Database Migration',
  'ORM',
  'Prisma',
  'Sequelize',
  'TypeORM',
  'SQLAlchemy',
  'Dapper',
  
  // Cloud & DevOps
  'AWS',
  'Amazon Web Services',
  'AWS EC2',
  'AWS S3',
  'AWS Lambda',
  'AWS RDS',
  'AWS CloudFormation',
  'AWS CloudFront',
  'AWS VPC',
  'AWS IAM',
  'AWS ECS',
  'AWS EKS',
  'AWS Route 53',
  'AWS SNS',
  'AWS SQS',
  'AWS API Gateway',
  'AWS Elastic Beanstalk',
  'Azure',
  'Microsoft Azure',
  'Azure Functions',
  'Azure App Service',
  'Azure SQL Database',
  'Azure DevOps',
  'Azure Active Directory',
  'Azure Kubernetes Service',
  'Azure Blob Storage',
  'Google Cloud Platform',
  'GCP',
  'Google Cloud Functions',
  'Google App Engine',
  'Google Compute Engine',
  'Cloud Run',
  'Cloud Storage',
  'Cloud SQL',
  'Cloud Pub/Sub',
  'Docker',
  'Docker Compose',
  'Docker Swarm',
  'Kubernetes',
  'K8s',
  'Helm',
  'Istio',
  'Jenkins',
  'GitLab CI/CD',
  'GitHub Actions',
  'CircleCI',
  'Travis CI',
  'Bamboo',
  'TeamCity',
  'Terraform',
  'Ansible',
  'Chef',
  'Puppet',
  'Vagrant',
  'Packer',
  'Prometheus',
  'Grafana',
  'ELK Stack',
  'Elasticsearch',
  'Logstash',
  'Kibana',
  'Splunk',
  'Nagios',
  'Zabbix',
  'CI/CD',
  'DevOps',
  'Infrastructure as Code',
  'IaC',
  'Containerization',
  'Microservices Architecture',
  'Service Mesh',
  'Linux',
  'Unix',
  'Ubuntu',
  'CentOS',
  'Red Hat',
  'Debian',
  'Fedora',
  'Shell Scripting',
  'Bash',
  'PowerShell',
  'Zsh',
  'System Administration',
  'Server Management',
  
  // Version Control
  'Git',
  'GitHub',
  'GitLab',
  'Bitbucket',
  'SVN',
  'Mercurial',
  'Git Flow',
  'GitHub Flow',
  'Code Review',
  'Pull Requests',
  'Branching Strategy',
  
  // Testing
  'Unit Testing',
  'Integration Testing',
  'End-to-End Testing',
  'E2E Testing',
  'Jest',
  'JUnit',
  'Selenium',
  'Selenium WebDriver',
  'Cypress',
  'Playwright',
  'Puppeteer',
  'Jasmine',
  'Mocha',
  'Chai',
  'Sinon',
  'Enzyme',
  'React Testing Library',
  'Vitest',
  'Pytest',
  'unittest',
  'TestNG',
  'Mockito',
  'JMeter',
  'Postman',
  'Insomnia',
  'SoapUI',
  'Rest Assured',
  'Newman',
  'API Testing',
  'Load Testing',
  'Performance Testing',
  'Security Testing',
  'Penetration Testing',
  'TDD',
  'BDD',
  'Test Automation',
  'QA',
  'Quality Assurance',
  
  // Software Engineering
  'Object-Oriented Programming',
  'OOP',
  'Functional Programming',
  'Procedural Programming',
  'Design Patterns',
  'Creational Patterns',
  'Structural Patterns',
  'Behavioral Patterns',
  'SOLID Principles',
  'DRY',
  'KISS',
  'YAGNI',
  'Clean Code',
  'Code Refactoring',
  'Agile',
  'Scrum',
  'Kanban',
  'SAFe',
  'Waterfall',
  'Lean',
  'Extreme Programming',
  'XP',
  'Pair Programming',
  'Software Development Life Cycle',
  'SDLC',
  'Microservices',
  'Monolithic Architecture',
  'Serverless',
  'Event-Driven Architecture',
  'MVC',
  'MVP',
  'MVVM',
  'REST',
  'SOAP',
  'API Design',
  'System Design',
  'Distributed Systems',
  'Scalability',
  'Performance Optimization',
  'Algorithm Design',
  'Data Structures',
  'Problem Solving',
  'Code Review',
  'Technical Documentation',
  'Software Architecture',
  'UML',
  'UML Diagrams',
  
  // Data Science & Analytics
  'Data Science',
  'Machine Learning',
  'ML',
  'Deep Learning',
  'Neural Networks',
  'CNN',
  'RNN',
  'LSTM',
  'GAN',
  'TensorFlow',
  'PyTorch',
  'Keras',
  'Scikit-learn',
  'Pandas',
  'NumPy',
  'SciPy',
  'Matplotlib',
  'Seaborn',
  'Plotly',
  'Bokeh',
  'Jupyter',
  'Jupyter Notebook',
  'Data Analysis',
  'Data Visualization',
  'Tableau',
  'Power BI',
  'QlikView',
  'Looker',
  'Metabase',
  'Big Data',
  'Hadoop',
  'MapReduce',
  'HDFS',
  'Hive',
  'HBase',
  'Pig',
  'Spark',
  'Apache Spark',
  'Apache Kafka',
  'Apache Flink',
  'Apache Storm',
  'Apache Airflow',
  'Data Mining',
  'Business Intelligence',
  'BI',
  'ETL',
  'Data Warehousing',
  'Data Engineering',
  'Feature Engineering',
  'Model Training',
  'Model Deployment',
  'A/B Testing',
  'Statistical Analysis',
  'R Programming',
  
  // Security
  'Cybersecurity',
  'Network Security',
  'Information Security',
  'Penetration Testing',
  'Ethical Hacking',
  'OWASP',
  'OWASP Top 10',
  'Cryptography',
  'Encryption',
  'SSL/TLS',
  'HTTPS',
  'OAuth',
  'OAuth 2.0',
  'JWT',
  'JWT Tokens',
  'SAML',
  'LDAP',
  'PKI',
  'Firewall',
  'VPN',
  'IDS',
  'IPS',
  'SIEM',
  'Vulnerability Assessment',
  'Security Auditing',
  'Threat Modeling',
  'Secure Coding',
  'XSS Prevention',
  'SQL Injection Prevention',
  'CSRF Protection',
  'Security Best Practices',
  
  // Game Development
  'Unity',
  'Unity 3D',
  'Unreal Engine',
  'Unreal Engine 4',
  'Unreal Engine 5',
  'Game Development',
  'Game Design',
  'DirectX',
  'OpenGL',
  'Vulkan',
  'Game Programming',
  '3D Graphics',
  'Shaders',
  'Game Physics',
  'Asterisk',
  'Phaser',
  'Godot',
  
  // Other Technologies
  'Blockchain',
  'Smart Contracts',
  'Ethereum',
  'Bitcoin',
  'Solidity',
  'Web3',
  'DeFi',
  'NFT',
  'Cryptocurrency',
  'Distributed Ledger',
  'Hyperledger',
  'IoT',
  'Internet of Things',
  'MQTT',
  'CoAP',
  'Embedded Systems',
  'Arduino',
  'Raspberry Pi',
  'Microcontrollers',
  'Computer Vision',
  'OpenCV',
  'Image Recognition',
  'Object Detection',
  'Natural Language Processing',
  'NLP',
  'NLTK',
  'spaCy',
  'Transformers',
  'BERT',
  'GPT',
  'Image Processing',
  'Image Classification',
  'Artificial Intelligence',
  'AI',
  'Virtual Reality',
  'VR',
  'Augmented Reality',
  'AR',
  'Mixed Reality',
  'MR',
  'Quantum Computing',
  'ROS',
  'Robot Operating System',
  'Robotics',
  'Firmware Development',
  
  // Tools & IDEs
  'Visual Studio',
  'Visual Studio Code',
  'VS Code',
  'IntelliJ IDEA',
  'Eclipse',
  'NetBeans',
  'PyCharm',
  'WebStorm',
  'PhpStorm',
  'DataGrip',
  'Rider',
  'CLion',
  'Android Studio',
  'Xcode',
  'Sublime Text',
  'Atom',
  'Vim',
  'Emacs',
  'JIRA',
  'Confluence',
  'Trello',
  'Asana',
  'Monday.com',
  'Notion',
  'Figma',
  'Adobe XD',
  'Sketch',
  'InVision',
  'Zeplin',
  'Framer',
  'Adobe Illustrator',
  'Adobe Photoshop',
  
  // Networking & Protocols
  'TCP/IP',
  'HTTP',
  'HTTPS',
  'FTP',
  'SFTP',
  'SSH',
  'DNS',
  'DHCP',
  'LDAP',
  'SMTP',
  'POP3',
  'IMAP',
  'OSI Model',
  'Network Administration',
  'Network Troubleshooting',
  'Wireshark',
  'tcpdump',
  'Load Balancing',
  'CDN',
  'Content Delivery Network',
  
  // Additional Frameworks & Libraries
  'Webpack',
  'Vite',
  'Rollup',
  'Parcel',
  'Babel',
  'ESLint',
  'Prettier',
  'TypeScript',
  'Flow',
  'NPM',
  'Yarn',
  'pnpm',
  'Bower',
  'Composer',
  'Pip',
  'Maven',
  'Gradle',
  'Ant',
  'Grunt',
  'Gulp',
  
  // Content Management Systems
  'WordPress',
  'Drupal',
  'Joomla',
  'Magento',
  'Shopify',
  'WooCommerce',
  'Strapi',
  'Contentful',
  'Sanity',
  'Headless CMS',
  
  // Search & Analytics
  'Apache Solr',
  'Apache Lucene',
  'Google Analytics',
  'Google Tag Manager',
  'Mixpanel',
  'Amplitude',
  'Segment',
  'Hotjar',
  
  // Message Queues & Brokers
  'RabbitMQ',
  'Apache Kafka',
  'Apache ActiveMQ',
  'Redis Pub/Sub',
  'Amazon SQS',
  'Azure Service Bus',
  
  // Monitoring & Logging
  'New Relic',
  'Datadog',
  'Sentry',
  'LogRocket',
  'Bugsnag',
  'Raygun',
  'Rollbar',
  
  // Documentation
  'Swagger',
  'OpenAPI',
  'Postman Collections',
  'API Documentation',
  'Markdown',
  'JSDoc',
  'Sphinx',
  
  // Additional Skills
  'Code Generation',
  'Low-Code Development',
  'No-Code Development',
  'Progressive Web Apps',
  'PWA',
  'WebAssembly',
  'WASM',
  'Service Workers',
  'Workbox',
  'Accessibility',
  'WCAG',
  'ARIA',
  'SEO',
  'Search Engine Optimization',
  'Responsive Design',
  'Cross-Browser Compatibility',
  'Performance Optimization',
  'Lazy Loading',
  'Code Splitting',
  'Tree Shaking',
  'Minification',
  'Browser DevTools',
  'Chrome DevTools',
  'Firefox DevTools',
  'Safari Web Inspector'
];

const CVGenerator = () => {
  const { t, isRTL } = useLanguage();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const [currentStep, setCurrentStep] = useState(1);
  const [countryCode, setCountryCode] = useState('+962');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const countrySelectRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    title: '',
    summary: '',
    github: '',
    linkedin: '',
    isGraduate: false,
    experience: [{ 
      position: '', 
      company: '', 
      startDate: '', 
      endDate: '', 
      description: '',
      current: false
    }],
    education: [{ 
      degree: '', 
      institution: '', 
      graduationDate: '',
      fieldOfStudy: '',
      customDegree: '',
      gpa: ''
    }],
    skills: [],
    languages: [{ language: '', proficiency: 'Professional', customLanguage: '' }],
    courses: [],
    graduationProject: {
      title: '',
      description: '',
      technologies: [],
      role: '',
      duration: '',
      githubUrl: '',
      supervisor: ''
    },
    projectSkills: []
  });

  const [newSkill, setNewSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [downloadReadyUrl, setDownloadReadyUrl] = useState('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);

  // Parse phone number to extract country code when user data is available
  useEffect(() => {
    if (user?.phone && !phoneNumber) {
      const phone = user.phone;
      const matchedCode = countryCodes.find(cc => phone.startsWith(cc.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setPhoneNumber(phone.substring(matchedCode.code.length).trim());
      } else {
        // Default to +962 if no match
        setCountryCode('+962');
        setPhoneNumber(phone);
      }
    }
  }, [user, phoneNumber]); // Run when user data is available

  // Update formData.phone when countryCode or phoneNumber changes
  useEffect(() => {
    const fullPhone = `${countryCode}${phoneNumber}`.trim();
    setFormData(prev => ({ ...prev, phone: fullPhone }));
  }, [countryCode, phoneNumber]);

  // Handle clicks outside country select dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countrySelectRef.current && !countrySelectRef.current.contains(event.target)) {
        setIsCountrySelectOpen(false);
      }
    };

    if (isCountrySelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountrySelectOpen]);

  // Pre-populate name, phone, isGraduate, courses, and graduation project from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        isGraduate: prev.isGraduate !== undefined ? prev.isGraduate : (user.isGraduate || false),
        courses: prev.courses.length > 0 ? prev.courses : (user.courses || []),
        graduationProject: prev.graduationProject.title ? prev.graduationProject : (user.graduationProject ? {
          title: user.graduationProject.title || '',
          description: user.graduationProject.description || '',
          technologies: user.graduationProject.technologies || [],
          role: user.graduationProject.role || '',
          duration: user.graduationProject.duration || '',
          githubUrl: user.graduationProject.githubUrl || '',
          supervisor: user.graduationProject.supervisor || ''
        } : {
          title: '',
          description: '',
          technologies: [],
          role: '',
          duration: '',
          githubUrl: '',
          supervisor: ''
        }),
        projectSkills: prev.projectSkills.length > 0 ? prev.projectSkills : (user.graduationProject?.projectSkills || [])
      }));
    }
  }, [user]);

  // Load resume data if resumeId is provided
  useEffect(() => {
    if (resumeId) {
      setLoadingResume(true);
      resumeService.getResume(resumeId)
        .then(response => {
          if (response.success && response.data) {
            const resume = response.data;
            const content = resume.content || {};
            
            // Map resume content to form data
            setFormData({
              fullName: user?.fullName || '',
              phone: user?.phone || '',
              title: resume.title || '',
              summary: content.summary || content.professionalSummary || '',
              github: content.github ? extractUsername(content.github, 'github') : '',
              linkedin: content.linkedin ? extractUsername(content.linkedin, 'linkedin') : '',
              experience: content.experience && content.experience.length > 0 
                ? content.experience.map(exp => ({
                    position: exp.position || exp.title || '',
                    company: exp.company || exp.employer || '',
                    startDate: exp.startDate || exp.start || '',
                    endDate: exp.endDate || exp.end || '',
                    description: Array.isArray(exp.description) 
                      ? exp.description.join('\n') 
                      : (exp.description || ''),
                    current: exp.current || exp.isCurrent || false
                  }))
                : [{ position: '', company: '', startDate: '', endDate: '', description: '', current: false }],
              education: content.education && content.education.length > 0
                ? content.education.map(edu => {
                    const degreeValue = edu.degree || edu.qualification || '';
                    // Check if the degree is in our options, if not, it's a custom degree
                    const isCustomDegree = degreeValue && !DEGREE_OPTIONS.includes(degreeValue);
                    return {
                      degree: isCustomDegree ? 'Other' : degreeValue,
                      institution: edu.institution || edu.school || '',
                      graduationDate: edu.graduationDate || edu.endDate || '',
                      fieldOfStudy: edu.fieldOfStudy || edu.major || '',
                      customDegree: isCustomDegree ? degreeValue : (edu.customDegree || ''),
                      gpa: edu.gpa || ''
                    };
                  })
                : [{ degree: '', institution: '', graduationDate: '', fieldOfStudy: '', customDegree: '' }],
              skills: Array.isArray(content.skills) 
                ? content.skills.map(s => typeof s === 'string' ? s : s.skillName || s.name || s)
                : [],
              languages: content.languages && content.languages.length > 0
                ? content.languages.map(lang => {
                    const languageName = typeof lang === 'string' ? lang : (lang.language || lang.name || '');
                    // Check if the language is in our options, if not, it's a custom language
                    const isCustomLanguage = languageName && !LANGUAGE_OPTIONS.includes(languageName);
                    return {
                      language: isCustomLanguage ? 'Other' : languageName,
                      proficiency: typeof lang === 'string' ? 'Professional' : (lang.proficiency || 'Professional'),
                      customLanguage: isCustomLanguage ? languageName : ''
                    };
                  })
                : [{ language: '', proficiency: 'Professional', customLanguage: '' }],
              courses: content.courses && content.courses.length > 0
                ? content.courses.map(course => ({
                    courseName: course.courseName || course.title || '',
                    provider: course.provider || course.institution || '',
                    completionDate: course.completionDate || '',
                    category: course.category || '',
                    certificateUrl: course.certificateUrl || ''
                  }))
                : [],
              graduationProject: content.graduationProject ? {
                title: content.graduationProject.title || '',
                description: content.graduationProject.description || '',
                technologies: content.graduationProject.technologies || [],
                role: content.graduationProject.role || '',
                duration: content.graduationProject.duration || '',
                githubUrl: content.graduationProject.githubUrl || '',
                supervisor: content.graduationProject.supervisor || ''
              } : {
                title: '',
                description: '',
                technologies: [],
                role: '',
                duration: '',
                githubUrl: '',
                supervisor: ''
              },
              projectSkills: content.projectSkills || []
            });
          }
        })
        .catch(error => {
          console.error('Failed to load resume:', error);
        })
        .finally(() => {
          setLoadingResume(false);
        });
    }
  }, [resumeId, user]);

  // Load courses from user profile
  useEffect(() => {
    const loadCourses = async () => {
      if (user && formData.courses.length === 0) {
        try {
          const response = await courseService.getCourses();
          if (response.success && response.data) {
            setFormData(prev => ({
              ...prev,
              courses: response.data.map(course => ({
                id: course.id,
                courseName: course.courseName || '',
                provider: course.provider || '',
                completionDate: course.completionDate || '',
                category: course.category || '',
                certificateUrl: course.certificateUrl || ''
              }))
            }));
          }
        } catch (error) {
          console.error('Failed to load courses:', error);
        }
      }
    };
    loadCourses();
  }, [user]);

  // Handle input changes with sanitization for text fields
  // Helper function to extract username from URL or return the input as username
  const extractUsername = (input, type) => {
    if (!input || !input.trim()) return '';
    const trimmed = input.trim();
    
    if (type === 'github') {
      // If it's already a full URL, extract username
      if (trimmed.includes('github.com/')) {
        const match = trimmed.match(/github\.com\/([^\/\s?#]+)/);
        return match ? match[1] : trimmed.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/.*$/, '');
      }
      // Otherwise, treat as username
      return trimmed.replace(/^@/, ''); // Remove @ if user types it
    } else if (type === 'linkedin') {
      // If it's already a full URL, extract username
      if (trimmed.includes('linkedin.com/in/')) {
        const match = trimmed.match(/linkedin\.com\/in\/([^\/\s?#]+)/);
        return match ? match[1] : trimmed.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/.*$/, '');
      }
      // Otherwise, treat as username
      return trimmed.replace(/^@/, ''); // Remove @ if user types it
    }
    return trimmed;
  };

  // Helper function to construct full URL from username
  const constructUrl = (username, type) => {
    if (!username || !username.trim()) return '';
    const cleanUsername = username.trim().replace(/^@/, '');
    if (type === 'github') {
      return `https://github.com/${cleanUsername}`;
    } else if (type === 'linkedin') {
      return `https://linkedin.com/in/${cleanUsername}`;
    }
    return '';
  };

  const handleChange = (field, value) => {
    // Handle GitHub and LinkedIn - store username only
    if (field === 'github') {
      const username = extractUsername(value, 'github');
      setFormData(prev => ({ ...prev, [field]: username }));
    } else if (field === 'linkedin') {
      const username = extractUsername(value, 'linkedin');
      setFormData(prev => ({ ...prev, [field]: username }));
    } else {
      // Don't sanitize title and summary in real-time to allow free typing (including spaces)
      // Sanitization will happen when saving
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Experience handlers
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { 
        position: '', 
        company: '', 
        startDate: '', 
        endDate: '', 
        description: '',
        current: false
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    // Sanitize description field to remove special characters
    if (field === 'description') {
      value = sanitizeMultilineText(value);
    } else if (field === 'position' || field === 'company') {
      value = sanitizeText(value);
    }
    
    setFormData(prev => {
      const updatedExperience = prev.experience.map((exp, i) => {
        if (i === index) {
          const updated = { ...exp, [field]: value };
          
          // If current is checked, clear endDate
          if (field === 'current' && value === true) {
            updated.endDate = '';
          }
          
          return updated;
        }
        return exp;
      });
      
      // Validate date range for the updated experience entry
      const experienceToValidate = updatedExperience[index];
      
      // Clear previous date error for this experience entry
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`experience_${index}_dateRange`];
        return newErrors;
      });
      
      // Validate date range if both dates are present and not current job
      if (!experienceToValidate.current && 
          experienceToValidate.startDate && 
          experienceToValidate.endDate) {
        const startDate = new Date(experienceToValidate.startDate);
        const endDate = new Date(experienceToValidate.endDate);
        
        if (endDate < startDate) {
          setErrors(prev => ({
            ...prev,
            [`experience_${index}_dateRange`]: 'End date must be later than start date.'
          }));
        }
      }
      
      return {
        ...prev,
        experience: updatedExperience
      };
    });
  };

  const removeExperience = (index) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }));
    }
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { 
        degree: '', 
        institution: '', 
        graduationDate: '',
        fieldOfStudy: '',
        customDegree: '',
        gpa: ''
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    // Validate GPA if it's being updated
    if (field === 'gpa') {
      const gpaValue = value.trim();
      
      // If empty, clear errors and allow
      if (gpaValue === '') {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`education_${index}_gpa`];
          return newErrors;
        });
      } else {
        // Check if it's a numeric value (GPA or percentage)
        const numericMatch = gpaValue.match(/^(\d+(?:\.\d+)?)\s*(%|out of \d+)?$/i);
        
        if (numericMatch) {
          const numValue = parseFloat(numericMatch[1]);
          // Check if it's a percentage (has % or > 4)
          const isPercentage = gpaValue.includes('%') || numValue > 4;
          
          if (isPercentage) {
            // Percentage: 0-100%
            if (numValue < 0 || numValue > 100) {
              setErrors(prev => ({
                ...prev,
                [`education_${index}_gpa`]: 'GPA must be between 0-100% or 0-4.0 scale.'
              }));
              return;
            }
          } else {
            // GPA scale: 0-4
            if (numValue < 0 || numValue > 4) {
              setErrors(prev => ({
                ...prev,
                [`education_${index}_gpa`]: 'GPA must be between 0-4.0 scale or 0-100%.'
              }));
              return;
            }
          }
        }
        // If it's text (like "Very Good", "Excellent"), allow it
        // Clear any previous errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`education_${index}_gpa`];
          return newErrors;
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
    }
  };

  // Skills handlers
  const handleSkillInputChange = (value) => {
    setNewSkill(value);
    if (value.trim()) {
      const searchTerm = value.toLowerCase().trim();
      const filtered = CS_SKILLS
        .filter(skill =>
          skill.toLowerCase().includes(searchTerm) &&
          !formData.skills.includes(skill)
        )
        .sort((a, b) => {
          // Prioritize skills that start with the search term
          const aStartsWith = a.toLowerCase().startsWith(searchTerm);
          const bStartsWith = b.toLowerCase().startsWith(searchTerm);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          // Then sort alphabetically
          return a.localeCompare(b);
        })
        .slice(0, 10); // Show max 10 suggestions
      setSkillSuggestions(filtered);
      setShowSkillSuggestions(filtered.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const selectSkill = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setNewSkill('');
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
  };

  const addSkill = () => {
    const skillToAdd = newSkill.trim();
    if (skillToAdd && !formData.skills.includes(skillToAdd)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillToAdd]
      }));
      setNewSkill('');
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Course handlers
  const addCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [...prev.courses, {
        courseName: '',
        provider: '',
        completionDate: '',
        category: '',
        certificateUrl: ''
      }]
    }));
  };

  const updateCourse = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === index ? { ...course, [field]: value } : course
      )
    }));
  };

  const removeCourse = async (index) => {
    const course = formData.courses[index];
    // If course has an ID, delete it from the backend
    if (course.id) {
      try {
        await courseService.deleteCourse(course.id);
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  // Language handlers
  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', proficiency: 'Professional', customLanguage: '' }]
    }));
  };

  const updateLanguage = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => {
        if (i === index) {
          const updated = { ...lang, [field]: value };
          // Clear customLanguage if language is not "Other"
          if (field === 'language' && value !== 'Other') {
            updated.customLanguage = '';
          }
          return updated;
        }
        return lang;
      })
    }));
  };

  const removeLanguage = (index) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  // Validation
  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = t('nameRequired') || 'Name is required';
      const fullPhone = `${countryCode}${phoneNumber}`;
      if (!phoneNumber.trim()) newErrors.phone = t('phoneRequired') || 'Phone number is required';
      // Update formData.phone with combined value
      setFormData(prev => ({ ...prev, phone: fullPhone }));
      if (!formData.title.trim()) newErrors.title = t('titleRequired');
      if (!formData.summary.trim()) newErrors.summary = t('summaryRequired');
    } else if (currentStep === 2) {
      // Skip experience validation entirely if user is a graduate
      const isGraduate = formData.isGraduate === true;
      
      if (!isGraduate) {
        // Only validate if user is NOT a graduate
        // Check if user has at least one experience entry with data
        const hasExperience = formData.experience.length > 0 && 
          formData.experience.some(exp => exp.position.trim() || exp.company.trim());
        
        if (!hasExperience) {
          // Require at least one experience entry for non-graduates
          newErrors.experience = t('atLeastOneExperienceRequired') || 'Please add at least one work experience entry.';
        } else {
          // Validate each experience entry that has data
          formData.experience.forEach((exp, index) => {
            const hasAnyData = exp.position.trim() || exp.company.trim() || exp.startDate || exp.endDate || exp.description.trim();
            if (hasAnyData) {
              if (!exp.position.trim()) newErrors[`experience_${index}_position`] = t('positionRequired');
              if (!exp.company.trim()) newErrors[`experience_${index}_company`] = t('companyRequired');
              
              // Validate date range: end date must be later than start date (unless current job)
              if (!exp.current && exp.startDate && exp.endDate) {
                const startDate = new Date(exp.startDate);
                const endDate = new Date(exp.endDate);
                if (endDate < startDate) {
                  newErrors[`experience_${index}_dateRange`] = 'End date must be later than start date.';
                }
              }
            }
          });
        }
      } else {
        // For graduates, validate graduation project
        if (!formData.graduationProject.title.trim()) {
          newErrors.graduationProjectTitle = t('projectTitleRequired') || 'Project title is required';
        }
        if (!formData.graduationProject.description.trim()) {
          newErrors.graduationProjectDescription = t('projectDescriptionRequired') || 'Project description is required';
        } else if (formData.graduationProject.description.trim().length < 200) {
          newErrors.graduationProjectDescription = t('projectDescriptionMinLength') || 'Project description must be at least 50 characters';
        }
        if (!formData.graduationProject.role.trim()) {
          newErrors.graduationProjectRole = t('roleInProjectRequired') || 'Your role in the project is required';
        }
        if (formData.graduationProject.technologies.length === 0) {
          newErrors.graduationProjectTechnologies = t('technologiesRequired') || 'At least one technology is required';
        }
        if (formData.projectSkills.length < 5) {
          newErrors.projectSkills = t('projectSkillsMinimumRequired') || 'Please select at least 5 skills gained from this project';
        }
      }
      // If isGraduate === true, no experience validation is performed (experience is optional)
    } else if (currentStep === 3) {
      formData.education.forEach((edu, index) => {
        const degreeValue = edu.degree === 'Other' ? (edu.customDegree || '').trim() : edu.degree.trim();
        if (!degreeValue) newErrors[`education_${index}_degree`] = t('degreeRequired');
        if (!edu.institution.trim()) newErrors[`education_${index}_institution`] = t('institutionRequired');
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep()) return;
    try {
      // Save courses to backend
      try {
        const existingCourseIds = formData.courses.filter(c => c.id).map(c => c.id);
        // Delete courses that were removed
        if (user?.courses) {
          const coursesToDelete = user.courses.filter(c => !existingCourseIds.includes(c.id));
          for (const course of coursesToDelete) {
            try {
              await courseService.deleteCourse(course.id);
            } catch (error) {
              console.error('Failed to delete course:', error);
            }
          }
        }
        // Create or update courses
        for (const course of formData.courses) {
          const courseData = {
            courseName: sanitizeText(course.courseName || ''),
            provider: sanitizeText(course.provider || ''),
            completionDate: course.completionDate || null,
            category: sanitizeText(course.category || ''),
            certificateUrl: course.certificateUrl || ''
          };
          if (course.id) {
            // Update existing course
            try {
              await courseService.updateCourse(course.id, courseData);
            } catch (error) {
              console.error('Failed to update course:', error);
            }
          } else if (course.courseName.trim()) {
            // Create new course
            try {
              await courseService.createCourse(courseData);
            } catch (error) {
              console.error('Failed to create course:', error);
            }
          }
        }
      } catch (courseError) {
        console.warn('Failed to save courses:', courseError);
        // Continue with CV generation even if course save fails
      }

      // Automatically improve project description with AI (if user is a graduate and has description)
      let improvedDescription = formData.graduationProject.description;
      if (formData.isGraduate && formData.graduationProject.title && formData.graduationProject.description.trim().length >= 200) {
        try {
          console.log('🤖 Automatically improving project description with AI...');
          const aiResponse = await api.post('/ai/improve-project-description', {
            description: formData.graduationProject.description
          });
          
          if (aiResponse.data?.success && aiResponse.data.data?.improvedDescription) {
            improvedDescription = aiResponse.data.data.improvedDescription;
            // Update the form data with improved description for UI display
            setFormData(prev => ({
              ...prev,
              graduationProject: {
                ...prev.graduationProject,
                description: improvedDescription
              }
            }));
            console.log('✅ Project description improved automatically');
          }
        } catch (aiError) {
          console.warn('Failed to improve project description with AI:', aiError);
          // Continue with original description if AI fails
        }
      }

      // Save graduation project to backend (if user is a graduate)
      if (formData.isGraduate && formData.graduationProject.title) {
        try {
          await api.post('/graduation-project', {
            title: formData.graduationProject.title,
            description: improvedDescription, // Use improved description
            technologies: formData.graduationProject.technologies,
            role: formData.graduationProject.role,
            duration: formData.graduationProject.duration,
            githubUrl: formData.graduationProject.githubUrl,
            supervisor: formData.graduationProject.supervisor,
            projectSkills: formData.projectSkills
          });
        } catch (projectError) {
          console.warn('Failed to save graduation project:', projectError);
          // Continue with CV generation even if project save fails
        }
      }

      // Update user profile if name, phone, or isGraduate has changed
      const fullPhone = `${countryCode}${phoneNumber}`.trim();
      if (user && (
        formData.fullName !== user.fullName || 
        fullPhone !== (user.phone || '') || 
        formData.isGraduate !== user.isGraduate
      )) {
        try {
          const profileResponse = await authService.updateProfile({
            fullName: formData.fullName.trim(),
            phone: fullPhone,
            countryCode: countryCode,
            isGraduate: formData.isGraduate
          });
          // Update local user context
          if (profileResponse?.data && updateUser) {
            updateUser({ ...user, ...profileResponse.data });
          }
        } catch (profileError) {
          console.warn('Failed to update user profile:', profileError);
          // Continue with CV generation even if profile update fails
        }
      }

      // Sanitize all text fields before saving
      // For graduates, ensure experience is empty array (not null/undefined)
      // For non-graduates, filter out completely empty experience entries
      let experienceToSave = [];
      if (formData.isGraduate) {
        // Graduates: always save empty array
        experienceToSave = [];
      } else {
        // Non-graduates: filter out empty entries but keep at least one if any data exists
        experienceToSave = formData.experience.filter(e => 
          e.position.trim() || e.company.trim() || e.startDate || e.endDate || e.description.trim()
        );
      }
      
      const payload = {
        title: sanitizeText(formData.title),
        summary: sanitizeText(formData.summary),
        skills: formData.skills.map(s => sanitizeText(String(s))),
        experience: experienceToSave.map(e => ({
          position: sanitizeText(e.position),
          company: sanitizeText(e.company),
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description ? sanitizeTextArray(e.description.split('\n').filter(Boolean)) : [],
          current: e.current
        })),
        education: formData.education.map(ed => ({
          degree: ed.degree === 'Other' ? sanitizeText(ed.customDegree || ed.degree) : sanitizeText(ed.degree),
          institution: sanitizeText(ed.institution),
          graduationDate: ed.graduationDate,
          fieldOfStudy: sanitizeText(ed.fieldOfStudy),
          gpa: ed.gpa ? sanitizeText(ed.gpa.trim()) : null
        })),
        languages: formData.languages.map(l => ({
          language: l.language === 'Other' ? sanitizeText(l.customLanguage || '') : sanitizeText(l.language),
          proficiency: l.proficiency
        })).filter(l => l.language && l.language.trim() !== ''),
        courses: formData.courses.filter(c => c.courseName.trim()).map(c => ({
          courseName: sanitizeText(c.courseName),
          provider: sanitizeText(c.provider || ''),
          completionDate: c.completionDate || '',
          category: sanitizeText(c.category || ''),
          certificateUrl: c.certificateUrl || ''
        })),
        graduationProject: formData.isGraduate && formData.graduationProject.title ? {
          title: sanitizeText(formData.graduationProject.title),
          description: sanitizeText(improvedDescription), // Use improved description
          technologies: formData.graduationProject.technologies.map(t => sanitizeText(t)),
          role: sanitizeText(formData.graduationProject.role),
          duration: sanitizeText(formData.graduationProject.duration || ''),
          githubUrl: formData.graduationProject.githubUrl || '',
          supervisor: sanitizeText(formData.graduationProject.supervisor || '')
        } : null,
        projectSkills: formData.isGraduate ? formData.projectSkills.map(s => sanitizeText(s)) : [],
        github: constructUrl(formData.github, 'github'),
        linkedin: constructUrl(formData.linkedin, 'linkedin')
      };

      let res;
      // If editing an existing resume, update it; otherwise create a new one
      if (resumeId) {
        res = await resumeService.updateResume(resumeId, payload);
      } else {
        res = await resumeService.generateDocx(payload);
      }

      if (res.success && res.downloadUrl) {
        // Construct full URL for download
        const apiBase = (process.env.REACT_APP_API_URL || 
          (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? `http://${window.location.hostname}:5000/api`
            : 'http://localhost:5000/api')).replace(/\/$/, '');
        const hostBase = apiBase.replace(/\/api$/, '');
        const fullUrl = res.downloadUrl.startsWith('http') 
          ? res.downloadUrl 
          : `${hostBase}${res.downloadUrl}`;
        setDownloadReadyUrl(fullUrl);
        setShowDownloadPrompt(true);
      } else {
        console.error('Failed to save CV:', res);
        alert(res.error || 'Failed to save resume');
      }
    } catch (e) {
      console.error('Failed to save resume:', e);
      alert(e.message || 'Failed to save resume');
    }
  };

  const suggestProfessionalSummary = async () => {
    try {
      const inputText = (formData.summary || '').trim();
      if (inputText.length < 50) {
        setErrors(prev => ({ ...prev, summary: t('summaryMinLength') }));
        return;
      }
      setIsSuggesting(true);
      // Build a concise content string from current form data
      const contentPieces = [];
      if (formData.summary) contentPieces.push(`User Summary Input (>=50 chars): ${formData.summary}`);
      if (formData.title) contentPieces.push(`Title: ${formData.title}`);
      if (formData.skills?.length) contentPieces.push(`Skills: ${formData.skills.join(', ')}`);
      if (formData.experience?.length) {
        const firstExp = formData.experience[0];
        const expSummary = [firstExp.position, firstExp.company].filter(Boolean).join(' at ');
        if (expSummary) contentPieces.push(`Recent Experience: ${expSummary}`);
      }
      if (formData.education?.length) {
        const firstEdu = formData.education[0];
        const eduSummary = [firstEdu.degree, firstEdu.fieldOfStudy, firstEdu.institution].filter(Boolean).join(' - ');
        if (eduSummary) contentPieces.push(`Education: ${eduSummary}`);
      }

      const payload = {
        section: 'professional_summary',
        content: contentPieces.join('. ') || 'Entry-level candidate seeking opportunities',
        context: formData.title || 'Career objective'
      };

      const response = await api.post('/ai/resume-suggestions', payload);
      if (response.data?.success && response.data.data?.suggestion) {
        handleChange('summary', response.data.data.suggestion);
        setErrors(prev => ({ ...prev, summary: '' }));
      }
    } catch (e) {
      console.error('AI suggest error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const steps = [
    { number: 1, title: t('profile'), icon: User },
    { number: 2, title: t('experience'), icon: Briefcase },
    { number: 3, title: t('education'), icon: GraduationCap },
    { number: 4, title: t('skills'), icon: Code },
    { number: 5, title: t('courses') || 'Courses', icon: BookOpen }
  ];

  return (
    <div className="cv-generator-container">
      <div className="cv-generator-card">
        {/* Progress Stepper */}
        <div className="progress-stepper">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            >
              <div className="step-number">
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content">
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="step-section">
              <h2><User size={28} /> {t('professionalProfile')}</h2>
              <p className="step-description">{t('professionalProfile')}</p>

              <div className="form-group">
                <label>{t('name') || 'Full Name'} *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder={t('enterName') || 'Enter your full name'}
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label><Phone size={18} /> {t('phoneNumber') || 'Phone Number'} *</label>
                <div className="phone-input-container">
                  <div className="custom-country-select-wrapper" ref={countrySelectRef}>
                    <button
                      type="button"
                      className={`country-code-select ${isCountrySelectOpen ? 'open' : ''}`}
                      onClick={() => setIsCountrySelectOpen(!isCountrySelectOpen)}
                    >
                      {(() => {
                        const selectedCountry = countryCodes.find(cc => cc.code === countryCode);
                        return selectedCountry ? (
                          <>
                            <ReactCountryFlag 
                              countryCode={selectedCountry.countryCode} 
                              svg 
                              style={{ 
                                width: '1.3em', 
                                height: '1.3em', 
                                marginRight: isRTL ? '0' : '8px',
                                marginLeft: isRTL ? '8px' : '0'
                              }} 
                            />
                            <span>{selectedCountry.code} {selectedCountry.country}</span>
                          </>
                        ) : (
                          <span>{t('select') || 'Select'}</span>
                        );
                      })()}
                    </button>
                    {isCountrySelectOpen && (
                      <div className="country-select-dropdown">
                        {countryCodes.map(cc => (
                          <button
                            key={cc.code}
                            type="button"
                            className={`country-select-option ${cc.code === countryCode ? 'selected' : ''}`}
                            onClick={() => {
                              setCountryCode(cc.code);
                              setIsCountrySelectOpen(false);
                            }}
                          >
                            <ReactCountryFlag 
                              countryCode={cc.countryCode} 
                              svg 
                              style={{ 
                                width: '1.3em', 
                                height: '1.3em', 
                                marginRight: isRTL ? '0' : '8px',
                                marginLeft: isRTL ? '8px' : '0'
                              }} 
                            />
                            <span>{cc.code} {cc.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    className={`phone-number-input ${errors.phone ? 'error' : ''}`}
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow numbers
                      const numbersOnly = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(numbersOnly);
                    }}
                    placeholder={t('phonePlaceholder') || '795600000'}
                  />
                </div>
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>{t('professionalTitle')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>{t('professionalSummary')} *</label>
                <textarea
                  required
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder={t('summaryPlaceholder')}
                  rows={5}
                  className={errors.summary ? 'error' : ''}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px', marginBottom: '8px' }}>
                  <button 
                    type="button" 
                    className={`ai-suggest-btn ${formData.summary.trim().length < 50 ? 'disabled' : ''}`} 
                    onClick={suggestProfessionalSummary} 
                    disabled={isSuggesting || formData.summary.trim().length < 50}
                    title={formData.summary.trim().length < 50 ? t('summaryMinLength') : t('aiSuggestTooltip')}
                  >
                    <Sparkles size={20} /> {isSuggesting ? t('generating') : t('aiSuggest')}
                  </button>
                </div>
                <div className="summary-hint">
                  {formData.summary.trim().length < 50 ? 
                    `${50 - formData.summary.trim().length} ${t('moreCharactersNeeded')}` : 
                    t('looksGood')}
                </div>
                {errors.summary && <span className="error-message">{errors.summary}</span>}
              </div>

              <div className="form-group">
                <label><Github size={18} /> {t('githubProfile')}</label>
                <div 
                  className="github-input-container unified-input-box"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '14px 16px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    backgroundColor: '#fff',
                    minHeight: '52px',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                >
                  <span style={{ 
                    color: '#6b7280', 
                    fontSize: '18px', 
                    whiteSpace: 'nowrap', 
                    fontWeight: 500,
                    marginRight: '4px',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    flexShrink: 0
                  }}>github.com/</span>
                  <input
                    type="text"
                    value={formData.github}
                    onChange={(e) => handleChange('github', e.target.value)}
                    onFocus={(e) => {
                      const container = e.target.closest('.github-input-container');
                      if (container) {
                        container.style.borderColor = '#00a651';
                        container.style.boxShadow = '0 0 0 3px rgba(0, 166, 81, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      const container = e.target.closest('.github-input-container');
                      if (container) {
                        container.style.borderColor = '#d1d5db';
                        container.style.boxShadow = 'none';
                      }
                    }}
                    placeholder={t('githubUsernamePlaceholder') || 'username'}
                    style={{ 
                      border: 'none !important', 
                      outline: 'none !important', 
                      flex: 1, 
                      fontSize: '18px', 
                      padding: '0 !important',
                      margin: '0 !important',
                      minHeight: '24px',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      fontWeight: '500',
                      backgroundColor: 'transparent !important',
                      width: '100%',
                      color: '#111827',
                      boxShadow: 'none !important',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                </div>
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                  {t('githubUsernameHint') || 'Enter only your username (e.g., johndoe)'}
                </small>
              </div>

              <div className="form-group">
                <label><Linkedin size={18} /> {t('linkedinProfile')}</label>
                <div 
                  className="linkedin-input-container unified-input-box"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '14px 16px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    backgroundColor: '#fff',
                    minHeight: '52px',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                >
                  <span style={{ 
                    color: '#6b7280', 
                    fontSize: '18px', 
                    whiteSpace: 'nowrap', 
                    fontWeight: 500,
                    marginRight: '4px',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    flexShrink: 0
                  }}>linkedin.com/in/</span>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    onFocus={(e) => {
                      const container = e.target.closest('.linkedin-input-container');
                      if (container) {
                        container.style.borderColor = '#00a651';
                        container.style.boxShadow = '0 0 0 3px rgba(0, 166, 81, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      const container = e.target.closest('.linkedin-input-container');
                      if (container) {
                        container.style.borderColor = '#d1d5db';
                        container.style.boxShadow = 'none';
                      }
                    }}
                    placeholder={t('linkedinUsernamePlaceholder') || 'username'}
                    style={{ 
                      border: 'none !important', 
                      outline: 'none !important', 
                      flex: 1, 
                      fontSize: '18px', 
                      padding: '0 !important',
                      margin: '0 !important',
                      minHeight: '24px',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      fontWeight: '500',
                      backgroundColor: 'transparent !important',
                      width: '100%',
                      color: '#111827',
                      boxShadow: 'none !important',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                </div>
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                  {t('linkedinUsernameHint') || 'Enter only your username (e.g., johndoe)'}
                </small>
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="step-section">
              <h2><Briefcase size={28} /> {t('workExperience')}</h2>
              <p className="step-description">{t('workExperience')}</p>

              {/* Fresh Graduate Toggle */}
              <div className="form-group graduate-toggle" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div className="toggle-container">
                  <div 
                    className={`toggle-switch ${formData.isGraduate ? 'on' : 'off'}`}
                    onClick={() => {
                      const isChecked = !formData.isGraduate;
                      setFormData(prev => ({
                        ...prev,
                        isGraduate: isChecked,
                        // Clear experience to empty array if user checks the graduate box
                        experience: isChecked ? [] : (prev.experience.length === 0 ? [{ position: '', company: '', startDate: '', endDate: '', description: '', current: false }] : prev.experience)
                      }));
                      // No auto-navigation - user stays on current step
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="toggle-circle"></div>
                  </div>
                  <label 
                    onClick={() => {
                      const isChecked = !formData.isGraduate;
                      setFormData(prev => ({
                        ...prev,
                        isGraduate: isChecked,
                        // Clear experience to empty array if user checks the graduate box
                        experience: isChecked ? [] : (prev.experience.length === 0 ? [{ position: '', company: '', startDate: '', endDate: '', description: '', current: false }] : prev.experience)
                      }));
                      // No auto-navigation - user stays on current step
                    }}
                    style={{ cursor: 'pointer', fontWeight: 500, fontSize: '15px', color: '#374151', marginLeft: '12px', userSelect: 'none' }}
                  >
                    {t('iAmFreshGraduate') || 'I am a fresh graduate / I have no prior work experience'}
                  </label>
                </div>
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                  {formData.isGraduate 
                    ? (t('workExperienceOptionalMessage') || 'You can proceed without work experience. This field is optional for fresh graduates.')
                    : (t('workExperienceRequiredMessage') || 'Please add at least one work experience entry if available.')
                  }
                </p>
              </div>

              {/* Prompt for fresh graduates */}
              {formData.isGraduate && (
                <div className="graduate-message-block" style={{
                  padding: '24px',
                  backgroundColor: '#eff6ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  transition: 'opacity 0.4s ease, transform 0.4s ease'
                }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: '#1e40af', fontWeight: 700 }}>
                    💡 {t('graduateProjectPrompt') || 'Since you don\'t have work experience, please add your graduation project and highlight the key skills you gained.'}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#1e3a8a', 
                    lineHeight: '1.6'
                  }}>
                    {t('graduateProjectPromptDesc') || 'Your graduation project demonstrates your technical abilities and problem-solving skills. This will help employers understand your capabilities.'}
                  </p>
                </div>
              )}

              {/* Graduation Project Section - Only shown when isGraduate is true */}
              {formData.isGraduate && (
                <div className="graduation-project-section" style={{
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '20px', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GraduationCap size={24} /> {t('graduationProject') || 'Graduation Project / Final Year Project'}
                  </h3>

                  <div className="form-group">
                    <label>{t('projectTitle') || 'Project Title'} *</label>
                    <input
                      type="text"
                      value={formData.graduationProject.title}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        graduationProject: { ...prev.graduationProject, title: e.target.value }
                      }))}
                      placeholder={t('projectTitlePlaceholder') || 'e.g., E-Commerce Platform with AI Recommendations'}
                      className={errors.graduationProjectTitle ? 'error' : ''}
                    />
                    {errors.graduationProjectTitle && (
                      <span className="error-message">{errors.graduationProjectTitle}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('projectDescription') || 'Project Description'} *</label>
                    <textarea
                      value={formData.graduationProject.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        graduationProject: { ...prev.graduationProject, description: e.target.value }
                      }))}
                      placeholder={t('projectDescriptionPlaceholder') || 'Describe your project in detail (minimum 200 characters). Include the problem you solved, your approach, and the results achieved.'}
                      rows={6}
                      className={errors.graduationProjectDescription ? 'error' : ''}
                    />
                    <div className="summary-hint" style={{ marginTop: '8px' }}>
                      {formData.graduationProject.description.trim().length < 50 ? 
                        `${50 - formData.graduationProject.description.trim().length} ${t('moreCharactersNeeded') || 'more characters needed'}` : 
                        t('looksGood') || '✓ Looks good!'}
                    </div>
                    {errors.graduationProjectDescription && (
                      <span className="error-message">{errors.graduationProjectDescription}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('roleInProject') || 'Your Role in the Project'} *</label>
                      <input
                        type="text"
                        value={formData.graduationProject.role}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          graduationProject: { ...prev.graduationProject, role: e.target.value }
                        }))}
                        placeholder={t('roleInProjectPlaceholder') || 'e.g., Full-stack Developer, Team Lead, Database Designer'}
                        className={errors.graduationProjectRole ? 'error' : ''}
                      />
                      {errors.graduationProjectRole && (
                        <span className="error-message">{errors.graduationProjectRole}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>{t('projectDuration') || 'Project Duration'}</label>
                      <input
                        type="text"
                        value={formData.graduationProject.duration}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          graduationProject: { ...prev.graduationProject, duration: e.target.value }
                        }))}
                        placeholder={t('projectDurationPlaceholder') || 'e.g., 6 months, 1 semester'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('technologiesUsed') || 'Technologies Used'} *</label>
                    <div className="skills-input-container" style={{ position: 'relative' }}>
                      <div className="skills-input">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewSkill(value);
                            // Filter from CS_SKILLS for technologies
                            if (value.trim()) {
                              const searchTerm = value.toLowerCase().trim();
                              const filtered = CS_SKILLS
                                .filter(skill =>
                                  skill.toLowerCase().includes(searchTerm) &&
                                  !formData.graduationProject.technologies.includes(skill)
                                )
                                .slice(0, 10);
                              setSkillSuggestions(filtered);
                              setShowSkillSuggestions(filtered.length > 0);
                            } else {
                              setSkillSuggestions([]);
                              setShowSkillSuggestions(false);
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (skillSuggestions.length > 0) {
                                const tech = skillSuggestions[0];
                                setFormData(prev => ({
                                  ...prev,
                                  graduationProject: {
                                    ...prev.graduationProject,
                                    technologies: [...prev.graduationProject.technologies, tech]
                                  }
                                }));
                                setNewSkill('');
                                setSkillSuggestions([]);
                                setShowSkillSuggestions(false);
                              } else if (newSkill.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  graduationProject: {
                                    ...prev.graduationProject,
                                    technologies: [...prev.graduationProject.technologies, newSkill.trim()]
                                  }
                                }));
                                setNewSkill('');
                              }
                            }
                          }}
                          placeholder={t('technologiesPlaceholder') || 'Type to search technologies (e.g., React, Node.js, MongoDB...)'}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            if (newSkill.trim() && !formData.graduationProject.technologies.includes(newSkill.trim())) {
                              setFormData(prev => ({
                                ...prev,
                                graduationProject: {
                                  ...prev.graduationProject,
                                  technologies: [...prev.graduationProject.technologies, newSkill.trim()]
                                }
                              }));
                              setNewSkill('');
                            }
                          }}
                          className="add-skill-btn"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      {showSkillSuggestions && skillSuggestions.length > 0 && (
                        <div className="skill-suggestions" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          maxHeight: '300px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {skillSuggestions.map((skill, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  graduationProject: {
                                    ...prev.graduationProject,
                                    technologies: [...prev.graduationProject.technologies, skill]
                                  }
                                }));
                                setNewSkill('');
                                setSkillSuggestions([]);
                                setShowSkillSuggestions(false);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: index < skillSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="skills-tags">
                      {formData.graduationProject.technologies.map((tech, index) => (
                        <span key={index} className="skill-tag">
                          {tech}
                          <button onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              graduationProject: {
                                ...prev.graduationProject,
                                technologies: prev.graduationProject.technologies.filter((_, i) => i !== index)
                              }
                            }));
                          }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('githubRepository') || 'GitHub / Repository Link (Optional)'}</label>
                      <input
                        type="url"
                        value={formData.graduationProject.githubUrl}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          graduationProject: { ...prev.graduationProject, githubUrl: e.target.value }
                        }))}
                        placeholder="https://github.com/username/project"
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('supervisor') || 'Supervisor / Professor'}</label>
                      <input
                        type="text"
                        value={formData.graduationProject.supervisor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          graduationProject: { ...prev.graduationProject, supervisor: e.target.value }
                        }))}
                        placeholder={t('supervisorPlaceholder') || 'e.g., Dr. John Smith'}
                      />
                    </div>
                  </div>

                  {/* Project Skills Selection */}
                  {formData.graduationProject.title && formData.graduationProject.description.length >= 200 && (
                    <div className="project-skills-section" style={{
                      marginTop: '24px',
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px'
                    }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                        {t('projectSkillsQuestion') || 'What skills did you gain from this project?'}
                      </h4>
                      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                        {t('projectSkillsHint') || 'Select at least 5-7 skills that you developed or used during this project:'}
                      </p>
                      
                      <div className="project-skills-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        {[
                          'Teamwork', 'Problem solving', 'Research ability', 'Documentation writing',
                          'Time management', 'Presentation skills', 'Version control (Git)',
                          'Working with APIs', 'Understanding of databases', 'Code review',
                          'Testing & debugging', 'Project planning', 'Client communication',
                          'Agile methodology', 'Technical writing', 'System design',
                          'Data analysis', 'UI/UX design', 'Security practices', 'Performance optimization'
                        ].map((skill) => (
                          <label
                            key={skill}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 14px',
                              backgroundColor: formData.projectSkills.includes(skill) ? '#dcfce7' : 'white',
                              border: `2px solid ${formData.projectSkills.includes(skill) ? '#10b981' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontWeight: formData.projectSkills.includes(skill) ? 600 : 400
                            }}
                            onMouseEnter={(e) => {
                              if (!formData.projectSkills.includes(skill)) {
                                e.target.style.borderColor = '#9ca3af';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!formData.projectSkills.includes(skill)) {
                                e.target.style.borderColor = '#e5e7eb';
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.projectSkills.includes(skill)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    projectSkills: [...prev.projectSkills, skill]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    projectSkills: prev.projectSkills.filter(s => s !== skill)
                                  }));
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{skill}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.projectSkills.length > 0 && (
                        <div style={{
                          padding: '12px',
                          backgroundColor: formData.projectSkills.length >= 5 ? '#dcfce7' : '#fef3c7',
                          border: `1px solid ${formData.projectSkills.length >= 5 ? '#10b981' : '#f59e0b'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: formData.projectSkills.length >= 5 ? '#065f46' : '#92400e',
                          fontWeight: 500
                        }}>
                          {formData.projectSkills.length >= 5 
                            ? `✓ ${t('projectSkillsMinimumMet') || 'Great! You\'ve selected enough skills.'}`
                            : `${5 - formData.projectSkills.length} ${t('moreSkillsNeeded') || 'more skills needed (minimum 5)'}`
                          }
                        </div>
                      )}
                      {errors.projectSkills && (
                        <span className="error-message" style={{ display: 'block', marginTop: '8px' }}>{errors.projectSkills}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Work Experience Section - Hidden when isGraduate is true */}
              <div className={`experience-section ${formData.isGraduate ? 'hidden' : ''}`}>

                {formData.experience.map((exp, index) => (
                  <div key={index} className="dynamic-section">
                    <div className="section-header">
                      <h3>{t('experience')} #{index + 1}</h3>
                      {formData.experience.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-btn"
                          onClick={() => removeExperience(index)}
                        >
                          <X size={18} /> {t('remove')}
                        </button>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('position')} *</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          placeholder={t('positionPlaceholder')}
                          className={errors[`experience_${index}_position`] ? 'error' : ''}
                        />
                        {errors[`experience_${index}_position`] && (
                          <span className="error-message">{errors[`experience_${index}_position`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>{t('company')} *</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          placeholder={t('companyPlaceholder')}
                          className={errors[`experience_${index}_company`] ? 'error' : ''}
                        />
                        {errors[`experience_${index}_company`] && (
                          <span className="error-message">{errors[`experience_${index}_company`]}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('startDate')}</label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className={errors[`experience_${index}_dateRange`] ? 'error' : ''}
                        />
                      </div>

                      <div className="form-group">
                        <label>{t('endDate')}</label>
                        {exp.current ? (
                          <input
                            type="text"
                            value="Present"
                            disabled
                            style={{ 
                              backgroundColor: '#f3f4f6', 
                              cursor: 'not-allowed',
                              color: '#6b7280'
                            }}
                          />
                        ) : (
                          <input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                            className={errors[`experience_${index}_dateRange`] ? 'error' : ''}
                          />
                        )}
                        {errors[`experience_${index}_dateRange`] && (
                          <span className="error-message" style={{ display: 'block', marginTop: '4px' }}>
                            {errors[`experience_${index}_dateRange`]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id={`current-${index}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                      />
                      <label htmlFor={`current-${index}`}>{t('currentlyWorkHere')}</label>
                    </div>

                    <div className="form-group">
                      <label>{t('description')}</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
                
                {errors.experience && (
                  <span className="error-message" style={{ display: 'block', marginBottom: '16px' }}>{errors.experience}</span>
                )}

                <button type="button" className="add-btn" onClick={addExperience}>
                  <Plus size={18} /> {t('addExperience')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <div className="step-section">
              <h2><GraduationCap size={28} /> {t('education')}</h2>
              <p className="step-description">{t('educationalBackground')}</p>

              {formData.education.map((edu, index) => (
                <div key={index} className="dynamic-section">
                  <div className="section-header">
                    <h3>{t('education')} #{index + 1}</h3>
                    {formData.education.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeEducation(index)}
                      >
                        <X size={18} /> {t('remove')}
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('degree')} *</label>
                    <select
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className={errors[`education_${index}_degree`] ? 'error' : ''}
                    >
                      <option value="">{t('selectDegree') || 'Select a degree'}</option>
                      {DEGREE_OPTIONS.map((degree) => (
                        <option key={degree} value={degree}>
                          {degree}
                        </option>
                      ))}
                    </select>
                    {edu.degree === 'Other' && (
                      <input
                        type="text"
                        value={edu.customDegree || ''}
                        onChange={(e) => updateEducation(index, 'customDegree', e.target.value)}
                        placeholder={t('enterDegree') || 'Enter your degree'}
                        style={{ marginTop: '10px' }}
                        className={errors[`education_${index}_degree`] ? 'error' : ''}
                      />
                    )}
                    {errors[`education_${index}_degree`] && (
                      <span className="error-message">{errors[`education_${index}_degree`]}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('institution')} *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder={t('institutionPlaceholder')}
                      className={errors[`education_${index}_institution`] ? 'error' : ''}
                    />
                    {errors[`education_${index}_institution`] && (
                      <span className="error-message">{errors[`education_${index}_institution`]}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('fieldOfStudy')}</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                        placeholder={t('fieldOfStudyPlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('graduationDate')}</label>
                      <input
                        type="month"
                        value={edu.graduationDate}
                        onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>GPA / Grade (optional)</label>
                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                      placeholder="e.g., 3.6, 88%, Very Good, Excellent"
                      className={errors[`education_${index}_gpa`] ? 'error' : ''}
                    />
                    {errors[`education_${index}_gpa`] && (
                      <span className="error-message">{errors[`education_${index}_gpa`]}</span>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Enter GPA (0-4.0 scale), percentage (0-100%), or text grade (e.g., Very Good, Excellent)
                    </small>
                  </div>
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addEducation}>
                <Plus size={18} /> {t('addEducation')}
              </button>
            </div>
          )}

          {/* Step 4: Skills & Languages */}
          {currentStep === 4 && (
            <div className="step-section">
              <h2><Code size={28} /> {t('skillsLanguages')}</h2>
              <p className="step-description">{t('showcaseExpertise')}</p>

              <div className="form-group">
                <label>{t('technicalSkills')}</label>
                <div className="skills-input-container" style={{ position: 'relative' }}>
                  <div className="skills-input">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (skillSuggestions.length > 0) {
                            selectSkill(skillSuggestions[0]);
                          } else {
                            addSkill();
                          }
                        }
                      }}
                      onFocus={() => {
                        if (newSkill.trim() && skillSuggestions.length > 0) {
                          setShowSkillSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSkillSuggestions(false), 200);
                      }}
                      placeholder={t('skillPlaceholder') || 'Type to search skills (e.g., C, Java, React...)'}
                    />
                    <button type="button" onClick={addSkill} className="add-skill-btn">
                      <Plus size={18} />
                    </button>
                  </div>
                  {showSkillSuggestions && skillSuggestions.length > 0 && (
                    <div className="skill-suggestions" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {skillSuggestions.map((skill, index) => (
                        <div
                          key={index}
                          onClick={() => selectSkill(skill)}
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < skillSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="skills-tags">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label><Globe size={18} /> {t('languages')}</label>
                {formData.languages.map((lang, index) => (
                  <div key={index}>
                    <div className="language-row">
                      <select
                        value={lang.language}
                        onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                        className={lang.language === 'Other' ? 'language-select' : ''}
                      >
                        <option value="">{t('selectLanguage') || 'Select a language'}</option>
                        {LANGUAGE_OPTIONS.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                      >
                        <option value="Native">{t('native')}</option>
                        <option value="Fluent">{t('fluent')}</option>
                        <option value="Professional">{t('professional')}</option>
                        <option value="Limited">{t('limited')}</option>
                      </select>
                      {formData.languages.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-lang-btn"
                          onClick={() => removeLanguage(index)}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    {lang.language === 'Other' && (
                      <input
                        type="text"
                        value={lang.customLanguage || ''}
                        onChange={(e) => updateLanguage(index, 'customLanguage', e.target.value)}
                        placeholder={t('enterLanguage') || 'Enter language name'}
                        style={{ marginTop: '8px', marginBottom: '12px', width: '100%' }}
                      />
                    )}
                  </div>
                ))}
                <button type="button" className="add-btn" onClick={addLanguage}>
                  <Plus size={18} /> {t('addLanguage')}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Courses */}
          {currentStep === 5 && (
            <div className="step-section">
              <h2><BookOpen size={28} /> {t('courses') || 'Courses & Certifications'}</h2>
              <p className="step-description">{t('coursesDescription') || 'Add relevant courses and certifications to enhance your profile'}</p>

              {formData.courses.map((course, index) => (
                <div key={index} className="course-entry" style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#374151' }}>
                      {t('course')} {index + 1}
                    </h3>
                    {formData.courses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCourse(index)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        <X size={16} /> {t('remove') || 'Remove'}
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{t('courseName') || 'Course Name'} *</label>
                    <input
                      type="text"
                      value={course.courseName}
                      onChange={(e) => updateCourse(index, 'courseName', e.target.value)}
                      placeholder={t('courseNamePlaceholder') || 'e.g., Introduction to Machine Learning'}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('provider') || 'Provider/Institution'}</label>
                    <input
                      type="text"
                      value={course.provider}
                      onChange={(e) => updateCourse(index, 'provider', e.target.value)}
                      placeholder={t('providerPlaceholder') || 'e.g., Coursera, Udemy, University Name'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>{t('completionDate') || 'Completion Date'}</label>
                      <input
                        type="date"
                        value={course.completionDate}
                        onChange={(e) => updateCourse(index, 'completionDate', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('category') || 'Category'}</label>
                      <input
                        type="text"
                        value={course.category}
                        onChange={(e) => updateCourse(index, 'category', e.target.value)}
                        placeholder={t('categoryPlaceholder') || 'e.g., Data Science, Web Development'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('certificateUrl') || 'Certificate URL (Optional)'}</label>
                    <input
                      type="url"
                      value={course.certificateUrl}
                      onChange={(e) => updateCourse(index, 'certificateUrl', e.target.value)}
                      placeholder={t('certificateUrlPlaceholder') || 'https://...'}
                    />
                  </div>
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addCourse}>
                <Plus size={18} /> {t('addCourse') || 'Add Course'}
              </button>

              {formData.isGraduate && formData.courses.length === 0 && (
                <div className="graduate-message-block" style={{ marginTop: '20px' }}>
                  <p style={{ margin: 0, color: '#047857', fontSize: '0.95rem' }}>
                    💡 {t('coursesTipForGraduates') || 'Adding relevant courses increases your hiring score by 35% for fresh graduates!'}
                  </p>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button 
                  type="button" 
                  onClick={handleSave}
                  disabled={loadingResume}
                  style={{
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: loadingResume ? 'not-allowed' : 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingResume) {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingResume) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  {t('skip') || 'Skip'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="form-actions">
          {currentStep > 1 && (
            <button type="button" className="back-btn" onClick={handleBack}>
              <ArrowLeft size={18} /> {t('back')}
            </button>
          )}
          
          <div className="step-indicator">
            {t('step')} {currentStep} {t('of')} 5
          </div>

          {currentStep < 5 ? (
            <button type="button" className="next-btn" onClick={handleNext}>
              {t('next')} <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" className="save-btn" onClick={handleSave} disabled={loadingResume}>
              <Save size={18} /> {resumeId ? (t('updateCV') || 'Update CV') : (t('saveCV') || 'Save CV')}
            </button>
          )}
        </div>
      </div>

      {showDownloadPrompt && (
        <div className="download-modal" role="dialog" aria-modal="true" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:420,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <h3 style={{margin:'0 0 8px'}}>{resumeId ? (t('cvUpdated') || 'CV Updated!') : (t('cvReady') || 'CV Ready!')}</h3>
            <p style={{margin:'0 0 16px',color:'#4b5563'}}>{resumeId ? (t('cvUpdatedMessage') || 'Your CV has been updated successfully!') : (t('downloadPrompt') || 'Your CV is ready to download.')}</p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button
                onClick={() => {
                  setShowDownloadPrompt(false);
                  navigate('/dashboard');
                }}
                style={{padding:'10px 14px',border:'1px solid #e5e7eb',borderRadius:10,background:'#fff',cursor:'pointer',fontWeight:700,color:'#374151'}}
              >
                {t('goToDashboard') || 'Go to Dashboard'}
              </button>
              <button
                onClick={() => {
                  if (downloadReadyUrl) {
                    const a = document.createElement('a');
                    a.href = downloadReadyUrl;
                    a.download = '';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }
                  setShowDownloadPrompt(false);
                  navigate('/dashboard');
                }}
                style={{padding:'10px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',cursor:'pointer',fontWeight:800}}
              >
                {t('downloadGo') || 'Download & Go'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVGenerator;