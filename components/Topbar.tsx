'use client';
import { motion } from 'framer-motion';

import { ThemeToggle } from '../components/ThemeToggle';

const Topbar = ({ pageName }: { pageName: string }) => {
  return (
    <div className='flex flex-row justify-between items-center border-b border-dashed border-border pb-4'>
      <motion.h1
        className='text-2xl font-bold text-foreground font-heading'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {pageName}
      </motion.h1>
      <ThemeToggle />
    </div>
  );
};

export default Topbar;
