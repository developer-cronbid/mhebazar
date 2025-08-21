// training/page.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle, Shield, Wrench, Zap, Flame, HardHat, Building, User, AlertTriangle, Grid3X3, List, ChevronDown } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';
import api from '@/lib/api';
import Breadcrumb from "@/components/elements/Breadcrumb";


// TrainingRegistrationForm Component
interface TrainingRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  trainingName: string;
}

const TrainingRegistrationForm: React.FC<TrainingRegistrationFormProps> = ({ isOpen, onClose, trainingName }) => {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !companyName || !phone || !email) {
      toast.error('Please fill in all required fields (Full Name, Company Name, Phone, Email).');
      return;
    }

    setIsSubmitting(true);

    const formData = {
      training_name: trainingName,
      full_name: fullName,
      company_name: companyName,
      phone,
      email,
      message,
    };

    try {
      const response = await api.post('/training-registrations/', formData);
      console.log('Form Data Submitted:', response.data);
      toast.success(`Registration for "${trainingName}" submitted successfully!`);

      setFullName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting training form:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessage = 'Failed to submit registration. Please check your input.';
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(' ');
        }
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
     
      <div className="bg-white w-full max-w-md mx-auto p-6 md:p-8 relative rounded-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Register for {trainingName}</h3>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-[#5CA131] hover:bg-[#4a8c28] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Accordion Component for the new sections
interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children }) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <button
        className="flex justify-between items-center w-full p-8 text-left focus:outline-none"
        onClick={onClick}
      >
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        <ChevronDown className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-8 pt-0">{children}</div>
      </div>
    </div>
  );
};

const TrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrainingName, setSelectedTrainingName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('Featured');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleRegisterClick = (trainingName: string) => {
    setSelectedTrainingName(trainingName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrainingName('');
  };

  const handleAccordionClick = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title);
  };

  const categories = [
    'Operator Training',
    'Workplace Safety Training',
    'Industrial Training',
  ];

  const trainingPrograms = [
    {
      id: 1,
      title: 'Confined Space Entry',
      description: 'Comprehensive training for safe entry and work in confined spaces, covering hazard identification and emergency procedures.',
      image: '/training/1.jpg',
      icon: <HardHat className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 2,
      title: 'Working at Height',
      description: 'Learn proper safety protocols for working at elevated positions, including fall protection systems and equipment inspection.',
      image: '/training/8.jpg',
      icon: <Zap className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 3,
      title: 'Hand Tool Safety',
      description: 'Training on proper use, maintenance, and safety procedures for various hand tools in industrial environments.',
      image: '/training/7.jpg',
      icon: <Flame className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 4,
      title: 'Chemical Safety',
      description: 'Understanding chemical hazards, proper handling procedures, and emergency response for hazardous materials.',
      image: '/training/6.jpg',
      icon: <Shield className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 5,
      title: 'Construction Safety',
      description: 'Essential safety training for construction sites, covering equipment operation, hazard recognition, and OSHA standards.',
      image: '/training/3.jpg',
      icon: <Wrench className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 6,
      title: 'Electrical Safety',
      description: 'Training on electrical hazards, lockout/tagout procedures, and safe work practices around electrical equipment.',
      image: '/training/4.jpg',
      icon: <AlertTriangle className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 7,
      title: 'Fire Safety',
      description: 'Learn fire prevention techniques, proper use of fire extinguishers, and emergency evacuation procedures.',
      image: '/training/5.jpg',
      icon: <Building className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
    {
      id: 8,
      title: 'Infection Control',
      description: 'Training on controlling infections in workplace settings, including proper sanitation and protective measures.',
      image: '/training/2.jpg',
      icon: <User className="w-6 h-6" />,
      category: 'Workplace Safety Training',
    },
  ];

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredPrograms = selectedCategories.length === 0
    ? trainingPrograms
    : trainingPrograms.filter(program => selectedCategories.includes(program.category));

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    switch (sortBy) {
      case 'Name':
        return a.title.localeCompare(b.title);
      case 'Name-Desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const operatorFeatures = [
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Comprehensive safety training' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Experienced trainers' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Customized programs' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Flexible delivery' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Cost-effective solutions' },
  ];

  const workplaceSafetyFeatures = [
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Customized safety training' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Experienced trainers' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Practical approach' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Convenient online delivery' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Comprehensive coverage' },
  ];

  const industrialFeatures = [
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Practical industry experience' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Comprehensive training program' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Real-world scenarios' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Develop technical skills' },
    { icon: <CheckCircle className="w-5 h-5" />, text: 'Become competent professionals' },
  ];

  return (
    <div className="min-h-screen bg-white">
       <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Training', href: '/training' }
              ]} />
      <Toaster position="top-right" richColors />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Categories</h3>

              <div className="space-y-3">
                {categories.map((category, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#5CA131] border-gray-300 rounded focus:ring-[#5CA131] focus:ring-2"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryFilter(category)}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {category}
                    </span>
                  </label>
                ))}
              </div>

              {/* Sidebar Image */}
              <div className="mt-8">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src="/sidebar.png"
                    alt="Training Equipment"
                    width={288}
                    height={384}
                    layout="responsive"
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-4 bg-gray-50">
                    <div className="text-orange-500 text-sm font-medium mb-1">The Right Choice</div>
                    <h4 className="text-gray-900 font-bold">FORKLIFT SERVICE</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header Section */}
            <div className="p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Training Programs</h1>
                  <p className="text-gray-600 text-sm">Showing {sortedPrograms.length} results</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5CA131] focus:border-transparent"
                    >
                      <option value="Featured">Sort by</option>
                      <option value="Name">Name A-Z</option>
                      <option value="Name-Desc">Name Z-A</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Programs Grid/List */}
            <div className={`grid gap-6 mb-12 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {sortedPrograms.map((program) => (
                <div
                  key={program.id}
                  className={`bg-white rounded-xl border hover:shadow-md transition-all duration-300 overflow-hidden group ${
                    viewMode === 'list' ? 'flex' : 'flex flex-col'
                  } shadow-sm`}
                >
                  <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}>
                    <div className="aspect-video overflow-hidden">
                      <Image
                        src={program.image}
                        alt={program.title}
                        width={300}
                        height={200}
                        className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                          viewMode === 'list' ? 'h-32' : 'h-48'
                        }`}
                      />
                    </div>
                    <div className="absolute top-3 left-3 bg-white rounded-full p-2 shadow">
                      <div className="text-[#5CA131]">
                        {program.icon}
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : 'flex-1 flex flex-col'}`}>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#5CA131] transition-colors">
                        {program.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {program.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleRegisterClick(program.title)}
                        className="bg-[#5CA131] hover:bg-[#4a8c28] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow hover:shadow-md"
                      >
                        Register Now!
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* About Attachments Section */}
            <div className="p-8 mb-12 ">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About Our Training Programs</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                At MHEBazar, we understand that different industries require specialized training approaches. That's why we offer a comprehensive range of training programs designed to make your workplace safer and more efficient. We are committed to providing high-quality training at affordable prices. Whether you need safety certifications, equipment operation training, or specialized industrial skills, we have the right program for your needs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Training Areas</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Safety Compliance & Certification</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Equipment Operation Training</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Hazard Identification</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Emergency Response Procedures</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialized Programs</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Industry-Specific Training Solutions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>OSHA Compliance Training</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Advanced Technical Skills Development</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#5CA131] mr-2">•</span>
                      <span>Customized On-Site Training</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-6">
              <AccordionItem
                title="Operator Training"
                isOpen={openAccordion === 'Operator Training'}
                onClick={() => handleAccordionClick('Operator Training')}
              >
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Forklifts and other material handling equipment (MHE) play an integral role across industries, from manufacturing to warehousing. Operating these machines requires proper training to ensure workplace safety. Our comprehensive courses improve safety while developing essential operational skills.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {operatorFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="text-[#5CA131] mt-0.5">{feature.icon}</div>
                          <span className="text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <p className="text-gray-600 leading-relaxed mb-6">
                        Our programs balance classroom instruction with practical training. Participants learn to recognize hazards, avoid risks, and respond appropriately in emergencies. Courses cover equipment operation, hazard identification, and safety protocols.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        All training is conducted by certified instructors with extensive field experience, ensuring practical, real-world knowledge transfer.
                      </p>
                    </div>
                  </div>
                  <div className="lg:w-1/3">
                    <div className="relative h-full rounded-xl overflow-hidden">
                      <Image
                        src="/training/operator-training.webp"
                        alt="Forklift Training"
                        width={400}
                        height={600}
                        className="w-full h-full object-cover rounded-xl shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                title="Workplace Safety Training"
                isOpen={openAccordion === 'Workplace Safety Training'}
                onClick={() => handleAccordionClick('Workplace Safety Training')}
              >
                <div className="flex flex-col lg:flex-row-reverse gap-12">
                  <div className="lg:w-2/3">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Reducing workplace accidents requires comprehensive safety training. Our programs ensure employees recognize environmental hazards and know how to protect themselves. We customize training to address industry-specific risks.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {workplaceSafetyFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="text-[#5CA131] mt-0.5">{feature.icon}</div>
                          <span className="text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <p className="text-gray-600 leading-relaxed mb-6">
                        Our training covers machinery operation, hazardous materials handling, fire safety, and emergency response. Experienced professionals deliver practical, hands-on training preparing employees for real-world hazards.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        Flexible online options allow employees to complete training at their convenience, without disrupting work schedules.
                      </p>
                    </div>
                  </div>
                  <div className="lg:w-1/3">
                    <div className="relative h-full rounded-xl overflow-hidden">
                      <Image
                        src="/training/workplace-safety-training.webp"
                        alt="Workplace Safety Training"
                        width={400}
                        height={600}
                        className="w-full h-full object-cover rounded-xl shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                title="Industrial Training"
                isOpen={openAccordion === 'Industrial Training'}
                onClick={() => handleAccordionClick('Industrial Training')}
              >
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Our industrial training programs help individuals advance their careers through practical, industry-focused education. We tailor programs to specific professional requirements, balancing theory with hands-on experience.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {industrialFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="text-[#5CA131] mt-0.5">{feature.icon}</div>
                          <span className="text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <p className="text-gray-600 leading-relaxed mb-6">
                        Participants develop technical skills through real-world scenarios, preparing them to become competent professionals. Our trainers bring extensive industry experience and stay current with the latest best practices.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        Online delivery provides flexibility, allowing participants to access training anytime while balancing work commitments.
                      </p>
                    </div>
                  </div>
                  <div className="lg:w-1/3">
                    <div className="relative h-full rounded-xl overflow-hidden">
                      <Image
                        src="/training/industrial-training.webp"
                        alt="Industrial Training"
                        width={400}
                        height={600}
                        className="w-full h-full object-cover rounded-xl shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <TrainingRegistrationForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        trainingName={selectedTrainingName}
      />
    </div>
  );
};

export default TrainingPage;