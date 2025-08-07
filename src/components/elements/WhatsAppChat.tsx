'use client';

import { useState } from 'react';
import Image from 'next/image';

const WhatsAppChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappLink =
    'https://api.whatsapp.com/send/?phone=917305950939&text=Hello+MHE+Bazar%21+I%27+d+like+to+know+more+about+your+Material+Handling+Equipment+%28MHE%29+solutions.+Could+you+please+assist+me%3F&type=phone_number&app_absent=0';

  return (
    <div className="whatsapp-chat-container">
      {/* Floating WhatsApp Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-green-500 text-green-600 px-4 py-2 rounded-full shadow-xl hover:bg-green-100 transition duration-300"
      >
        <Image
          src="/whatsapp.png"
          alt="WhatsApp Icon"
          width={28}
          height={28}
          priority
        />
        <span className="text-sm font-medium whitespace-nowrap">Chat with Us</span>
      </button>

      {/* Chat Popup */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[320px] max-w-[90vw] rounded-xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        }`}
        style={{ backgroundColor: '#f0f0f0' }}
      >
        {/* Header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/mhe-logo.png"
              alt="MHE Bazar Logo"
              width={40}
              height={40}
              className="rounded-full bg-white p-1"
            />
            <div>
              <h3 className="font-bold text-sm">MHE BAZAR</h3>
              <p className="text-xs">One Stop Solution</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-xl font-bold leading-none"
            aria-label="Close chat"
          >
            &times;
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 bg-[url('/whatsapp-bg.png')] bg-cover bg-center">
          <div className="bg-white p-3 rounded-lg text-gray-900 text-sm shadow-md max-w-full">
            Hello MHE Bazar! 👋 <br />
            I'd like to know more about your Material Handling Equipment (MHE)
            solutions. Could you please assist me?
          </div>
        </div>

        {/* Start Chat */}
        <div className="bg-white px-4 py-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center bg-[#25D366] text-white font-semibold py-2 rounded-full hover:bg-[#1DA851] transition duration-200 shadow"
          >
            <Image
              src="/whatsapp.png"
              alt="WhatsApp"
              width={20}
              height={20}
              className="mr-2"
            />
            Start Chat
          </a>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChat;
