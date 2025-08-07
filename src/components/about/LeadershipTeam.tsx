'use client';

import { useState } from 'react';
import Image from 'next/image';

// Define a TypeScript interface for the team member data
interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Mr. Ulhas Makeshwar',
    role: 'Advisor',
    description:
      'One of our esteemed Advisor at MHE Bazar. With a BE in mechanical engineering and advanced degrees in business management and marketing, Mr. Makeshwar brings a wealth of knowledge and expertise to the team. His strategic vision and deep understanding of the market are instrumental in shaping our company’s direction and ensuring our long-term success. He is a driving force behind our innovative approaches and a mentor to our leadership. His extensive experience allows us to navigate complex challenges with confidence.',
    image: '/about/advisor1.png',
  },
  {
    name: 'Mr. Manik Thapar',
    role: 'Advisor',
    description:
      'One of our valued Advisor at MHE Bazar. Mr. Thapar brings a unique blend of technical expertise and business acumen to our team, with a BE in Mechanical and Automotive Engineering and an MBA in Marketing. His dual qualifications provide a holistic perspective, enabling him to bridge the gap between technical product development and market-driven strategies. He is known for his analytical skills and his ability to identify new opportunities, making him a key contributor to our strategic planning and business growth. His insights are invaluable.',
    image: '/about/advisor2.png',
  },
  {
    name: 'Ms. Radhika Kundra',
    role: 'Advisor',
    description:
      '4+ Years of Experience in Material Handling Equipment (MHE) & Business Operations Dynamic professional with over 4 years of proven experience in the Material Handling Equipment (MHE) industry, specializing in business development, client relationship management, and operational handling. Skilled in driving growth, managing B2B customer portfolios, and delivering tailored solutions in the industrial equipment domain. Her expertise in operations ensures smooth and efficient execution of projects. She is a dedicated and results-oriented professional who consistently exceeds expectations.',
    image: '/about/advisor3.png',
  },
  {
    name: 'Ms. Asmita Ulhas Makeshwar',
    role: 'Advisor',
    description:
      '9+ Years of Business Handling Experience | 4+ Years in Material Handling Equipment (MHE)Seasoned professional with over 9 years of experience in business operations, client management, and strategic growth, including 4+ years of specialized expertise in the Material Handling Equipment (MHE) industry. Proven ability to drive sales, manage end-to-end business processes, and deliver value-driven solutions across B2B markets. Her leadership and strategic thinking have been pivotal in expanding our market presence and building strong client relationships. She is known for her exceptional problem-solving skills and her commitment to delivering outstanding results.',
    image: '/about/advisor4.png',
  },
];

const customPositions = ['center', '50% 25%', '50% 40%', '50% 0%'];
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
    <section className="w-full bg-[#f9f9f9] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Leadership Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {teamMembers.map((member, index) => {
            const isExpanded = !!expandedCards[index]; // Ensure boolean value
            const isLongContent = member.description.length > DESCRIPTION_LIMIT;
            const descriptionToShow =
              isLongContent && !isExpanded
                ? `${member.description.substring(0, DESCRIPTION_LIMIT)}...`
                : member.description;

            return (
              <div
                key={index}
                className="flex flex-col bg-white rounded-xl overflow-hidden shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="relative w-full aspect-[4/3] rounded-t-xl overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    style={{
                      objectFit: 'cover',
                      objectPosition: customPositions[index],
                    }}
                  />
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{member.role}</p>

                  <div className="text-sm text-gray-700 mb-4 flex-grow">
                    {descriptionToShow}
                  </div>

                  {isLongContent && (
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="text-blue-600 hover:underline text-left text-sm mt-auto"
                    >
                      {isExpanded ? 'Read less' : 'Read more'}
                    </button>
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