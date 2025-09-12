import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className=" py-12 px-6 md:px-12 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo />
          
          <div className="flex gap-8 text-gray-300 dark:text-gray-400">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-purple-400/10 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 ProcastiNot. Built on Starknet. No excuses accepted.</p>
        </div>
      </div>
    </footer>
  );
}
