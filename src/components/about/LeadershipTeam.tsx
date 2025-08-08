'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  linkedin?: string;
}

// NOTE: The teamMembers array data is left untouched as per your instruction.
// The UI will use this data and render it according to the image.
const teamMembers: TeamMember[] = [
  {
    name: 'Ms. Radhika Kundra',
    role: 'Advisor',
    description:
      '4+ Years of Experience in Material Handling Equipment (MHE) & Business Operations Dynamic professional with over 4 years of proven experience in the Material Handling Equipment (MHE) industry, specializing in business development, client relationship management, and operational handling. Skilled in driving growth, managing B2B customer portfolios, and delivering tailored solutions in the industrial equipment domain. Her expertise in operations ensures smooth and efficient execution of projects. She is a dedicated and results-oriented professional who consistently exceeds expectations.',
    image: '/about/advisor3.png',
    linkedin: 'https://www.linkedin.com/in/radhika-kundra-834526143/',
  },
  {
    name: 'Ms. Asmita Ulhas Makeshwar',
    role: 'Advisor',
    description:
      '9+ Years of Business Handling Experience | 4+ Years in Material Handling Equipment (MHE)Seasoned professional with over 9 years of experience in business operations, client management, and strategic growth, including 4+ years of specialized expertise in the Material Handling Equipment (MHE) industry. Proven ability to drive sales, manage end-to-end business processes, and deliver value-driven solutions across B2B markets. Her leadership and strategic thinking have been pivotal in expanding our market presence and building strong client relationships. She is known for her exceptional problem-solving skills and her commitment to delivering outstanding results.',
    image: '/about/advisor4.png',
    linkedin: 'https://www.linkedin.com/in/asmita-makeshwar-5a139b36a/',
  },
  {
    name: 'Mr. Ulhas Makeshwar',
    role: 'Advisor',
    description:
      'One of our esteemed Advisor at MHE Bazar. With a BE in mechanical engineering and advanced degrees in business management and marketing, Mr. Makeshwar brings a wealth of knowledge and expertise to the team. His strategic vision and deep understanding of the market are instrumental in shaping our company\'s direction and ensuring our long-term success. He is a driving force behind our innovative approaches and a mentor to our leadership. His extensive experience allows us to navigate complex challenges with confidence.',
    image: '/about/advisor1.png',
    linkedin: 'https://www.linkedin.com/in/ulhas-makeshwar-77b0a450/',
  },
  {
    name: 'Mr. Manik Thapar',
    role: 'Advisor',
    description:
      'One of our valued Advisor at MHE Bazar. Mr. Thapar brings a unique blend of technical expertise and business acumen to our team, with a BE in Mechanical and Automotive Engineering and an MBA in Marketing. His dual qualifications provide a holistic perspective, enabling him to bridge the gap between technical product development and market-driven strategies. He is known for his analytical skills and his ability to identify new opportunities, making him a key contributor to our strategic planning and business growth. His insights are invaluable.',
    image: '/about/advisor2.png',
    linkedin: 'https://www.linkedin.com/in/manik-thapar-23201771/',
  },
];

const customPositions = ['50% 40%', '50% 0%', '50% 25%', '50% 25%'];
const DESCRIPTION_LIMIT = 150;

export default function LeadershipTeam() {
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleExpanded = (index: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <section className="w-full bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-left">
          Leadership Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => {
            const isExpanded = !!expandedCards[index];
            const isLongContent = member.description.length > DESCRIPTION_LIMIT;
            const descriptionToShow =
              isLongContent && !isExpanded
                ? `${member.description.substring(0, DESCRIPTION_LIMIT)}...`
                : member.description;

            return (
              <div
                key={member.name}
                className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="relative bg-gray-100 p-6 flex justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: customPositions[index],
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col flex-grow p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mb-3">{member.role}</p>
                  <div className="text-xs text-gray-600 leading-relaxed mb-4 flex-grow text-left">
                    {descriptionToShow}
                  </div>
                  {isLongContent && (
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="text-blue-600 hover:underline text-xs font-medium mt-auto mb-2"
                    >
                      {isExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                  {member.linkedin && (
                    <div className="flex justify-center mt-2">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Image
                          src="/linkedin.png"
                          alt="LinkedIn Profile"
                          width={20}
                          height={20}
                          className="h-5 w-5"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}