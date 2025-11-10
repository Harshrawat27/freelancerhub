'use client';
import { motion } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '../components/ThemeToggle';

const Topbar = ({
  pageName,
  button,
}: {
  pageName: string;
  button?: React.ReactNode;
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Load sidebar visibility state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarVisible');
    if (savedState !== null) {
      const isVisible = savedState === 'true';
      setIsSidebarVisible(isVisible);
      applySidebarState(isVisible);
    }
  }, []);

  const applySidebarState = (isVisible: boolean) => {
    const sidebar = document.querySelector('.move-left') as HTMLElement;
    const mainContent = document.querySelector(
      '.margin-left-right-side'
    ) as HTMLElement;

    if (sidebar) {
      if (isVisible) {
        sidebar.style.left = '10px';
      } else {
        sidebar.style.left = '-110%';
      }
    }

    if (mainContent) {
      if (isVisible) {
        mainContent.style.marginLeft = '260px';
      } else {
        mainContent.style.marginLeft = '0';
      }
    }
  };

  const handleSidebarToggle = () => {
    const newState = !isSidebarVisible;
    setIsSidebarVisible(newState);
    applySidebarState(newState);
    localStorage.setItem('sidebarVisible', String(newState));
  };

  return (
    <div className='flex flex-row justify-between items-center border-b border-dashed border-border pb-4'>
      <div className='flex flex-row items-center gap-2'>
        <PanelLeft className='cursor-pointer' onClick={handleSidebarToggle} />
        <div className='w-px h-5 bg-foreground/50 rounded-full'></div>
        <div className='overflow-clip'>
          <motion.h1
            className='text-2xl font-bold text-foreground font-heading'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {pageName}
          </motion.h1>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        {button}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Topbar;
