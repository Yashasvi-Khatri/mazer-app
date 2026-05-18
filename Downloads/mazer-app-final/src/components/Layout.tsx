import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

type LayoutProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ children, className, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        fullWidth ? "w-full px-4 md:px-6" : "container py-8 px-4",
        className
      )}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
