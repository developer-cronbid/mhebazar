// training/page.tsx
'use client'; // This directive is necessary for client-side components in Next.js 13+

import React, { useState } from 'react';
import { CheckCircle, Shield, Wrench, Zap, Flame, HardHat, Building, User, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner'; // Import Toaster and toast from sonner
import api from '@/lib/api'; // Import the axios instance

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

    // Basic validation
    if (!fullName || !companyName || !phone || !email) {
      toast.error('Please fill in all required fields (Full Name, Company Name, Phone, Email).');
      return;
    }

    setIsSubmitting(true);

    const formData = {
      training_name: trainingName, // Match backend field name
      full_name: fullName,       // Match backend field name
      company_name: companyName, // Match backend field name
      phone,
      email,
      message,
    };

    try {
      const response = await api.post('/training-registrations/', formData);
      console.log('Form Data Submitted:', response.data);
      toast.success(`Registration for "${trainingName}" submitted successfully!`);

      // Reset form fields
      setFullName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setMessage('');
      onClose(); // Close the dialog after submission
    } catch (error: any) {
      console.error('Error submitting training form:', error);
      if (error.response && error.response.data) {
        // Display specific error messages from the backend
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto p-6 md:p-8 relative">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Register for {trainingName}</h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5CA131] focus:border-[#5CA131] sm:text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5CA131] focus:border-[#5CA131] sm:text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5CA131] focus:border-[#5CA131] sm:text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5CA131] focus:border-[#5CA131] sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              id="message"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5CA131] focus:border-[#5CA131] sm:text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-[#5CA131] hover:bg-[#4a8c28] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

const TrainingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrainingName, setSelectedTrainingName] = useState('');

  const handleRegisterClick = (trainingName: string) => {
    setSelectedTrainingName(trainingName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrainingName('');
  };

  const trainingPrograms = [
    {
      id: 1,
      title: 'Construction Safety',
      description: 'Construction is one of the areas of employment where hazardous conditions are part of the everyday working...',
      image: '/training/3.jpg',
      icon: <HardHat className="w-6 h-6" />,
    },
    {
      id: 2,
      title: 'Electrical Safety',
      description: 'The majority of us use electricity every day on the job and this familiarity can create a false sense of security. Let us...',
      image: '/training/4.jpg',
      icon: <Zap className="w-6 h-6" />,
    },
    {
      id: 3,
      title: 'Fire Safety',
      description: 'Fire safety training educates a set of practices & procedures to minimize the destruction caused by fire hazards.',
      image: '/training/5.jpg',
      icon: <Flame className="w-6 h-6" />,
    },
    {
      id: 4,
      title: 'Chemical Safety',
      description: 'Disaster in a chemical industry is very rare, but negligence could result in devastating consequences.',
      image: '/training/6.jpg',
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: 5,
      title: 'Hand Tool Safety',
      description: 'Use of tools makes many tasks easier. However, the same tools that assist us, if improperly used or maintained, can...',
      image: '/training/7.jpg',
      icon: <Wrench className="w-6 h-6" />,
    },
    {
      id: 6,
      title: 'Working at Height',
      description: 'From use of simple stepladders to safety harnesses, there is an imminent risk of a fall which may cause personal injury whil...',
      image: '/training/8.jpg',
      icon: <Building className="w-6 h-6" />,
    },
    {
      id: 7,
      title: 'Confined Space Entry',
      description: 'It is critically important that the people involved in making confined space entries are qualified and experienced an...',
      image: '/training/1.jpg',
      icon: <AlertTriangle className="w-6 h-6" />,
    },
    {
      id: 8,
      title: 'Controlling Infections in Workplace & COVID 19 Precautions',
      description: 'With the wild spread of the pandemic COVID-19, safety has now reached the pinnacle of priority for every individual.',
      image: '/training/2.jpg',
      icon: <User className="w-6 h-6" />,
    },
  ];

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
      <Toaster position="top-right" richColors /> {/* Sonner Toaster component */}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Material Handling Equipment Training
            </h1>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The MHE Bazar is an online platform that specializes in forklift operator training and other industrial training.
              It provides a comprehensive range of courses and certifications for those who want to pursue a career in the industrial sector.
              The MHE Bazar has experienced trainers who use the latest technology and techniques to provide quality training to their students.
              Their courses are designed to equip students with the knowledge and skills necessary for success in the industrial sector.
            </p>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed mt-4">
              The MHE Bazar also provides additional resources, such as job placement services, so that students can easily find employment
              after completing their course. With its comprehensive range of courses, The MHE Bazar is an ideal choice for those who want to
              specialize in forklift operator training or any other industrial training.
            </p>
          </div>
        </div>
      </div>

      {/* Training Programs Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Register for our training programs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainingPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <div className="aspect-w-16 aspect-h-12 relative">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md">
                    <div className="text-[#5CA131]">
                      {program.icon}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow"> {/* Use flex-grow here */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed flex-grow"> {/* And here */}
                    {program.description}
                  </p>
                  <button
                    onClick={() => handleRegisterClick(program.title)}
                    className="mt-auto w-full bg-[#5CA131] hover:bg-[#4a8c28] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    Register Now
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operator Training Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Operator Training</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Forklifts and other material handling equipment (MHE) play an integral role in a variety of industries,
                from manufacturing and logistics to construction and warehousing. However, operating these heavy machines
                requires proper training to ensure safety in the workplace. Forklift operators have a lot of responsibilities
                and are exposed to hazardous working conditions, making training in safety skills essential. MHE Bazar is a
                renowned training partner for Forklift Operators from across India, providing comprehensive training courses
                to improve the overall health and safety of their clients.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operatorFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-[#5CA131]">{feature.icon}</div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="/training/operator-training.webp"
                alt="Forklift Training"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>

          <div className="mt-12">
            <p className="text-gray-600 leading-relaxed mb-6">
              MHE Bazar is committed to providing the best quality education to their clients about health issues related to
              operating Forklifts and other MHEs. The training courses offered by MHE Bazar cover a range of topics, including
              how to operate forklifts effectively, avoid hazards, and identify risks associated with operating MHEs. The training
              programs are designed to be hands-on and interactive, ensuring that participants learn the practical skills required
              to operate these machines safely.
            </p>

            <p className="text-gray-600 leading-relaxed">
              One of the primary goals of MHE Bazar is to improve the safety of workers who operate Forklifts and other MHEs.
              This is achieved through a combination of classroom instruction and practical training. The trainers at MHE Bazar
              are experienced professionals who have a deep understanding of the hazards associated with operating MHEs. They use
              their expertise to teach participants how to recognize and avoid these hazards, as well as how to respond appropriately
              in case of an emergency.
            </p>
          </div>
        </div>
      </div>

      {/* Workplace Safety Training Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Workplace Safety Training</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/training/workplace-safety-training.webp"
                alt="Workplace Safety Training"
                className="rounded-lg shadow-lg w-full"
              />
            </div>

            <div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Workplace safety is a critical concern for employers across all industries. To reduce the risk of accidents
                and injuries in the workplace, employers need to provide their employees with safety training. Safety training
                ensures that employees are aware of the potential hazards in their work environment and know how to protect
                themselves from harm. MHEBazar is a leading provider of workplace safety training, offering comprehensive
                training programs that cover a range of topics related to workplace safety.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {workplaceSafetyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-[#5CA131]">{feature.icon}</div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-gray-600 leading-relaxed mb-6">
              MHEBazar recognizes the importance of workplace safety and provides customized training programs that are tailored
              to meet the specific needs of their clients. They understand that different industries and work environments have
              unique hazards and risks, and their training programs are designed to address these specific risks. MHEBazar&apos;s
              training programs cover a wide range of topics, including the safe operation of machinery, the handling of hazardous
              materials, fire safety, and emergency response.
            </p>

            <p className="text-gray-600 leading-relaxed mb-6">
              MHEBazar&apos;s workplace safety training is delivered by experienced professional trainers who have a deep understanding
              of workplace hazards and risks. They use their expertise to provide practical and hands-on training that prepares
              employees to deal with potential hazards in their work environment. MHEBazar&apos;s trainers also provide guidance on
              how to identify potential hazards and how to take appropriate action to prevent accidents and injuries.
            </p>

            <p className="text-gray-600 leading-relaxed">
              One of the significant advantages of MHEBazar&apos;s workplace safety training is that it is available online. The online
              training programs are accessible to employees at their convenience, eliminating the need for them to attend traditional
              classroom training sessions. This flexibility allows employees to complete the training at their own pace, without
              having to take time off from their busy schedules and ensures that they can access the training they need to advance
              their careers.
            </p>
          </div>
        </div>
      </div>

      {/* Industrial Training Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Industrial Training</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-600 leading-relaxed mb-6">
                At MHEBazar, we take pride in our commitment to providing top-quality industrial training that helps individuals
                advance their careers and achieve their professional goals. We understand that industrial training is a crucial
                step in the career development journey, which is why we offer a comprehensive training program that is tailored
                to the specific needs and requirements of our clients.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {industrialFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-[#5CA131]">{feature.icon}</div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="/training/industrial-training.webp"
                alt="Industrial Training"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>

          <div className="mt-12">
            <p className="text-gray-600 leading-relaxed mb-6">
              Our industrial training program is designed to provide participants with a managed and practical training experience
              that is delivered within a specific time frame. This allows participants to gain the necessary knowledge and experience
              to become successful professionals in their chosen field. Our program is structured in a way that provides a perfect
              balance between theory and practical training, enabling participants to develop their technical skills and knowledge
              while also gaining hands-on experience in their chosen field.
            </p>

            <p className="text-gray-600 leading-relaxed mb-6">
              Our trainers are experienced professionals who have a deep understanding of the industry and the skills and knowledge
              required to succeed. They bring a wealth of real-world experience to the training sessions, allowing participants to
              learn from their expertise and gain valuable insights into the industry. We believe that learning from experienced
              professionals is the key to success, which is why we invest heavily in our trainers to ensure that they are up-to-date
              with the latest industry trends and best practices.
            </p>

            <p className="text-gray-600 leading-relaxed">
              Our industrial training program is delivered in a convenient online format that allows participants to access the
              training from anywhere, at any time. This makes it easier for individuals to fit the training into their busy schedules
              and ensures that they can access the training they need to advance their careers.
            </p>
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
