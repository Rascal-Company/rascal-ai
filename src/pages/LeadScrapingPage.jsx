import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { createPortal } from 'react-dom'
import Button from '../components/Button'
import MultiSelect from '../components/MultiSelect'

export default function LeadScrapingPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { user, organization } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter states
  const [openFilters, setOpenFilters] = useState({
    contact: false,
    jobTitle: false,
    management: false,
    departments: false,
    names: false,
    company: false,
    peopleLocation: false,
    companyLocation: false,
    leadLimit: false
  })
  
  // Buyer Persona / Ideal Customer
  const [buyerPersona, setBuyerPersona] = useState('')
  const [savingPersona, setSavingPersona] = useState(false)
  const [showBuyerPersonaModal, setShowBuyerPersonaModal] = useState(false)
  
  // Contact Filters
  const [emailStatus, setEmailStatus] = useState('')
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  
  // Job Title Filters
  const [jobTitlesIncludes, setJobTitlesIncludes] = useState([])
  const [jobTitlesExcludes, setJobTitlesExcludes] = useState([])
  const [includeSimilarTitles, setIncludeSimilarTitles] = useState(false)
  const [additionalTitles, setAdditionalTitles] = useState('')
  
  // Management Level Filters
  const [managementLevelIncludes, setManagementLevelIncludes] = useState([])
  const [managementLevelExcludes, setManagementLevelExcludes] = useState([])
  
  // Departments & Job Function Filters
  const [departmentsIncludes, setDepartmentsIncludes] = useState([])
  const [departmentsExcludes, setDepartmentsExcludes] = useState([])
  
  // Name Filters
  const [firstNameIncludes, setFirstNameIncludes] = useState('')
  const [firstNameExcludes, setFirstNameExcludes] = useState('')
  const [lastNameIncludes, setLastNameIncludes] = useState('')
  const [lastNameExcludes, setLastNameExcludes] = useState('')
  
  // Company Filters
  const [employeeRange, setEmployeeRange] = useState([])
  const [industriesIncludes, setIndustriesIncludes] = useState([])
  const [industriesExcludes, setIndustriesExcludes] = useState([])
  const [foundedYearFrom, setFoundedYearFrom] = useState('')
  const [foundedYearTo, setFoundedYearTo] = useState('')
  const [companyDomains, setCompanyDomains] = useState('')
  
  // Location Filters - People
  const [peopleCountryIncludes, setPeopleCountryIncludes] = useState([])
  const [peopleCountryExcludes, setPeopleCountryExcludes] = useState([])
  const [peopleStateIncludes, setPeopleStateIncludes] = useState([])
  const [peopleStateExcludes, setPeopleStateExcludes] = useState([])
  const [peopleCityIncludes, setPeopleCityIncludes] = useState('')
  const [peopleCityExcludes, setPeopleCityExcludes] = useState('')
  
  // Location Filters - Company
  const [companyCountryIncludes, setCompanyCountryIncludes] = useState([])
  const [companyCountryExcludes, setCompanyCountryExcludes] = useState([])
  const [companyStateIncludes, setCompanyStateIncludes] = useState([])
  const [companyStateExcludes, setCompanyStateExcludes] = useState([])
  const [companyCityIncludes, setCompanyCityIncludes] = useState('')
  const [companyCityExcludes, setCompanyCityExcludes] = useState('')

  // Options for dropdowns - Pipeline Labs mukaan (sallitut arvot - täsmälleen sama järjestys kuin API)
  const jobTitleOptions = [
    'Director', 'Manager', 'Founder', 'General Manager', 'Consultant', 'Chief Executive Officer', 'Co-Founder', 'Account Manager', 'Chief Financial Officer', 'Human Resources Manager', 'Director Of Marketing', 'Executive Director', 'Executive Assistant', 'Administrative Assistant', 'Director Of Human Resources', 'Associate', 'Chief Operating Officer', 'HR Manager', 'Account Executive', 'Business Development Manager', 'Director Of Operations', 'Controller', 'Chief Technology Officer', 'Chief Information Officer', 'Founder & CEO', 'Attorney', 'IT Manager', 'Assistant Manager', 'Engineer', 'Business Analyst', 'Accountant', 'Chief Marketing Officer', 'Creative Director', 'Director Of Sales', 'Graphic Designer', 'Analyst', 'Human Resources Director', 'Founder And CEO', 'Director, Information Technology', 'Digital Marketing Manager', 'Business Owner', 'Assistant Professor', 'Branch Manager', 'HR Director', 'Administrator', 'Customer Service Representative', 'HR Business Partner', 'Co Founder', 'Designer', 'Intern', 'Lecturer', 'Architect', 'Director Of Information Technology', 'Information Technology Manager', 'Co-Founder & CEO', 'Co-Owner', 'Director, Human Resources', 'Business Development', 'IT Director', 'Associate Professor', 'Finance Manager', 'Director Of Business Development', 'Developer', 'Business Manager', 'Director Of Engineering', 'Human Resources', 'Manager, Information Technology', 'Customer Service', 'Key Account Manager', 'Executive Vice President', 'Financial Analyst', 'HR Generalist', 'Financial Advisor', 'Instructor', 'Engineering Manager', 'Art Director', 'Director Of Sales And Marketing', 'Area Manager', 'CEO & Founder', 'Director Of Finance', 'Data Analyst', 'Associate Director', 'Accounting Manager', 'Docente', 'Customer Service Manager', 'IT Specialist', 'Account Director', 'Data Scientist', 'District Manager', 'Human Resources Business Partner', 'Co-Founder And CEO', 'Assistant Principal', 'Information Technology Director', 'Facilities Manager', 'Director Human Resources', 'Exec/Management (Other)', 'Area Sales Manager', 'Executive', 'Human Resources Generalist', 'Cashier', 'Design Engineer', 'CEO & Co-Founder', 'IT Project Manager', 'Electrical Engineer', 'Finance Director', 'Head Of Marketing', 'Independent Consultant', 'Agent', 'Brand Manager', 'Buyer', 'Financial Controller', 'Broker', 'Human Resource Manager', 'Adjunct Professor', 'Founder, CEO', 'Customer Success Manager', 'Artist', 'Chairman', 'Graduate Student', 'CEO And Founder', 'Director Of IT', 'Educator', 'Founder/CEO', 'IT Consultant', 'HR Coordinator', 'Co Owner', 'Lawyer', 'Chief Human Resources Officer', 'Dentist', 'Editor', 'Legal Assistant', 'Director Of Technology', 'Interior Designer', 'Chief Operations Officer', 'Business Development Executive', 'HR Specialist', 'Devops', 'Community Manager', 'Civil Engineer', 'Attorney At Law', 'Associate Consultant', 'CEO And Co-Founder', 'Electrician', 'General Counsel', 'District Sales Manager', 'Director Of Product Management', 'Assistant', 'Driver', 'Auditor', 'Director, Marketing', 'Business Consultant', 'Assistant Vice President', 'Digital Marketing Specialist', 'Deputy Manager', 'Human Resources Coordinator', 'English Teacher', 'Board Member', 'IT Analyst', 'Insurance Agent', 'Founding Partner', 'Event Manager', 'Director Of Development', 'Co-Founder & CTO', 'Auxiliar Administrativo', 'Database Administrator', 'Admin', 'Graduate Research Assistant', 'Associate Attorney', 'Chief Information Security Officer', 'Director Of HR', 'Chief Engineer', 'Communications Manager', 'Construction Manager', 'Coordinator', 'Director Of Communications', 'Estimator', 'Corporate Recruiter', 'Business Development Director', 'Enterprise Architect', 'Case Manager', 'Bookkeeper', 'Chief Revenue Officer', 'Analista', 'Assistente Administrativo', 'Bartender', 'Advisor', 'Development Manager', 'Co-Founder, CEO', 'Human Resources Specialist', 'Broker Associate', 'Doctor', 'Assistant Director', 'Consultor', 'CTO/Cio', 'Event Coordinator', 'Chef', 'Chief Product Officer', 'Director Of Digital Marketing', 'Application Developer', 'HR Assistant', 'HR Executive', 'Directeur', 'Executive Administrative Assistant', 'Captain', 'Licensed Realtor', 'Business Development Representative', 'Associate Broker', 'Director Of Sales & Marketing', 'Commercial Manager', 'HR Consultant', 'Management Trainee', 'Finance', 'Flight Attendant', 'Lead Engineer', 'Director Of Marketing And Communications', 'Manager, Human Resources', 'Assistant Project Manager', 'Application Engineer', 'Logistics Manager', 'Assistant General Manager', 'Lead Software Engineer', 'Employee', 'Founder And President', 'Independent Distributor', 'Director Of Recruiting', 'CEO/Founder', 'Associate Creative Director', 'Assistant Store Manager', 'Barista', 'Director Of Product Marketing', 'Corporate Controller', 'Director Of Talent Acquisition', 'Administrativo', 'Assistant Controller', 'Legal Secretary', 'Author', 'Commercial Director', 'Chief People Officer', 'Inside Sales Representative', 'Devops Engineer', 'Co-Founder And CTO', 'Broker/Owner', 'Advogado', 'Field Engineer', 'Maintenance Manager', 'Clerk', 'Field Service Engineer', 'Cofounder', 'Human Resources Assistant', 'Executive Chef', 'IT Administrator', 'General Sales Manager', 'Director, Business Development', 'Franchise Owner', 'Customer Service Supervisor', 'Adjunct Faculty', 'Benefits Manager', 'Inside Sales', 'Abogado', 'Java Developer', 'Head Of Product', 'Management Consultant', 'Contracts Manager', 'Freelance Writer', 'CEO/President/Owner', 'Journalist', 'Associate Software Engineer', 'Head Of HR', 'Internal Auditor', 'Head Of Information Technology', 'Founder & President', 'Accounting', 'Freelancer', 'Front Office Manager', 'Entrepreneur', 'HR Administrator', 'Graduate Teaching Assistant', 'Director Of Sales Operations', 'Diretor', 'Data Engineer', 'Librarian', 'Facility Manager', 'Administration', 'IT Architect', 'Legal Counsel', 'Maintenance Supervisor', 'Head Of Operations', 'Founder / CEO', 'Chief Strategy Officer', 'Communications Director', 'Development Director', 'Content Marketing Manager', 'Internship', 'Counselor', 'Assistant Superintendent', 'Business Systems Analyst', 'Design Director', 'CEO/President', 'Manager, Marketing', 'Coach', 'Freelance Graphic Designer', 'Lead Developer', 'Associate Manager', 'Android Developer', 'IT Department Manager', 'IT Engineer', 'Chiropractor', 'Credit Analyst', 'Independent Business Owner', 'Adjunct Instructor', 'Head Of Human Resources', 'Brand Ambassador', 'Copywriter', 'Chairman & CEO', 'Email Marketing Manager', 'Frontend Developer', 'Human Resource Director', 'Client Services Manager', 'IT Support Specialist', 'Contract Manager', 'Impiegato', 'CEO, Founder', 'Chief Medical Officer', 'Banker', 'Director Information Technology', 'Director Of Product', 'Director, Product Management', 'Country Manager', 'Financial Consultant', 'Administrador', 'Executive Assistant To CEO', 'Advogada', 'Field Marketing Manager', 'Business Intelligence Analyst', 'Director Marketing', 'Loan Officer', 'Freelance Photographer', 'Actor', 'Chef De Projet', 'Foreman', 'Information Technology Project Manager', 'Graduate Assistant', 'Inside Sales Manager', 'Department Manager', 'HR Officer', 'Account Coordinator', 'Deputy Director', 'Director Of Facilities', 'Executive Recruiter', 'IT Technician', 'CEO, Co-Founder', 'Full Stack Developer', 'CEO / Founder', 'Counsel', 'Logistics Coordinator', 'Founder And Chief Executive Officer', 'Chairman And CEO', 'Administrative Coordinator', 'Director Business Development', 'Category Manager', 'Data Architect', 'Information Technology', 'Head Of Sales', 'Chief Information Officer (Cio)', 'IT Recruiter', 'Information Security Analyst', 'Associate General Counsel', 'Inspector', 'Admin Assistant', 'Dispatcher', 'Contractor', 'Design Manager', 'Ecommerce Manager', 'Chief Technical Officer', 'Field Service Technician', 'Executive Secretary', 'Co-Founder, CTO', 'Director, Talent Acquisition', 'Accounting Assistant', 'Director, IT', 'Account Supervisor', 'Human Resources Administrator', 'Faculty', 'Administrative Officer', 'Front End Developer', 'Content Manager', 'Freelance', 'Maintenance Technician', 'Business Development Specialist', 'Business Development Consultant', 'Communications Specialist', 'Director, Product Marketing', 'Client Manager', 'Compliance Officer', 'Executive Producer', 'Customer Service Specialist', 'Certified Personal Trainer', 'Human Resources Executive', 'Chief Executive', 'HR Advisor', 'Compliance Manager', 'Head Of IT', 'IT Business Analyst', 'Homemaker', 'Events Manager', 'Fleet Manager', 'CEO & President', 'Carpenter', 'HR Recruiter', 'Director, Digital Marketing', 'Laboratory Technician', 'Associate Product Manager', 'Director Product Management', 'Independent Contractor', 'Accounts Payable', 'Digital Marketing Director', 'Instructional Designer', 'Digital Project Manager', 'Audit Manager', 'Estudante', 'Credit Manager', 'Eigenaar', 'Business Developer', 'Head Of Business Development', 'Avvocato', 'Chief Administrative Officer', 'Asset Manager', 'Accounts Payable Specialist', 'Chief Compliance Officer', 'Empleado', 'Digital Marketing Executive', 'Account Representative', 'Campaign Manager', 'Director, Engineering', 'Engagement Manager', 'Management', 'Delivery Manager', 'Manager Human Resources', 'Cook', 'Director Of Product Development', 'Information Technology Specialist', 'Chief Of Staff', 'Associate Vice President', 'Company Director', 'Chief Technology Officer (CTO)', 'Digital Marketing Consultant', 'Firefighter', 'Business Operations Manager', 'Crew Member', 'Director - Human Resources', 'Caregiver', 'Customer Experience Manager', 'Financial Accountant', 'Customer Service Rep', 'Bank Teller', 'IT Operations Manager', 'Management Accountant', 'Digital Marketing', 'Investigator', 'Enterprise Account Executive', 'Logistics', 'Deputy General Manager', 'Freelance Designer', 'Economist', 'Digital Marketing Coordinator', 'Co-Founder & COO', 'Chief Architect', 'Learning And Development Manager', 'Director General', 'Distributor', 'Associate Marketing Manager', 'Abogada', 'Assistant General Counsel', 'Machine Operator', 'Delivery Driver', 'Comercial', 'Chemist', 'Hostess', 'Lead Consultant', 'Director Of Training', 'Financial Representative', 'Maintenance', 'Audit Associate', 'Housewife', 'Assistant Accountant', 'Financial Manager', 'Maintenance Engineer', 'Contract Administrator', 'First Officer', 'Director Of Marketing Communications', 'Comptable', 'Finance Officer', 'Financial Planner', 'Automation Engineer', 'Administrativa', 'Estudiante', 'Accounts Manager', 'Customer Service Associate', 'Investment Banking Analyst', 'Director HR'
  ].map(title => ({ value: title, label: title }))

  const managementLevelOptions = [
    { value: 'Entry', label: 'Entry' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'VP', label: 'VP' },
    { value: 'C-Suite', label: 'C-Suite' },
    { value: 'Owner', label: 'Owner' },
    { value: 'Head', label: 'Head' },
    { value: 'Founder', label: 'Founder' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Intern', label: 'Intern' }
  ]

  const departmentOptions = [
    'Accounting', 'Administrative', 'Arts & Design', 'Business Development', 'Consulting', 'Data Science', 'Education', 'Engineering', 'Entrepreneurship', 'Finance', 'Human Resources', 'Information Technology', 'Legal', 'Marketing', 'Media & Communications', 'Operations', 'Product Management', 'Research', 'Sales', 'Support'
  ].map(dept => ({ value: dept, label: dept }))

  const employeeRangeOptions = [
    { value: 'Unknown', label: 'Unknown' },
    { value: '1-10', label: '1-10' },
    { value: '11-20', label: '11-20' },
    { value: '21-50', label: '21-50' },
    { value: '51-100', label: '51-100' },
    { value: '101-200', label: '101-200' },
    { value: '201-500', label: '201-500' },
    { value: '501-1000', label: '501-1000' },
    { value: '1001-2000', label: '1001-2000' },
    { value: '2001-5000', label: '2001-5000' },
    { value: '5001-10000', label: '5001-10000' },
    { value: '10001+', label: '10001+' }
  ]

  // Industry options - sallitut arvot API:sta (täsmälleen sama)
  const industryOptions = [
    'Accounting', 'Agriculture', 'Airlines/Aviation', 'Alternative Dispute Resolution', 'Animation', 'Apparel & Fashion', 'Architecture & Planning', 'Arts & Crafts', 'Automotive', 'Aviation & Aerospace', 'Banking', 'Biotechnology', 'Broadcast Media', 'Building Materials', 'Business Supplies & Equipment', 'Capital Markets', 'Chemicals', 'Civic & Social Organization', 'Civil Engineering', 'Commercial Real Estate', 'Computer & Network Security', 'Computer Games', 'Computer Hardware', 'Computer Networking', 'Computer Software', 'Construction', 'Consumer Electronics', 'Consumer Goods', 'Consumer Services', 'Cosmetics', 'Dairy', 'Defense & Space', 'Design', 'E-Learning', 'Education Management', 'Electrical/Electronic Manufacturing', 'Entertainment', 'Environmental Services', 'Events Services', 'Executive Office', 'Facilities Services', 'Farming', 'Financial Services', 'Fine Art', 'Food & Beverages', 'Food Production', 'Fundraising', 'Furniture', 'Gambling & Casinos', 'Glass, Ceramics & Concrete', 'Government Administration', 'Government Relations', 'Graphic Design', 'Health, Wellness & Fitness', 'Higher Education', 'Hospital & Health Care', 'Hospitality', 'Human Resources', 'Import & Export', 'Individual & Family Services', 'Industrial Automation', 'Information Services', 'Information Technology & Services', 'Insurance', 'International Affairs', 'International Trade & Development', 'Internet', 'Investment Banking', 'Investment Management', 'Judiciary', 'Law Enforcement', 'Law Practice', 'Legal Services', 'Legislative Office', 'Leisure, Travel & Tourism', 'Libraries', 'Logistics & Supply Chain', 'Luxury Goods & Jewelry', 'Machinery', 'Management Consulting', 'Maritime', 'Market Research', 'Marketing & Advertising', 'Mechanical or Industrial Engineering', 'Media Production', 'Medical Devices', 'Medical Practice', 'Mental Health Care', 'Military', 'Mining & Metals', 'Motion Pictures & Film', 'Museums & Institutions', 'Music', 'Nanotechnology', 'Newspapers', 'Non-Profit Organization Management', 'Non-Profits & Non-Profit Services', 'Oil & Energy', 'Online Media', 'Outsourcing/Offshoring', 'Package/Freight Delivery', 'Packaging & Containers', 'Paper & Forest Products', 'Performing Arts', 'Pharmaceuticals', 'Philanthropy', 'Photography', 'Plastics', 'Political Organization', 'Primary/Secondary Education', 'Printing', 'Professional Training & Coaching', 'Program Development', 'Public Policy', 'Public Relations & Communications', 'Public Safety', 'Publishing', 'Railroad Manufacture', 'Ranching', 'Real Estate', 'Recreation & Sports', 'Recreational Facilities & Services', 'Religious Institutions', 'Renewables & Environment', 'Research', 'Restaurants', 'Retail', 'Security & Investigations', 'Semiconductors', 'Shipbuilding', 'Sporting Goods', 'Sports', 'Staffing & Recruiting', 'Supermarkets', 'Telecommunications', 'Textiles', 'Think Tanks', 'Tobacco', 'Translation & Localization', 'Transportation/Trucking/Railroad', 'Utilities', 'Venture Capital & Private Equity', 'Veterinary', 'Warehousing', 'Wholesale', 'Wine & Spirits', 'Wireless', 'Writing & Editing'
  ].map(industry => ({ value: industry, label: industry }))

  // Country options - sallitut arvot API:sta (täsmälleen sama järjestys)
  const countryOptions = [
    'United States', 'India', 'United Kingdom', 'Brazil', 'Canada', 'France', 'Australia', 'Netherlands', 'Italy', 'Spain', 'Germany', 'Mexico', 'China', 'Sweden', 'Nigeria', 'Turkey', 'Argentina', 'United Arab Emirates', 'Belgium', 'Indonesia', 'Philippines', 'Colombia', 'Chile', 'South Africa', 'Switzerland', 'Denmark', 'Singapore', 'Poland', 'Malaysia', 'Norway', 'Saudi Arabia', 'Russia', 'Ireland', 'Pakistan', 'Peru', 'New Zealand', 'Egypt', 'Romania', 'Portugal', 'Israel', 'Finland', 'Czech Republic', 'Hong Kong', 'Japan', 'Venezuela', 'Iran', 'Greece', 'Kenya', 'Ukraine', 'South Korea', 'Austria', 'Thailand', 'Taiwan', 'Bangladesh', 'Morocco', 'Hungary', 'Vietnam', 'Ecuador', 'Qatar', 'Sri Lanka', 'Bulgaria', 'Costa Rica', 'Algeria', 'Serbia', 'Jordan', 'Tunisia', 'Slovakia', 'Lebanon', 'Croatia', 'Ghana', 'Kuwait', 'Uruguay', 'Puerto Rico', 'Dominican Republic', 'Oman', 'Panama', 'Lithuania', 'Uganda', 'Luxembourg', 'Guatemala', 'Tanzania', 'Zimbabwe', 'Kazakhstan', 'Slovenia', 'Bahrain', 'Latvia', 'Trinidad and Tobago', 'Jamaica', 'Iraq', 'Ethiopia', 'Cote d\'Ivoire', 'Cyprus', 'Angola', 'Zambia', 'Nepal', 'Bolivia', 'Azerbaijan', 'Belarus', 'Cambodia', 'Malta', 'El Salvador', 'Estonia', 'Cameroon', 'Botswana', 'Senegal', 'Mauritius', 'Afghanistan', 'Mozambique', 'Albania', 'Honduras', 'Nicaragua', 'Republic of the Union of Myanmar', 'Macedonia (FYROM)', 'Paraguay', 'Namibia', 'Iceland', 'Democratic Republic of the Congo', 'Sudan', 'Papua New Guinea', 'Bosnia and Herzegovina', 'Armenia', 'Syria', 'Moldova', 'Malawi', 'Fiji', 'Rwanda', 'Madagascar', 'Haiti', 'The Bahamas', 'Mongolia', 'Cuba', 'Macau', 'Libya', 'Jersey', 'Reunion', 'Burkina Faso', 'Yemen', 'Barbados', 'Maldives', 'Benin', 'Mali', 'Sierra Leone', 'Congo', 'Gabon', 'Bermuda', 'Uzbekistan', 'Brunei', 'Guadeloupe', 'Cayman Islands', 'Liberia', 'New Caledonia', 'Montenegro', 'Togo', 'Monaco', 'Guam', 'Martinique', 'Kosovo', 'Swaziland', 'Lesotho', 'Guinea', 'Guernsey', 'Suriname', 'Laos', 'Kyrgyzstan', 'Somalia', 'Niger', 'Isle of Man', 'French Polynesia', 'Guyana', 'U.S. Virgin Islands', 'Aruba', 'Gibraltar', 'Belize', 'Bhutan', 'Chad', 'Mauritania', 'Saint Lucia', 'The Gambia', 'Andorra', 'Turkmenistan', 'South Sudan', 'Burundi', 'Cape Verde', 'Seychelles', 'French Guiana', 'Tajikistan', 'Czechia', 'Greenland', 'Antigua and Barbuda', 'Djibouti', 'Liechtenstein', 'Grenada', 'Faroe Islands', 'Equatorial Guinea', 'Central African Republic', 'Timor-Leste', 'Republic of Indonesia', 'Aland Islands', 'Turks and Caicos Islands', 'American Samoa', 'Saint Kitts and Nevis', 'Saint Vincent and the Grenadines', 'Dominica', 'Vanuatu', 'Samoa', 'Solomon Islands', 'Northern Mariana Islands', 'Micronesia', 'San Marino', 'Mayotte', 'Tonga', 'Marshall Islands', 'Anguilla', 'Eritrea', 'Comoros', 'Guinea-Bissau', 'Cook Islands', 'Kiribati', 'Sao Tome and Principe', 'Palau', 'Vatican City', 'Montserrat', 'Georgia', 'Falkland Islands (Islas Malvinas)', 'British Indian Ocean Territory', 'Wallis and Futuna', 'Saint Pierre and Miquelon', 'Tuvalu', 'Christmas Island', 'Nauru', 'Western Sahara', 'Niue', 'French Southern and Antarctic Lands', 'Palestine', 'Svalbard and Jan Mayen', 'Myanmar (Burma)', 'Cocos (Keeling) Islands', 'Pitcairn Islands', 'Tokelau', 'Curacao', 'United States Minor Outlying Islands', 'Sint Maarten', 'Bouvet Island', 'Heard Island and McDonald Islands', 'Saint Martin', 'British Virgin Islands', 'Bonaire, Sint Eustatius and Saba'
  ].map(country => ({ value: country, label: country }))

  // State/Region options - sallitut arvot API:sta
  const stateRegionOptions = [
    'California', 'England', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ontario', 'Massachusetts', 'Ohio', 'Maharashtra', 'Georgia', 'Ile-de-France', 'North Carolina', 'Michigan', 'Sao Paulo', 'Washington', 'Karnataka', 'District of Columbia', 'Colorado', 'Minnesota', 'New South Wales', 'Missouri', 'Virginia', 'Arizona', 'Wisconsin', 'Tennessee', 'Victoria', 'Tamil Nadu', 'Indiana', 'Maryland', 'Delhi', 'Federal Capital Territory', 'State of Sao Paulo', 'Community of Madrid', 'Oregon', 'New Jersey', 'Telangana', 'British Columbia', 'Queensland', 'South Carolina', 'Alberta', 'Scotland', 'Utah', 'Piemonte', 'Flanders', 'Noord-Holland', 'Distrito Federal', 'Alabama', 'Louisiana', 'Connecticut', 'Estado de Mexico', 'Kentucky', 'Stockholm County', 'Quebec', 'Iowa', 'Oklahoma', 'Uttar Pradesh', 'Nevada', 'Capital Region of Denmark', 'Gelderland', 'Gujarat', 'Kansas', 'Lazio', 'Cataluna', 'Western Australia', 'Utrecht', 'West Bengal', 'Haryana', 'Nebraska', 'Zuid-Holland', 'Metro Manila', 'North Brabant', 'Gauteng', 'Arkansas', 'State of Rio de Janeiro', 'Brussel', 'Oslo', 'Shanghai', 'Baden-Wurttemberg', 'Istanbul', 'Mato Grosso', 'Rhone-Alpes', 'Provence-Alpes-Cote d\'Azur', 'Minas Gerais', 'Emilia-Romagna', 'Kerala', 'Berlin', 'Beijing', 'North Rhine-Westphalia', 'Bavaria', 'Veneto', 'Lisboa', 'Masovian Voivodeship', 'Parana', 'Rio Grande do Sul', 'Alsace', 'Idaho', 'Lombardia', 'Mississippi', 'Auckland', 'Rhode Island', 'Wales', 'Overijssel', 'Andhra Pradesh', 'New Mexico', 'Vastra Gotaland County', 'Punjab', 'Catalonia', 'Selangor', 'Maine', 'Lombardy', 'Pays de la Loire', 'Guangdong', 'South Australia', 'South Holland', 'Central Denmark Region', 'Bayern', 'Nord-Pas-de-Calais', 'Groningen', 'Midi-Pyrenees', 'West Java', 'Comunidad de Madrid', 'Aquitaine', 'Rio de Janeiro', 'KwaZulu-Natal', 'Federal Territory of Kuala Lumpur', 'Uusimaa', 'Nordrhein-Westfalen', 'Rajasthan', 'Santa Catarina', 'Noord-Brabant', 'Geneva', 'North Holland', 'Moscow', 'Madhya Pradesh', 'Hessen', 'Andalucia', 'New Hampshire', 'Hlavni mesto Praha', 'Toscana', 'West Virginia', 'Andalusia', 'Hesse', 'Limburg', 'Languedoc-Roussillon', 'Hamburg', 'Manitoba', 'Montana', 'Northern Ireland', 'Calabarzon', 'Walloon Region', 'Delaware', 'State of Minas Gerais', 'Vermont', 'North Dakota', 'Puglia', 'State of Parana', 'Hawaii', 'South Dakota', 'Nova Scotia', 'Flevoland', 'Comunidad Valenciana', 'Skane County', 'Sicilia', 'Alaska', 'Odisha', 'Saskatchewan', 'Para', 'Galicia', 'Australian Capital Territory', 'Vaud', 'Bucharest', 'Lower Saxony', 'Campania', 'Bahia', 'State of Rio Grande do Sul', 'Zulia', 'Guerrero', 'Pernambuco', 'Chihuahua', 'Wellington', 'Viseu', 'Lesser Poland Voivodeship', 'Lorraine', 'Ciudad de Mexico', 'Jiangsu', 'Shanghai Shi', 'Jalisco', 'Chandigarh', 'Rogaland', 'Hordaland', 'Haute-Normandie', 'Grand Casablanca', 'Ankara', 'Puebla', 'New Brunswick', 'State of Bahia', 'Zurich', 'Lower Silesian Voivodeship', 'Goias', 'Valencian Community', 'Wyoming', 'Marche', 'Santiago Metropolitan Region', 'Region de Murcia', 'Brittany', 'Central Visayas', 'Banten', 'Liguria', 'Silesian Voivodeship', 'Poitou-Charentes', 'Canarias', 'Centre', 'Bretagne', 'East Java', 'State of Ceara', 'Saxony', 'Jharkhand', 'State of Pernambuco', 'Uttarakhand', 'Coimbra', 'West Coast', 'Espirito Santo', 'Piedmont', 'Sør-Trøndelag', 'Champagne-Ardenne', 'Bihar', 'Zhejiang', 'Nuevo Leon', 'Ceara', 'Budapest', 'Central Luzon', 'Sardegna', 'Ostergotland County', 'Uppsala County', 'Greater Poland Voivodeship', 'Pomeranian Voivodeship', 'Amazonas', 'Saint Petersburg', 'Veracruz', 'Penang', 'South Moravian Region', 'Brussels', 'Auvergne', 'Central Java', 'Mpumalanga', 'Vienna', 'Caracas Metropolitan District', 'Tasmania', 'Newfoundland and Labrador', 'Schleswig-Holstein', 'Malaga', 'Catalunya', 'Friuli-Venezia Giulia', 'Federal District', 'Assam', 'Bursa', 'Rio Grande do Norte', 'State of Goias', 'Neuchatel', 'Bogota', 'Basque Country', 'Umbria', 'Friesland', 'Johor', 'Region Syddanmark', 'Łodz Voivodeship', 'Chhattisgarh', 'Jawa Barat', 'State of Santa Catarina', 'Mato Grosso do Sul', 'Free State', 'South District', 'Abruzzo', 'mazowieckie', 'Tunis', 'Waikato', 'Ticino', 'Bremen', 'Shandong', 'Rhineland-Palatinate', 'Rabat-Sale-Zemmour-Zaer', 'Principado de Asturias', 'Canton of Bern', 'Franche-Comte', 'Tamaulipas', 'West Bank', 'Limpopo', 'Jonkoping County', 'Goa', 'Pirkanmaa', 'Moscow Oblast', 'Extremadura', 'Halland County', 'Sonora', 'Region Zealand', 'Vlaanderen', 'Burgandy', 'Limousin', 'New Taipei City', 'Maranhao', 'Otago', 'Paraiba', 'Sichuan', 'Vastmanland County', 'Northern Territory', 'Drenthe', 'Michoacan', 'Sergipe', 'Orebro County', 'Vasterbotten County', 'Basel-Stadt', 'Sarawak', 'Sofia City Province', 'Zeeland', 'Moravian-Silesian Region', 'Puducherry', 'Buskerud', 'Cluj County', 'Kanagawa Prefecture', 'Western Cape', 'Liaoning', 'Central Bohemian Region', 'Vasternorrland County', 'State of Espirito Santo', 'Vest-Agder', 'Lower Normandy', 'Fujian', 'North Sumatra', 'Davao Region', 'Gavleborg County', 'Bali', 'Centre-Val de Loire', 'Kocaeli', 'Saarland', 'Normandy', 'Hubei', 'Tuscany', 'North Denmark Region', 'Muscat Governorate', 'Aragon', 'Dalarna County', 'Bay Of Plenty', 'Akershus', 'Tarragona', 'Norrbotten County', 'Bangkok', 'Carabobo', 'Lisbon', 'Western Visayas', 'Alagoas', 'Perak', 'Nord-Pas-de-Calais-Picardie', 'Balearic Islands', 'Tanger-Tetouan', 'Auvergne-Rhone-Alpes', 'Castile and Leon', 'Picardy', 'Varmland County', 'Northern Ostrobothnia', 'Piaui', 'County Dublin', 'Aargau', 'Kuyavian-Pomeranian Voivodeship', 'Timis County', 'Tel Aviv District', 'Center District', 'East Kalimantan', 'Rondonia', 'Northern Mindanao', 'St. Gallen', 'Tianjin', 'Sodermanland County', 'Northern Cape', 'Tokyo', 'Thuringia', 'Kronoberg County', 'West Pomeranian Voivodeship', 'Himachal Pradesh', 'Chiapas', 'Lucerne', 'Podkarpackie Voivodeship', 'Calabria', 'Nordland', 'Gyeonggi-do', 'Kedah', 'Sindh', 'Apulia', 'Telemark', 'Blekinge County', 'Negeri Sembilan', 'Basilicata', 'Autonomous City of Buenos Aires', 'Lublin Voivodeship', 'Burgundy', 'Anzoategui', 'Kalmar County', 'Hedmark', 'Iasi County', 'Castile-La Mancha', 'Ariana', 'Shaanxi', 'Region Metropolitana', 'North District', 'Sabah', 'Wallonie', 'Alicante', 'Marrakesh-Tensift-El Haouz', 'Ben Arous', 'Wojewodztwo małopolskie', 'Troms', 'Oaxaca', 'Lara', 'Castilla y Leon', 'Prince Edward Island', 'Distrito Capital', 'Upper Normandy', 'Bio Bio Region', 'Henan', 'Valparaiso Region', 'Gisborne', 'Adana', 'Malacca', 'Vestfold', 'Valais', 'Sinaloa', 'Ankara Province', 'Mecklenburg-Vorpommern', 'Plzen Region', 'Brasov County', 'Bicol', 'Usti nad Labem Region', 'Pahang', 'Hunan', 'Khyber Pakhtunkhwa', 'Olomouc Region', 'Ilocos Region', 'Guatemala', 'Bern', 'Riau', 'Navarre', 'Cordillera Administrative Region', 'Izmir', 'Antofagasta Region', 'Hebei', 'Brandenburg', 'Zlin Region', 'Canton of Fribourg', 'Tasman', 'Anhui', 'Møre og Romsdal', 'Haifa District', 'Chon Buri', 'Asturias', 'Wojewodztwo dolnoslaskie', 'Alsace-Champagne-Ardenne-Lorraine', 'Chongqing', 'Novosibirsk Oblast', 'Terengganu', 'Liberec Region', 'Jiangsu Sheng', 'Osaka Prefecture', 'Pardubice Region', 'Euskadi', 'Nairobi', 'Canton of Neuchatel', 'Eastern Cape', 'Taichung City', 'Leiria', 'Judea and Samaria District', 'Special Region of Yogyakarta', 'Sachsen', 'Tocantins', 'Eskisehir Province', 'North West', 'Northland', 'Hradec Kralove Region', 'Podlaskie Voivodeship', 'Constanta County', 'Eastern Visayas', 'Canton of Solothurn', 'Souss-Massa-Draa', 'La Rioja', 'Jamtland County', 'Chiba Prefecture', 'Burgos', 'Leon', 'South Bohemian Region', 'Warmian-Masurian Voivodeship', 'Opole Voivodeship', 'Riau Islands', 'Canton of Zug', 'Prahova'
  ].map(state => ({ value: state, label: state }))
  
  // Lead limit
  const [leadLimit, setLeadLimit] = useState(10000)
  
  // Results
  const [leads, setLeads] = useState([])
  const [allLeads, setAllLeads] = useState([]) // Kaikki haetut liidit (ennen filtteröintiä)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)
  
  // Result filters
  const [filterEmail, setFilterEmail] = useState('') // '' = kaikki, 'has' = löytyy, 'missing' = ei löydy
  const [filterPosition, setFilterPosition] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterScoreMin, setFilterScoreMin] = useState('')
  const [filterScoreMax, setFilterScoreMax] = useState('')
  const [filterDate, setFilterDate] = useState('') // Päivämääräsuodatin (YYYY-MM-DD)
  
  // Lead details modal
  const [selectedLead, setSelectedLead] = useState(null)
  const [showLeadModal, setShowLeadModal] = useState(false)
  
  // Selected leads for deletion
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set())
  const [deletingLeads, setDeletingLeads] = useState(false)
  
  // Enrichment credits
  const [creditsMonthly, setCreditsMonthly] = useState(100)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [enrichingLeads, setEnrichingLeads] = useState(false)
  
  // Export modal
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFields, setExportFields] = useState({
    fullName: true,
    firstName: false,
    lastName: false,
    email: true,
    phone: true,
    position: true,
    orgName: true,
    city: true,
    orgCity: false,
    state: false,
    orgState: false,
    country: true,
    orgCountry: false,
    linkedinUrl: true,
    orgWebsite: false,
    orgLinkedinUrl: false,
    orgFoundedYear: false,
    orgIndustry: false,
    orgSize: false,
    orgDescription: false,
    score: true,
    status: true,
    seniority: false,
    functional: false
  })

  const toggleFilter = (key) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // CSV Export funktio
  const exportToCSV = () => {
    try {
      // Hae filtteröidyt liidit (kaikki, ei vain nykyinen sivu)
      const filteredLeads = applyFilters(allLeads)
      
      if (!filteredLeads.length) {
        setError(t('leadScraping.exportErrorNoLeads'))
        setTimeout(() => setError(''), 3000)
        return
      }

      // Valitse valitut kentät
      const selectedFields = Object.entries(exportFields)
        .filter(([_, selected]) => selected)
        .map(([field, _]) => field)

      if (selectedFields.length === 0) {
        setError(t('leadScraping.exportErrorNoFields'))
        setTimeout(() => setError(''), 3000)
        return
      }

      // Määritä kenttien nimet suomeksi
      const fieldLabels = {
        fullName: t('leadScraping.exportFullName'),
        firstName: t('leadScraping.exportFirstName'),
        lastName: t('leadScraping.exportLastName'),
        email: t('leadScraping.exportEmail'),
        phone: t('leadScraping.exportPhone'),
        position: t('leadScraping.exportPosition'),
        orgName: t('leadScraping.exportOrgName'),
        city: t('leadScraping.exportCity'),
        orgCity: t('leadScraping.exportOrgCity'),
        state: t('leadScraping.exportState'),
        orgState: t('leadScraping.exportOrgState'),
        country: t('leadScraping.exportCountry'),
        orgCountry: t('leadScraping.exportOrgCountry'),
        linkedinUrl: t('leadScraping.exportLinkedInUrl'),
        orgWebsite: t('leadScraping.exportOrgWebsite'),
        orgLinkedinUrl: t('leadScraping.exportOrgLinkedInUrl'),
        orgFoundedYear: t('leadScraping.exportOrgFoundedYear'),
        orgIndustry: t('leadScraping.exportOrgIndustry'),
        orgSize: t('leadScraping.exportOrgSize'),
        orgDescription: t('leadScraping.exportOrgDescription'),
        score: t('leadScraping.exportScore'),
        status: t('leadScraping.exportStatus'),
        seniority: t('leadScraping.exportSeniority'),
        functional: t('leadScraping.exportFunctional')
      }

      // Luo CSV headerit
      const headers = selectedFields.map(field => fieldLabels[field] || field)

      // Luo CSV rivit
      const csvRows = filteredLeads.map(lead => {
        return selectedFields.map(field => {
          let value = lead[field] || ''
          
          // Käsittele erityistapaukset
          if (field === 'orgIndustry' && Array.isArray(value)) {
            value = value.join('; ')
          } else if (field === 'orgLinkedinUrl' && Array.isArray(value)) {
            value = value.join('; ')
          } else if (field === 'functional' && Array.isArray(value)) {
            value = value.join('; ')
          } else if (value === null || value === undefined) {
            value = ''
          }
          
          // Escapoi CSV-merkinnät
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      })

      // Yhdistä CSV
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      // Lataa tiedosto
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `liidit_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setShowExportModal(false)
      setSuccess(t('leadScraping.exportSuccess', { count: filteredLeads.length }))
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Export epäonnistui:', error)
      setError(t('leadScraping.exportFailed', { error: error.message }))
      setTimeout(() => setError(''), 5000)
    }
  }

  // Save buyer persona to database
  const saveBuyerPersona = async () => {
    if (!user?.id) {
      setError(t('leadScraping.errors.loginRequired'))
      return
    }

    setSavingPersona(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        throw new Error(t('leadScraping.errors.loginRequired'))
      }

      // Hae käyttäjän public.users.id
      const { data: { user: authUser } } = await supabase.auth.getUser(token)
      if (!authUser) throw new Error(t('leadScraping.errors.userNotFound'))

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single()

      if (!userData) throw new Error(t('leadScraping.errors.profileNotFound'))

      // Päivitä buyer_persona
      const { error: updateError } = await supabase
        .from('users')
        .update({ buyer_persona: buyerPersona || null })
        .eq('id', userData.id)

      if (updateError) throw updateError

      setSuccess(t('leadScraping.buyerPersonaSaveSuccess'))
      setTimeout(() => {
        setSuccess('')
        setShowBuyerPersonaModal(false)
      }, 1500)
    } catch (err) {
      console.error('Error saving buyer persona:', err)
      setError(t('leadScraping.buyerPersonaSaveFailed', { error: err.message || t('leadScraping.errors.unknown') }))
    } finally {
      setSavingPersona(false)
    }
  }

  const generateApifyJson = () => {
    const filters = {
      emailStatus: emailStatus || null,
      onlyWithEmail: onlyWithEmail || false,
      onlyWithPhone: onlyWithPhone || false,
      jobTitlesIncludes: jobTitlesIncludes || [],
      jobTitlesExcludes: jobTitlesExcludes || [],
      includeSimilarTitles: includeSimilarTitles || false,
      additionalTitles: additionalTitles || null,
      managementLevelIncludes: managementLevelIncludes || [],
      managementLevelExcludes: managementLevelExcludes || [],
      departmentsIncludes: departmentsIncludes || [],
      departmentsExcludes: departmentsExcludes || [],
      firstNameIncludes: firstNameIncludes || null,
      firstNameExcludes: firstNameExcludes || null,
      lastNameIncludes: lastNameIncludes || null,
      lastNameExcludes: lastNameExcludes || null,
      employeeRange: employeeRange || [],
      industriesIncludes: industriesIncludes || [],
      industriesExcludes: industriesExcludes || [],
      foundedYearFrom: foundedYearFrom ? parseInt(foundedYearFrom) : null,
      foundedYearTo: foundedYearTo ? parseInt(foundedYearTo) : null,
      companyDomains: companyDomains || null,
      peopleCountryIncludes: peopleCountryIncludes || [],
      peopleCountryExcludes: peopleCountryExcludes || [],
      peopleStateIncludes: peopleStateIncludes || [],
      peopleStateExcludes: peopleStateExcludes || [],
      peopleCityIncludes: peopleCityIncludes || null,
      peopleCityExcludes: peopleCityExcludes || null,
      companyCountryIncludes: companyCountryIncludes || [],
      companyCountryExcludes: companyCountryExcludes || [],
      companyStateIncludes: companyStateIncludes || [],
      companyStateExcludes: companyStateExcludes || [],
      companyCityIncludes: companyCityIncludes || null,
      companyCityExcludes: companyCityExcludes || null
    }
    
    return JSON.stringify(filters, null, 2)
  }

  const handleStartScraping = async () => {
    if (!user?.id) {
      setError(t('leadScraping.errors.loginRequired'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const filters = {
        emailStatus: emailStatus || null,
        onlyWithEmail: onlyWithEmail || false,
        onlyWithPhone: onlyWithPhone || false,
        jobTitlesIncludes: jobTitlesIncludes || [],
        jobTitlesExcludes: jobTitlesExcludes || [],
        includeSimilarTitles: includeSimilarTitles || false,
        additionalTitles: additionalTitles || null,
        managementLevelIncludes: managementLevelIncludes || [],
        managementLevelExcludes: managementLevelExcludes || [],
        departmentsIncludes: departmentsIncludes || [],
        departmentsExcludes: departmentsExcludes || [],
        firstNameIncludes: firstNameIncludes || null,
        firstNameExcludes: firstNameExcludes || null,
        lastNameIncludes: lastNameIncludes || null,
        lastNameExcludes: lastNameExcludes || null,
        employeeRange: employeeRange || [],
        industriesIncludes: industriesIncludes || [],
        industriesExcludes: industriesExcludes || [],
        foundedYearFrom: foundedYearFrom ? parseInt(foundedYearFrom) : null,
        foundedYearTo: foundedYearTo ? parseInt(foundedYearTo) : null,
        companyDomains: companyDomains || null,
        peopleCountryIncludes: peopleCountryIncludes || [],
        peopleCountryExcludes: peopleCountryExcludes || [],
        peopleStateIncludes: peopleStateIncludes || [],
        peopleStateExcludes: peopleStateExcludes || [],
        peopleCityIncludes: peopleCityIncludes || null,
        peopleCityExcludes: peopleCityExcludes || null,
        companyCountryIncludes: companyCountryIncludes || [],
        companyCountryExcludes: companyCountryExcludes || [],
        companyStateIncludes: companyStateIncludes || [],
        companyStateExcludes: companyStateExcludes || [],
        companyCityIncludes: companyCityIncludes || null,
        companyCityExcludes: companyCityExcludes || null
      }

      const apifyJson = generateApifyJson()

      const response = await axios.post('/api/leads/scraping', {
        filters,
        apifyJson,
        leadLimit: Math.min(leadLimit, 50000)
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (response.data.success) {
        setSuccess(t('leadScraping.scrapingStarted'))
      } else {
        throw new Error(response.data.error || t('leadScraping.scrapingFailed'))
      }
      setTimeout(() => setSuccess(''), 5000)
      
      // Lataa liidit heti
      setTimeout(() => {
        fetchLeads()
      }, 2000)

    } catch (err) {
      console.error('Error starting scraping:', err)
      setError(err.response?.data?.error || err.message || t('leadScraping.scrapingFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Filtteröi liidit
  const applyFilters = (leadsToFilter) => {
    return leadsToFilter.filter(lead => {
      // Sähköposti filtteri
      if (filterEmail === 'has' && !lead.email) return false
      if (filterEmail === 'missing' && lead.email) return false
      
      // Tehtävä filtteri
      if (filterPosition && lead.position) {
        const positionLower = lead.position.toLowerCase()
        const filterLower = filterPosition.toLowerCase()
        if (!positionLower.includes(filterLower)) return false
      } else if (filterPosition && !lead.position) {
        return false
      }
      
      // Kaupunki filtteri
      if (filterCity) {
        const city = (lead.city || lead.orgCity || '').toLowerCase()
        const filterLower = filterCity.toLowerCase()
        if (!city.includes(filterLower)) return false
      }
      
      // Pisteet filtteri
      if (filterScoreMin && (lead.score === null || lead.score === undefined || lead.score < parseFloat(filterScoreMin))) {
        return false
      }
      if (filterScoreMax && (lead.score === null || lead.score === undefined || lead.score > parseFloat(filterScoreMax))) {
        return false
      }
      
      // Päivämääräsuodatin (created_at) - näyttää kaikki valitun päivämäärän jälkeen haetut
      if (filterDate) {
        if (!lead.created_at) return false
        
        const leadDate = new Date(lead.created_at)
        const filterDateObj = new Date(filterDate)
        
        // Vertaillaan vain päivämäärää (ei kellonaikaa)
        const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate())
        const filterDateOnly = new Date(filterDateObj.getFullYear(), filterDateObj.getMonth(), filterDateObj.getDate())
        
        // Näytetään kaikki liidit jotka on haettu valitun päivämäärän jälkeen tai samana päivänä
        if (leadDateOnly.getTime() < filterDateOnly.getTime()) {
          return false
        }
      }
      
      return true
    })
  }

  const fetchLeads = async () => {
    if (!user?.id) return

    setLoadingLeads(true)
    setError('')

    try {
      // Hae käyttäjän token
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        throw new Error(t('leadScraping.errors.loginRequired'))
      }

      // Hae liidit API-endpointin kautta (haetaan kaikki, filtteröidään client-side)
      const response = await axios.get('/api/leads', {
        params: {
          page: 1,
          perPage: 10000 // Hae kaikki, filtteröidään client-side
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        const allFetchedLeads = response.data.leads || []
        setAllLeads(allFetchedLeads)
        
        // Filtteröi liidit
        const filteredLeads = applyFilters(allFetchedLeads)
        
        // Paginoidaan filtteröidyt tulokset
        const startIndex = (currentPage - 1) * resultsPerPage
        const endIndex = startIndex + resultsPerPage
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex)
        
        setLeads(paginatedLeads)
        setTotalLeads(filteredLeads.length)
      } else {
        throw new Error(response.data.error || t('leadScraping.fetchLeadsFailed', { error: '' }))
      }

    } catch (err) {
      console.error('Error fetching leads:', err)
      setError(t('leadScraping.fetchLeadsFailed', { error: err.response?.data?.error || err.message }))
    } finally {
      setLoadingLeads(false)
    }
  }

  // Poista valitut liidit
  const deleteSelectedLeads = async () => {
    if (selectedLeadIds.size === 0) return

    if (!confirm(t('leadScraping.confirmDelete', { count: selectedLeadIds.size }))) {
      return
    }

    setDeletingLeads(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        throw new Error(t('leadScraping.errors.loginRequired'))
      }

      const response = await axios.delete('/api/leads', {
        data: {
          leadIds: Array.from(selectedLeadIds)
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setSuccess(t('leadScraping.deletedLeads', { count: response.data.deletedCount }))
        setTimeout(() => setSuccess(''), 5000)

        // Tyhjennä valinnat
        setSelectedLeadIds(new Set())

        // Päivitä liidit
        await fetchLeads()
      } else {
        throw new Error(response.data.error || t('leadScraping.deleteFailed'))
      }
    } catch (err) {
      console.error('Error deleting leads:', err)
      setError(t('leadScraping.deleteLeadsFailed', { error: err.response?.data?.error || err.message }))
    } finally {
      setDeletingLeads(false)
    }
  }

  // Toggle yksittäisen rivin valinta
  const toggleLeadSelection = (leadId) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  // Valitse kaikki nykyisen sivun rivit
  const toggleSelectAll = () => {
    const allCurrentPageIds = new Set(leads.map(lead => lead.id))
    const allSelected = leads.every(lead => selectedLeadIds.has(lead.id))
    
    if (allSelected) {
      // Poista kaikki nykyisen sivun valinnat
      setSelectedLeadIds(prev => {
        const newSet = new Set(prev)
        allCurrentPageIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Lisää kaikki nykyisen sivun rivit
      setSelectedLeadIds(prev => {
        const newSet = new Set(prev)
        allCurrentPageIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Load buyer persona from database
  useEffect(() => {
    const loadBuyerPersona = async () => {
      if (!user?.id) return
      
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        
        if (!token) return

        const { data: userData, error } = await supabase
          .from('users')
          .select('buyer_persona')
          .eq('auth_user_id', user.id)
          .single()

        if (!error && userData?.buyer_persona) {
          setBuyerPersona(userData.buyer_persona)
        }
      } catch (err) {
        console.error('Error loading buyer persona:', err)
      }
    }

    loadBuyerPersona()
  }, [user?.id])

  // Resetoi sivu kun filtterit muuttuvat
  useEffect(() => {
    if (allLeads.length > 0 && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filterEmail, filterPosition, filterCity, filterScoreMin, filterScoreMax, filterDate])

  // Filtteröi ja paginoi liidit kun filtterit, sivu tai resultsPerPage muuttuu
  useEffect(() => {
    if (allLeads.length > 0) {
      const filteredLeads = applyFilters(allLeads)
      const startIndex = (currentPage - 1) * resultsPerPage
      const endIndex = startIndex + resultsPerPage
      const paginatedLeads = filteredLeads.slice(startIndex, endIndex)
      
      setLeads(paginatedLeads)
      setTotalLeads(filteredLeads.length)
    }
  }, [allLeads, filterEmail, filterPosition, filterCity, filterScoreMin, filterScoreMax, filterDate, currentPage, resultsPerPage])

  // Hae krediitit
  const fetchCredits = async () => {
    if (!user?.id || !organization?.id) return

    setLoadingCredits(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        return
      }

      // Hae krediitit organisaation users-rivistä (organisaation ID)
      const { data: orgData, error } = await supabase
        .from('users')
        .select('enrichment_credits_monthly, enrichment_credits_used')
        .eq('id', organization.id)
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
        // Jatketaan oletusarvoilla
        return
      }

      if (orgData) {
        setCreditsMonthly(orgData.enrichment_credits_monthly ?? 100)
        setCreditsUsed(orgData.enrichment_credits_used ?? 0)
      }
    } catch (err) {
      console.error('Error fetching credits:', err)
      // Jatketaan oletusarvoilla
    } finally {
      setLoadingCredits(false)
    }
  }

  // Rikasta valitut liidit
  const enrichSelectedLeads = async () => {
    if (selectedLeadIds.size === 0) return

    const creditsNeeded = selectedLeadIds.size
    const creditsRemaining = creditsMonthly - creditsUsed

    if (creditsRemaining < creditsNeeded) {
      setError(t('leadScraping.notEnoughCredits', { needed: creditsNeeded, remaining: creditsRemaining }))
      setTimeout(() => setError(''), 5000)
      return
    }

    if (!confirm(t('leadScraping.confirmEnrich', { count: selectedLeadIds.size, credits: creditsNeeded, creditsPerLead: 1 }))) {
      return
    }

    setEnrichingLeads(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        throw new Error(t('leadScraping.errors.loginRequired'))
      }

      const response = await axios.post('/api/leads?action=enrich', {
        leadIds: Array.from(selectedLeadIds)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setSuccess(t('leadScraping.enrichmentStarted', { count: response.data.leads_enriched }))
        setTimeout(() => setSuccess(''), 5000)

        // Päivitä krediitit
        if (response.data.credits_remaining !== undefined) {
          setCreditsUsed(response.data.credits_used)
          setCreditsMonthly(response.data.credits_monthly)
        }

        // Tyhjennä valinnat
        setSelectedLeadIds(new Set())

        // Päivitä liidit
        await fetchLeads()
      } else {
        throw new Error(response.data.error || t('leadScraping.enrichmentFailed'))
      }
    } catch (err) {
      console.error('Error enriching leads:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || t('leadScraping.enrichmentFailed')
      setError(errorMessage)
      setTimeout(() => setError(''), 5000)
    } finally {
      setEnrichingLeads(false)
    }
  }

  // Hae liidit kun käyttäjä muuttuu (ei tarvitse organisaatiota, backend hoitaa sen)
  useEffect(() => {
    if (user?.id) {
      fetchLeads()
    }
  }, [user?.id])

  // Hae krediitit kun organisaatio on saatavilla
  useEffect(() => {
    if (user?.id && organization?.id) {
      fetchCredits()
    }
  }, [user?.id, organization?.id])


  const totalPages = Math.ceil(totalLeads / resultsPerPage)

  // Count active filters for each group
  const getFilterCount = (group) => {
    switch(group) {
      case 'contact':
        let contactCount = 0
        if (emailStatus) contactCount++
        if (onlyWithEmail) contactCount++
        if (onlyWithPhone) contactCount++
        return contactCount
      case 'jobTitle':
        let jobTitleCount = 0
        if (jobTitlesIncludes.length > 0) jobTitleCount++
        if (jobTitlesExcludes.length > 0) jobTitleCount++
        if (includeSimilarTitles) jobTitleCount++
        if (additionalTitles) jobTitleCount++
        return jobTitleCount
      case 'management':
        let managementCount = 0
        if (managementLevelIncludes.length > 0) managementCount++
        if (managementLevelExcludes.length > 0) managementCount++
        return managementCount
      case 'departments':
        let departmentsCount = 0
        if (departmentsIncludes.length > 0) departmentsCount++
        if (departmentsExcludes.length > 0) departmentsCount++
        return departmentsCount
      case 'names':
        let namesCount = 0
        if (firstNameIncludes) namesCount++
        if (firstNameExcludes) namesCount++
        if (lastNameIncludes) namesCount++
        if (lastNameExcludes) namesCount++
        return namesCount
      case 'company':
        let companyCount = 0
        if (employeeRange.length > 0) companyCount++
        if (industriesIncludes.length > 0) companyCount++
        if (industriesExcludes.length > 0) companyCount++
        if (foundedYearFrom) companyCount++
        if (foundedYearTo) companyCount++
        if (companyDomains) companyCount++
        return companyCount
      case 'peopleLocation':
        let peopleLocationCount = 0
        if (peopleCountryIncludes.length > 0) peopleLocationCount++
        if (peopleCountryExcludes.length > 0) peopleLocationCount++
        if (peopleStateIncludes.length > 0) peopleLocationCount++
        if (peopleStateExcludes.length > 0) peopleLocationCount++
        if (peopleCityIncludes) peopleLocationCount++
        if (peopleCityExcludes) peopleLocationCount++
        return peopleLocationCount
      case 'companyLocation':
        let companyLocationCount = 0
        if (companyCountryIncludes.length > 0) companyLocationCount++
        if (companyCountryExcludes.length > 0) companyLocationCount++
        if (companyStateIncludes.length > 0) companyLocationCount++
        if (companyStateExcludes.length > 0) companyLocationCount++
        if (companyCityIncludes) companyLocationCount++
        if (companyCityExcludes) companyLocationCount++
        return companyLocationCount
      default:
        return 0
    }
  }

  return (
    <div className="lead-scraping-page">
      <div className="lead-scraping-header">
        <h1>{t('leadScraping.pageTitle')}</h1>
        <p>
          {t('leadScraping.pageDescription')}{' '}
          <a 
            href="/help#lead-scraping"
            onClick={(e) => {
              e.preventDefault()
              navigate('/help#lead-scraping')
            }}
            className="text-blue-500 underline cursor-pointer"
          >
            {t('leadScraping.readMore')}
          </a>
        </p>
      </div>

      {error && (
        <div className="lead-scraping-error leads-msg-margin">
          {error}
        </div>
      )}

      {success && (
        <div className="lead-scraping-success leads-msg-margin">
          {success}
        </div>
      )}

      <div className="lead-scraping-content-wrapper">
        {/* Filters Sidebar */}
        <div className="lead-scraping-filters">
          <div className="filters-actions">
            <div className="filters-actions-buttons">
              <Button 
                variant="secondary"
                onClick={() => setShowBuyerPersonaModal(true)}
                className="leads-w-full"
              >
                {buyerPersona ? t('leadScraping.buyerPersonaSaved') : t('leadScraping.buyerPersona')}
              </Button>
            </div>
          </div>

          <div className="filters-content">
            {/* Contact Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('contact')}
            type="button"
          >
            <span>{t('leadScraping.contactFilters')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('contact') > 0 && (
                <span className="filter-count-badge">{getFilterCount('contact')}</span>
              )}
              <span className={`chevron ${openFilters.contact ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.contact && (
            <div className="filter-group-content">
              <div className="form-field">
                <label>{t('leadScraping.emailStatus')}</label>
                <select value={emailStatus} onChange={(e) => setEmailStatus(e.target.value)}>
                  <option value="">{t('leadScraping.emailStatusAll')}</option>
                  <option value="verified">{t('leadScraping.emailStatusVerified')}</option>
                  <option value="unverified">{t('leadScraping.emailStatusUnverified')}</option>
                </select>
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyWithEmail}
                    onChange={(e) => setOnlyWithEmail(e.target.checked)}
                  />
                  {t('leadScraping.hasEmail')}
                </label>
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyWithPhone}
                    onChange={(e) => setOnlyWithPhone(e.target.checked)}
                  />
                  {t('leadScraping.hasPhone')}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Company Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('company')}
            type="button"
          >
            <span>{t('leadScraping.companyFilters')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('company') > 0 && (
                <span className="filter-count-badge">{getFilterCount('company')}</span>
              )}
              <span className={`chevron ${openFilters.company ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.company && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.employeeRangeLabel')}
                  options={employeeRangeOptions}
                  value={employeeRange}
                  onChange={setEmployeeRange}
                  placeholder={t('leadScraping.employeeRangePlaceholder')}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.industryIncludesLabel')}
                  options={industryOptions}
                  value={industriesIncludes}
                  onChange={setIndustriesIncludes}
                  placeholder={t('leadScraping.industryIncludesPlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.industryExcludesLabel')}
                  options={industryOptions}
                  value={industriesExcludes}
                  onChange={setIndustriesExcludes}
                  placeholder={t('leadScraping.industryExcludesPlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field-row">
                <div className="form-field">
                  <label>{t('leadScraping.foundedFromLabel')}</label>
                  <input
                    type="number"
                    value={foundedYearFrom}
                    onChange={(e) => setFoundedYearFrom(e.target.value)}
                    placeholder={t('leadScraping.foundedFromPlaceholder')}
                  />
                </div>
                <div className="form-field">
                  <label>{t('leadScraping.foundedToLabel')}</label>
                  <input
                    type="number"
                    value={foundedYearTo}
                    onChange={(e) => setFoundedYearTo(e.target.value)}
                    placeholder={t('leadScraping.foundedToPlaceholder')}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>{t('leadScraping.companyDomainsLabel')}</label>
                <input
                  type="text"
                  value={companyDomains}
                  onChange={(e) => setCompanyDomains(e.target.value)}
                  placeholder={t('leadScraping.companyDomainsPlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* People Location Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('peopleLocation')}
            type="button"
          >
            <span>{t('leadScraping.peopleLocationFilters')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('peopleLocation') > 0 && (
                <span className="filter-count-badge">{getFilterCount('peopleLocation')}</span>
              )}
              <span className={`chevron ${openFilters.peopleLocation ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.peopleLocation && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.peopleCountryIncludes')}
                  options={countryOptions}
                  value={peopleCountryIncludes}
                  onChange={setPeopleCountryIncludes}
                  placeholder={t('leadScrapingFields.countriesIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.peopleCountryExcludes')}
                  options={countryOptions}
                  value={peopleCountryExcludes}
                  onChange={setPeopleCountryExcludes}
                  placeholder={t('leadScrapingFields.countriesExcludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.peopleStateIncludes')}
                  options={stateRegionOptions}
                  value={peopleStateIncludes}
                  onChange={setPeopleStateIncludes}
                  placeholder={t('leadScrapingFields.statesIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.peopleStateExcludes')}
                  options={stateRegionOptions}
                  value={peopleStateExcludes}
                  onChange={setPeopleStateExcludes}
                  placeholder={t('leadScrapingFields.statesExcludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.peopleCityIncludes')}</label>
                <input
                  type="text"
                  value={peopleCityIncludes}
                  onChange={(e) => setPeopleCityIncludes(e.target.value)}
                  placeholder={t('leadScrapingFields.citiesIncludePlaceholder')}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.peopleCityExcludes')}</label>
                <input
                  type="text"
                  value={peopleCityExcludes}
                  onChange={(e) => setPeopleCityExcludes(e.target.value)}
                  placeholder={t('leadScrapingFields.citiesExcludePlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Company Location Filters */}
        <div className="filter-group">
          <button 
            className="filter-group-header"
            onClick={() => toggleFilter('companyLocation')}
            type="button"
          >
            <span>{t('leadScraping.companyLocationFilters')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('companyLocation') > 0 && (
                <span className="filter-count-badge">{getFilterCount('companyLocation')}</span>
              )}
              <span className={`chevron ${openFilters.companyLocation ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.companyLocation && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.companyCountryIncludes')}
                  options={countryOptions}
                  value={companyCountryIncludes}
                  onChange={setCompanyCountryIncludes}
                  placeholder={t('leadScrapingFields.countriesIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.companyCountryExcludes')}
                  options={countryOptions}
                  value={companyCountryExcludes}
                  onChange={setCompanyCountryExcludes}
                  placeholder={t('leadScrapingFields.countriesExcludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.companyStateIncludes')}
                  options={stateRegionOptions}
                  value={companyStateIncludes}
                  onChange={setCompanyStateIncludes}
                  placeholder={t('leadScrapingFields.statesIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.companyStateExcludes')}
                  options={stateRegionOptions}
                  value={companyStateExcludes}
                  onChange={setCompanyStateExcludes}
                  placeholder={t('leadScrapingFields.statesExcludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.companyCityIncludes')}</label>
                <input
                  type="text"
                  value={companyCityIncludes}
                  onChange={(e) => setCompanyCityIncludes(e.target.value)}
                  placeholder={t('leadScrapingFields.citiesIncludePlaceholder')}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.companyCityExcludes')}</label>
                <input
                  type="text"
                  value={companyCityExcludes}
                  onChange={(e) => setCompanyCityExcludes(e.target.value)}
                  placeholder={t('leadScrapingFields.citiesExcludePlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Job Title Filters */}
        <div className="filter-group">
          <button
            className="filter-group-header"
            onClick={() => toggleFilter('jobTitle')}
            type="button"
          >
            <span>{t('leadScraping.jobTitleFiltersLabel')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('jobTitle') > 0 && (
                <span className="filter-count-badge">{getFilterCount('jobTitle')}</span>
              )}
              <span className={`chevron ${openFilters.jobTitle ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.jobTitle && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.jobTitleIncludes')}
                  options={jobTitleOptions}
                  value={jobTitlesIncludes}
                  onChange={setJobTitlesIncludes}
                  placeholder={t('leadScrapingFields.jobTitlesIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={includeSimilarTitles}
                    onChange={(e) => setIncludeSimilarTitles(e.target.checked)}
                  />
                  {t('leadScraping.labels.includeSimilarTitles')}
                </label>
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.jobTitleExcludes')}
                  options={jobTitleOptions}
                  value={jobTitlesExcludes}
                  onChange={setJobTitlesExcludes}
                  placeholder={t('leadScrapingFields.jobTitlesExcludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.additionalTitles')}</label>
                <input
                  type="text"
                  value={additionalTitles}
                  onChange={(e) => setAdditionalTitles(e.target.value)}
                  placeholder={t('leadScrapingFields.additionalTitlesPlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Management Level Filters */}
        <div className="filter-group">
          <button
            className="filter-group-header"
            onClick={() => toggleFilter('management')}
            type="button"
          >
            <span>{t('leadScraping.managementLevelFiltersLabel')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('management') > 0 && (
                <span className="filter-count-badge">{getFilterCount('management')}</span>
              )}
              <span className={`chevron ${openFilters.management ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.management && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.managementLevelIncludes')}
                  options={managementLevelOptions}
                  value={managementLevelIncludes}
                  onChange={setManagementLevelIncludes}
                  placeholder={t('leadScrapingFields.managementLevelIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.managementLevelExcludes')}
                  options={managementLevelOptions}
                  value={managementLevelExcludes}
                  onChange={setManagementLevelExcludes}
                  placeholder={t('leadScrapingFields.managementLevelExcludePlaceholder')}
                  searchable={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Departments & Job Function Filters */}
        <div className="filter-group">
          <button
            className="filter-group-header"
            onClick={() => toggleFilter('departments')}
            type="button"
          >
            <span>{t('leadScraping.departmentsFiltersLabel')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('departments') > 0 && (
                <span className="filter-count-badge">{getFilterCount('departments')}</span>
              )}
              <span className={`chevron ${openFilters.departments ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.departments && (
            <div className="filter-group-content">
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.departmentsIncludes')}
                  options={departmentOptions}
                  value={departmentsIncludes}
                  onChange={setDepartmentsIncludes}
                  placeholder={t('leadScrapingFields.departmentsIncludePlaceholder')}
                  searchable={true}
                />
              </div>
              <div className="form-field">
                <MultiSelect
                  label={t('leadScraping.labels.departmentsExcludes')}
                  options={departmentOptions}
                  value={departmentsExcludes}
                  onChange={setDepartmentsExcludes}
                  placeholder={t('leadScrapingFields.departmentsExcludePlaceholder')}
                  searchable={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Name Filters */}
        <div className="filter-group">
          <button
            className="filter-group-header"
            onClick={() => toggleFilter('names')}
            type="button"
          >
            <span>{t('leadScraping.nameFilters')}</span>
            <span className="leads-flex-icon-gap">
              {getFilterCount('names') > 0 && (
                <span className="filter-count-badge">{getFilterCount('names')}</span>
              )}
              <span className={`chevron ${openFilters.names ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.names && (
            <div className="filter-group-content">
              <div className="form-field">
                <label>{t('leadScraping.labels.firstNameIncludes')}</label>
                <input
                  type="text"
                  value={firstNameIncludes}
                  onChange={(e) => setFirstNameIncludes(e.target.value)}
                  placeholder={t('leadScrapingFields.firstNamesIncludePlaceholder')}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.firstNameExcludes')}</label>
                <input
                  type="text"
                  value={firstNameExcludes}
                  onChange={(e) => setFirstNameExcludes(e.target.value)}
                  placeholder={t('leadScrapingFields.firstNamesExcludePlaceholder')}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.lastNameIncludes')}</label>
                <input
                  type="text"
                  value={lastNameIncludes}
                  onChange={(e) => setLastNameIncludes(e.target.value)}
                  placeholder={t('leadScrapingFields.lastNamesIncludePlaceholder')}
                />
              </div>
              <div className="form-field">
                <label>{t('leadScraping.labels.lastNameExcludes')}</label>
                <input
                  type="text"
                  value={lastNameExcludes}
                  onChange={(e) => setLastNameExcludes(e.target.value)}
                  placeholder={t('leadScrapingFields.lastNamesExcludePlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lead Limit */}
        <div className="filter-group">
          <button
            className="filter-group-header"
            onClick={() => toggleFilter('leadLimit')}
            type="button"
          >
            <span>{t('leadScraping.leadLimitLabel')}</span>
            <span className="leads-flex-icon-gap">
              <span className={`chevron ${openFilters.leadLimit ? 'open' : ''}`}>▾</span>
            </span>
          </button>
          {openFilters.leadLimit && (
            <div className="filter-group-content">
              <div className="form-field">
                <label htmlFor="lead-limit">{t('leadScraping.leadLimitLabel')}</label>
                <input
                  id="lead-limit"
                  type="number"
                  min="1"
                  max="50000"
                  value={leadLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setLeadLimit(Math.min(Math.max(value, 1), 50000))
                  }}
                  placeholder={t('leadScrapingFields.leadLimitPlaceholder')}
                />
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="filters-actions leads-filters-footer">
          <div className="filters-actions-buttons">
            <Button onClick={() => {
              setEmailStatus('')
              setOnlyWithEmail(false)
              setOnlyWithPhone(false)
              setJobTitlesIncludes([])
              setJobTitlesExcludes([])
              setIncludeSimilarTitles(false)
              setAdditionalTitles('')
              setManagementLevelIncludes([])
              setManagementLevelExcludes([])
              setDepartmentsIncludes([])
              setDepartmentsExcludes([])
              setFirstNameIncludes('')
              setFirstNameExcludes('')
              setLastNameIncludes('')
              setLastNameExcludes('')
              setEmployeeRange([])
              setIndustriesIncludes([])
              setIndustriesExcludes([])
              setFoundedYearFrom('')
              setFoundedYearTo('')
              setCompanyDomains('')
              setPeopleCountryIncludes([])
              setPeopleCountryExcludes([])
              setPeopleStateIncludes([])
              setPeopleStateExcludes([])
              setPeopleCityIncludes('')
              setPeopleCityExcludes('')
              setCompanyCountryIncludes([])
              setCompanyCountryExcludes([])
              setCompanyStateIncludes([])
              setCompanyStateExcludes([])
              setCompanyCityIncludes('')
              setCompanyCityExcludes('')
              setLeadLimit(10000)
            }}>
              {t('leadScraping.buttons.resetFilters')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleStartScraping}
              disabled={loading}
            >
              {loading ? t('leadScraping.buttons.starting') : t('leadScraping.buttons.start')}
            </Button>
          </div>
        </div>
        </div>

        {/* Results Section */}
        <div className="lead-scraping-results">
        <div className="results-header">
          <div className="leads-header-row">
            <div className="leads-info-col">
              <h2>{t('leadScraping.collectedLeads')}</h2>
              {!loadingCredits && (
                <div className="leads-meta-row">
                  <span>{t('leadScraping.creditsRemaining', { remaining: creditsMonthly - creditsUsed, total: creditsMonthly })}</span>
                  <span className="leads-separator">•</span>
                  <span>{t('leadScraping.creditCharge')}</span>
                </div>
              )}
            </div>
            <div className="results-controls">
              {selectedLeadIds.size > 0 && (
                <>
                  <Button 
                    variant="primary" 
                    onClick={enrichSelectedLeads}
                    disabled={enrichingLeads || (creditsMonthly - creditsUsed < selectedLeadIds.size)}
                    className="leads-btn-success"
                  >
                    {enrichingLeads ? t('leadScraping.enriching') : t('leadScraping.enrichSelected', { count: selectedLeadIds.size })}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={deleteSelectedLeads}
                    disabled={deletingLeads}
                    className="leads-btn-danger"
                  >
                    {deletingLeads ? t('leadScraping.deleting') : t('leadScraping.deleteSelected', { count: selectedLeadIds.size })}
                  </Button>
                </>
              )}
              <select 
                value={resultsPerPage} 
                onChange={(e) => {
                  setResultsPerPage(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value="10">{t('leadScraping.resultsPerPage', { count: 10 })}</option>
                <option value="20">{t('leadScraping.resultsPerPage', { count: 20 })}</option>
                <option value="50">{t('leadScraping.resultsPerPage', { count: 50 })}</option>
                <option value="100">{t('leadScraping.resultsPerPage', { count: 100 })}</option>
              </select>
              <Button variant="secondary" onClick={() => {
                fetchLeads()
                fetchCredits()
              }} disabled={loadingLeads || loadingCredits}>
                {loadingLeads || loadingCredits ? t('common.loading') : t('leadScraping.refresh')}
              </Button>
              <Button variant="secondary" onClick={() => setShowExportModal(true)}>
                {t('leadScraping.export')}
              </Button>
            </div>
          </div>
          <div className="results-filters">
            <div className="result-filter-group">
              <label htmlFor="filter-email">{t('leadScraping.filterEmail')}</label>
              <select
                id="filter-email"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="leads-filter-input leads-w-full cursor-pointer"
              >
                <option value="">{t('leadScraping.filterEmailAll')}</option>
                <option value="has">{t('leadScraping.filterEmailHas')}</option>
                <option value="missing">{t('leadScraping.filterEmailMissing')}</option>
              </select>
            </div>
            <div className="result-filter-group">
              <label htmlFor="filter-position">{t('leadScraping.filterPosition')}</label>
              <input
                id="filter-position"
                type="text"
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                placeholder={t('leadScrapingFields.searchPositionPlaceholder')}
                className="leads-filter-input leads-w-full"
              />
            </div>
            <div className="result-filter-group">
              <label htmlFor="filter-city">{t('leadScraping.filterCity')}</label>
              <input
                id="filter-city"
                type="text"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder={t('leadScrapingFields.searchCityPlaceholder')}
                className="leads-filter-input leads-w-full"
              />
            </div>
            <div className="result-filter-group">
              <label htmlFor="filter-score-min">{t('leadScraping.filterScore')}</label>
              <div className="leads-score-row">
                <input
                  id="filter-score-min"
                  type="number"
                  value={filterScoreMin}
                  onChange={(e) => setFilterScoreMin(e.target.value)}
                  placeholder={t('leadScrapingFields.minPlaceholder')}
                  className="leads-filter-input w-20"
                />
                <span className="text-gray-500 text-sm">-</span>
                <input
                  id="filter-score-max"
                  type="number"
                  value={filterScoreMax}
                  onChange={(e) => setFilterScoreMax(e.target.value)}
                  placeholder={t('leadScrapingFields.maxPlaceholder')}
                  className="leads-filter-input w-20"
                />
              </div>
            </div>
            <div className="result-filter-group">
              <label htmlFor="filter-date">{t('leadScraping.filterDate')}</label>
              <input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="leads-filter-input leads-w-full"
              />
            </div>
            {(filterEmail || filterPosition || filterCity || filterScoreMin || filterScoreMax || filterDate) && (
              <div className="result-filter-group flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilterEmail('')
                    setFilterPosition('')
                    setFilterCity('')
                    setFilterScoreMin('')
                    setFilterScoreMax('')
                    setFilterDate('')
                  }}
                  className="self-end mt-6"
                >
                  {t('leadScraping.clearFilters')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {loadingLeads ? (
          <div className="loading-state">{t('leadScraping.loadingLeads')}</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            {t('leadScraping.noLeads')}
          </div>
        ) : (
          <>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={leads.length > 0 && leads.every(lead => selectedLeadIds.has(lead.id))}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                        title={t('leadScraping.selectAll')}
                      />
                    </th>
                    <th>{t('leadScraping.tableName')}</th>
                    <th>{t('leadScraping.tableEmail')}</th>
                    <th>{t('leadScraping.tablePosition')}</th>
                    <th>{t('leadScraping.tableCompany')}</th>
                    <th>{t('leadScraping.tableCity')}</th>
                    <th>{t('leadScraping.tableCountry')}</th>
                    <th>{t('leadScraping.tableLinkedIn')}</th>
                    <th>{t('leadScraping.tableScore')}</th>
                    <th>{t('leadScraping.tableSummary')}</th>
                    <th>{t('leadScraping.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td>{lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '-'}</td>
                      <td>{lead.email || '-'}</td>
                      <td>{lead.position || '-'}</td>
                      <td>{lead.orgName || '-'}</td>
                      <td>{lead.city || lead.orgCity || '-'}</td>
                      <td>{lead.country || lead.orgCountry || '-'}</td>
                      <td>
                        {lead.linkedinUrl ? (
                          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        ) : '-'}
                      </td>
                      <td>{lead.score !== null && lead.score !== undefined ? lead.score : '-'}</td>
                      <td>{lead.score_criteria || lead.scoreCriteria || '-'}</td>
                      <td>
                        <button
                          className="view-details-btn"
                          onClick={() => {
                            setSelectedLead(lead)
                            setShowLeadModal(true)
                          }}
                          title={t('leadScraping.showAllDetails')}
                        >
                          {t('leadScraping.showDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  {t('leadScraping.previous')}
                </button>
                <span>
                  {t('leadScraping.page', { current: currentPage, total: totalPages, count: totalLeads })}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('leadScraping.next')}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExportModal(false)
            }
          }}
        >
          <div
            className="modal-container export-modal max-w-[800px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{t('leadScraping.exportModalTitle')}</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content px-8 py-6">
              <div className="export-info">
                <p className="mb-2 text-gray-700 text-sm font-medium">
                  {t('leadScraping.exportSelectFields')}
                </p>
                <p className="text-gray-500 text-[13px]" dangerouslySetInnerHTML={{ __html: t('leadScraping.exportLeadsCount', { count: applyFilters(allLeads).length }).replace('<strong>', '<strong>').replace('</strong>', '</strong>') }} />
              </div>
              
              <div className="export-fields-container">
                {/* Henkilön tiedot */}
                <div className="export-field-group">
                  <div className="export-field-group-header">
                    <h3 className="export-field-group-title">{t('leadScraping.exportPersonFields')}</h3>
                    <button
                      type="button"
                      className="export-select-all-btn"
                      onClick={() => {
                        const personFields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'position', 'seniority', 'functional']
                        const allSelected = personFields.every(field => exportFields[field])
                        setExportFields(prev => {
                          const updated = { ...prev }
                          personFields.forEach(field => {
                            updated[field] = !allSelected
                          })
                          return updated
                        })
                      }}
                    >
                      {['fullName', 'firstName', 'lastName', 'email', 'phone', 'position', 'seniority', 'functional'].every(field => exportFields[field]) ? t('leadScraping.deselectAllFields') : t('leadScraping.selectAllFields')}
                    </button>
                  </div>
                  <div className="export-fields-grid">
                    {[
                      { key: 'fullName', label: t('leadScraping.exportFullName') },
                      { key: 'firstName', label: t('leadScraping.exportFirstName') },
                      { key: 'lastName', label: t('leadScraping.exportLastName') },
                      { key: 'email', label: t('leadScraping.exportEmail') },
                      { key: 'phone', label: t('leadScraping.exportPhone') },
                      { key: 'position', label: t('leadScraping.exportPosition') },
                      { key: 'seniority', label: t('leadScraping.exportSeniority') },
                      { key: 'functional', label: t('leadScraping.exportFunctional') }
                    ].map(field => (
                      <label key={field.key} className="export-field-checkbox">
                        <input
                          type="checkbox"
                          checked={exportFields[field.key]}
                          onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Sijainti */}
                <div className="export-field-group">
                  <div className="export-field-group-header">
                    <h3 className="export-field-group-title">{t('leadScraping.exportLocationFields')}</h3>
                    <button
                      type="button"
                      className="export-select-all-btn"
                      onClick={() => {
                        const locationFields = ['city', 'state', 'country']
                        const allSelected = locationFields.every(field => exportFields[field])
                        setExportFields(prev => {
                          const updated = { ...prev }
                          locationFields.forEach(field => {
                            updated[field] = !allSelected
                          })
                          return updated
                        })
                      }}
                    >
                      {['city', 'state', 'country'].every(field => exportFields[field]) ? t('leadScraping.deselectAllFields') : t('leadScraping.selectAllFields')}
                    </button>
                  </div>
                  <div className="export-fields-grid">
                    {[
                      { key: 'city', label: t('leadScraping.exportCity') },
                      { key: 'state', label: t('leadScraping.exportState') },
                      { key: 'country', label: t('leadScraping.exportCountry') }
                    ].map(field => (
                      <label key={field.key} className="export-field-checkbox">
                        <input
                          type="checkbox"
                          checked={exportFields[field.key]}
                          onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Yrityksen tiedot */}
                <div className="export-field-group">
                  <div className="export-field-group-header">
                    <h3 className="export-field-group-title">{t('leadScraping.exportCompanyFields')}</h3>
                    <button
                      type="button"
                      className="export-select-all-btn"
                      onClick={() => {
                        const orgFields = ['orgName', 'orgCity', 'orgState', 'orgCountry', 'orgWebsite', 'orgLinkedinUrl', 'orgFoundedYear', 'orgIndustry', 'orgSize', 'orgDescription']
                        const allSelected = orgFields.every(field => exportFields[field])
                        setExportFields(prev => {
                          const updated = { ...prev }
                          orgFields.forEach(field => {
                            updated[field] = !allSelected
                          })
                          return updated
                        })
                      }}
                    >
                      {['orgName', 'orgCity', 'orgState', 'orgCountry', 'orgWebsite', 'orgLinkedinUrl', 'orgFoundedYear', 'orgIndustry', 'orgSize', 'orgDescription'].every(field => exportFields[field]) ? t('leadScraping.deselectAllFields') : t('leadScraping.selectAllFields')}
                    </button>
                  </div>
                  <div className="export-fields-grid">
                    {[
                      { key: 'orgName', label: t('leadScraping.exportOrgName') },
                      { key: 'orgCity', label: t('leadScraping.exportOrgCity') },
                      { key: 'orgState', label: t('leadScraping.exportOrgState') },
                      { key: 'orgCountry', label: t('leadScraping.exportOrgCountry') },
                      { key: 'orgWebsite', label: t('leadScraping.exportOrgWebsite') },
                      { key: 'orgLinkedinUrl', label: t('leadScraping.exportOrgLinkedInUrl') },
                      { key: 'orgFoundedYear', label: t('leadScraping.exportOrgFoundedYear') },
                      { key: 'orgIndustry', label: t('leadScraping.exportOrgIndustry') },
                      { key: 'orgSize', label: t('leadScraping.exportOrgSize') },
                      { key: 'orgDescription', label: t('leadScraping.exportOrgDescription') }
                    ].map(field => (
                      <label key={field.key} className="export-field-checkbox">
                        <input
                          type="checkbox"
                          checked={exportFields[field.key]}
                          onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Muut */}
                <div className="export-field-group">
                  <div className="export-field-group-header">
                    <h3 className="export-field-group-title">{t('leadScraping.exportOtherFields')}</h3>
                    <button
                      type="button"
                      className="export-select-all-btn"
                      onClick={() => {
                        const otherFields = ['linkedinUrl', 'score', 'status']
                        const allSelected = otherFields.every(field => exportFields[field])
                        setExportFields(prev => {
                          const updated = { ...prev }
                          otherFields.forEach(field => {
                            updated[field] = !allSelected
                          })
                          return updated
                        })
                      }}
                    >
                      {['linkedinUrl', 'score', 'status'].every(field => exportFields[field]) ? t('leadScraping.deselectAllFields') : t('leadScraping.selectAllFields')}
                    </button>
                  </div>
                  <div className="export-fields-grid">
                    {[
                      { key: 'linkedinUrl', label: t('leadScraping.exportLinkedInUrl') },
                      { key: 'score', label: t('leadScraping.exportScore') },
                      { key: 'status', label: t('leadScraping.exportStatus') }
                    ].map(field => (
                      <label key={field.key} className="export-field-checkbox">
                        <input
                          type="checkbox"
                          checked={exportFields[field.key]}
                          onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
              <Button 
                variant="secondary"
                onClick={() => setShowExportModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={exportToCSV}
              >
                {t('leadScraping.exportButton')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Buyer Persona Modal */}
      {showBuyerPersonaModal && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBuyerPersonaModal(false)
            }
          }}
        >
          <div
            className="modal-container max-w-[700px] w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{t('leadScraping.buyerPersonaModalTitle')}</h2>
              <button
                onClick={() => setShowBuyerPersonaModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content px-8 py-6">
              <div className="form-field mb-6">
                <label htmlFor="buyer-persona-textarea" className="block mb-2 text-sm font-medium text-gray-700">
                  {t('leadScraping.buyerPersonaLabel')}
                </label>
                <textarea
                  id="buyer-persona-textarea"
                  value={buyerPersona}
                  onChange={(e) => setBuyerPersona(e.target.value)}
                  placeholder={t('leadScrapingFields.buyerPersonaPlaceholder')}
                  rows={8}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all bg-white text-gray-800 w-full resize-y font-inherit leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">
                  {t('leadScraping.buyerPersonaDescription')}
                </p>
              </div>
            </div>
            <div className="modal-footer px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowBuyerPersonaModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                onClick={saveBuyerPersona}
                disabled={savingPersona}
              >
                {savingPersona ? t('ui.buttons.saving') : t('ui.buttons.save')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeadModal(false)
              setSelectedLead(null)
            }
          }}
        >
          <div className="lead-details-modal modal-container">
            <div className="modal-header">
              <h2 className="modal-title">{t('leadScraping.leadDetailsModalTitle')}</h2>
              <button
                onClick={() => {
                  setShowLeadModal(false)
                  setSelectedLead(null)
                }}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content lead-details-content">
              {/* Henkilön tiedot */}
              <div className="lead-details-section">
                <h3>{t('leadScraping.leadDetailsPersonInfo')}</h3>
                <div className="lead-details-grid">
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsFirstName')}</label>
                    <span>{selectedLead.firstName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsLastName')}</label>
                    <span>{selectedLead.lastName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsFullName')}</label>
                    <span>{selectedLead.fullName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsEmail')}</label>
                    <span>{selectedLead.email || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsPhone')}</label>
                    <span>{selectedLead.phone || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsPosition')}</label>
                    <span>{selectedLead.position || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsSeniority')}</label>
                    <span>{selectedLead.seniority || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsFunctional')}</label>
                    <span>
                      {Array.isArray(selectedLead.functional) 
                        ? selectedLead.functional.join(', ') 
                        : selectedLead.functional || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsLinkedIn')}</label>
                    <span>
                      {selectedLead.linkedinUrl ? (
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          {selectedLead.linkedinUrl}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsCity')}</label>
                    <span>{selectedLead.city || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsState')}</label>
                    <span>{selectedLead.state || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsCountry')}</label>
                    <span>{selectedLead.country || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Organisaation tiedot */}
              <div className="lead-details-section">
                <h3>{t('leadScraping.leadDetailsCompanyInfo')}</h3>
                <div className="lead-details-grid">
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsCompanyName')}</label>
                    <span>{selectedLead.orgName || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsWebsite')}</label>
                    <span>
                      {selectedLead.orgWebsite ? (
                        <a href={selectedLead.orgWebsite} target="_blank" rel="noopener noreferrer">
                          {selectedLead.orgWebsite}
                        </a>
                      ) : '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsOrgLinkedInUrl')}</label>
                    <span>
                      {Array.isArray(selectedLead.orgLinkedinUrl) && selectedLead.orgLinkedinUrl.length > 0
                        ? selectedLead.orgLinkedinUrl.map((url, idx) => (
                            <span key={idx}>
                              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                              {idx < selectedLead.orgLinkedinUrl.length - 1 && ', '}
                            </span>
                          ))
                        : selectedLead.orgLinkedinUrl || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsFounded')}</label>
                    <span>{selectedLead.orgFoundedYear || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsIndustry')}</label>
                    <span>
                      {Array.isArray(selectedLead.orgIndustry) 
                        ? selectedLead.orgIndustry.join(', ') 
                        : selectedLead.orgIndustry || '-'}
                    </span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsSize')}</label>
                    <span>{selectedLead.orgSize || '-'}</span>
                  </div>
                  <div className="lead-detail-item lead-detail-item--full">
                    <label>{t('leadScraping.leadDetailsDescription')}</label>
                    <span>{selectedLead.orgDescription || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsOrgCity')}</label>
                    <span>{selectedLead.orgCity || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsOrgState')}</label>
                    <span>{selectedLead.orgState || '-'}</span>
                  </div>
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsOrgCountry')}</label>
                    <span>{selectedLead.orgCountry || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Muut tiedot */}
              <div className="lead-details-section">
                <h3>{t('leadScraping.leadDetailsOtherInfo')}</h3>
                <div className="lead-details-grid">
                  <div className="lead-detail-item">
                    <label>{t('leadScraping.leadDetailsCreatedDate')}</label>
                    <span>
                      {selectedLead.created_at 
                        ? new Date(selectedLead.created_at).toLocaleDateString('fi-FI', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'}
                    </span>
                  </div>
                  {selectedLead.score !== null && selectedLead.score !== undefined && (
                    <div className="lead-detail-item">
                      <label>{t('leadScraping.leadDetailsScore')}</label>
                      <span>{selectedLead.score}</span>
                    </div>
                  )}
                  {(selectedLead.score_criteria || selectedLead.scoreCriteria) && (
                    <div className="lead-detail-item lead-detail-item--full">
                      <label>{t('leadScraping.leadDetailsSummary')}</label>
                      <span>{selectedLead.score_criteria || selectedLead.scoreCriteria || '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button onClick={() => {
                setShowLeadModal(false)
                setSelectedLead(null)
              }}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

