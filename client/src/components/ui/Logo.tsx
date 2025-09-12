export default function Logo() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      {/* Logo Icon */}
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-light rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-white"
          >
            {/* Simple diamond/square shape */}
            <path 
              d="M12 2L22 12L12 22L2 12L12 2Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-accent to-accent-light rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
      </div>
    </div>
  );
}
