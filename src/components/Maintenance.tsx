"use client";

export default function Maintenance() {
  const socialLinks = [
    { 
      id: "linkedin", 
      url: "https://www.linkedin.com/company/mhe-bazar/",
      color: "text-[#0077b5]",
      hoverBorder: "hover:border-[#0077b5]",
      hoverBg: "hover:bg-[#0077b5]/10",
      svg: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    },
    { 
      id: "instagram", 
      url: "https://www.instagram.com/mhebazar.in/",
      color: "text-[#E1306C]",
      hoverBorder: "hover:border-[#E1306C]",
      hoverBg: "hover:bg-[#E1306C]/10",
      svg: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    },
    { 
      id: "facebook", 
      url: "https://www.facebook.com/mhebazar.in/",
      color: "text-[#1877F2]",
      hoverBorder: "hover:border-[#1877F2]",
      hoverBg: "hover:bg-[#1877F2]/10",
      svg: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    },
    { 
      id: "twitter", 
      url: "https://twitter.com/Greentech_MH",
      color: "text-[#000000]",
      hoverBorder: "hover:border-[#000000]",
      hoverBg: "hover:bg-black/5",
      svg: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    },
    { 
      id: "youtube", 
      url: "https://www.youtube.com/@mhebazar",
      color: "text-[#FF0000]",
      hoverBorder: "hover:border-[#FF0000]",
      hoverBg: "hover:bg-[#FF0000]/10",
      svg: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    },
    { 
      id: "pinterest", 
      url: "https://in.pinterest.com/greentechindiamh/",
      color: "text-[#E60023]",
      hoverBorder: "hover:border-[#E60023]",
      hoverBg: "hover:bg-[#E60023]/10",
      svg: <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z"/>
    }
  ];

  return (
    <div className="h-[100dvh] w-full bg-[#f0f3f6] flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      
      {/* Main Transparent Container */}
      <div className="w-full max-w-5xl h-full max-h-[700px] flex flex-col overflow-hidden bg-transparent">
        
        {/* Top & Middle Content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
          
          {/* Logo */}
          <div className="absolute top-6 sm:top-10 flex justify-center w-full">
            <img 
              src="/mhe-logo.webp" 
              alt="MHE Bazar" 
              className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>

          {/* Text Content */}
          <div className="text-center mt-16 sm:mt-20 mb-10 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#202327] mb-6 tracking-tight leading-tight">
              The site is currently<br />under maintenance
            </h1>
            <p className="text-[#6c757d] text-sm sm:text-base leading-relaxed">
              We apologize for any inconveniences caused.<br />
              We're almost done.
            </p>
          </div>

          {/* Geometric Plug Graphic (Pure SVG) */}
          <div className="w-full max-w-4xl mx-auto px-4 shrink-0">
            <svg viewBox="0 0 1000 140" className="w-full h-auto drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* --- LEFT SIDE (BLUE PLUG) --- */}
              <path d="M-10 70 L 280 70 L 295 85 L 340 85" stroke="#a3e4f5" strokeWidth="14" />
              <rect x="330" y="78" width="15" height="14" fill="#4fc3f7" />
              <rect x="345" y="60" width="30" height="40" fill="#0288d1" />
              <rect x="345" y="60" width="30" height="20" fill="#29b6f6" />
              <rect x="375" y="45" width="35" height="70" fill="#1565c0" />
              <rect x="375" y="45" width="35" height="35" fill="#1e88e5" />
              <rect x="410" y="55" width="25" height="14" fill="#0d47a1" />
              <rect x="410" y="55" width="25" height="7" fill="#1565c0" />
              <rect x="410" y="91" width="25" height="14" fill="#0d47a1" />
              <rect x="410" y="91" width="25" height="7" fill="#1565c0" />

              {/* --- RIGHT SIDE (GREEN SOCKET) --- */}
              <path d="M1010 70 L 720 70 L 705 85 L 660 85" stroke="#69f0ae" strokeWidth="14" />
              <rect x="655" y="78" width="15" height="14" fill="#00e676" />
              <rect x="625" y="60" width="30" height="40" fill="#00b0ff" className="fill-[#00c853]" />
              <rect x="625" y="60" width="30" height="20" fill="#00e676" />
              <rect x="575" y="45" width="50" height="70" fill="#1b5e20" />
              <rect x="575" y="45" width="50" height="35" fill="#2e7d32" />
              <polygon points="575,45 545,30 545,130 575,115" fill="#1b5e20" />
              <polygon points="575,45 545,30 545,80 575,80" fill="#4caf50" />

              {/* --- FLOATING PARTICLES --- */}
              <path d="M 450 35 C 460 25, 470 35, 470 35 Z" fill="#29b6f6" />
              <polygon points="450,125 470,125 470,110" fill="#a3e4f5" />
              <polygon points="515,25 530,40 515,40" fill="#00e676" />
              <path d="M 515 115 C 525 125, 530 115, 530 115 Z" fill="#2e7d32" />
            </svg>
          </div>

        </div>

        {/* Footer Area - Rebuilt spacing for perfect balance on Mobile & Web */}
        <div className="border-t border-[#dce1e6] shrink-0">
          {/* - flex-col on mobile (stacking elements)
            - lg:flex-row on desktop (side by side)
            - Increased gap for mobile breathing room 
          */}
          <div className="py-6 px-4 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 text-[13px] sm:text-sm text-[#8c949c]">
            
            {/* Contact Group */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <span className="font-medium text-[#202327]">You can contact us:</span>
              <div className="flex items-center gap-4 sm:gap-6">
                <span>
                  Phone: <a href="tel:+917305950939" className="text-[#202327] hover:underline font-medium">+91 73059 50939</a>
                </span>
                <span>
                  Email: <a href="mailto:sales.1@mhebazar.com" className="text-[#202327] hover:underline font-medium">sales.1@mhebazar.com</a>
                </span>
              </div>
            </div>

            {/* Social Icons Group - perfectly spaced grid on mobile, row on desktop */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.id} 
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our ${social.id} page`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#dce1e6] flex items-center justify-center bg-white shadow-sm transition-all duration-200 cursor-pointer ${social.color} ${social.hoverBorder} ${social.hoverBg}`}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]"
                  >
                    {social.svg}
                  </svg>
                </a>
              ))}
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
