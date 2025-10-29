'use client';

import { ThemeToggle } from '../components/ThemeToggle';

const Topbar = ({ pageName }: { pageName: string }) => {
  return (
    <div className='flex flex-row justify-between items-center border-b border-border pb-4'>
      <h1 className='text-2xl font-bold text-foreground font-heading'>
        {pageName}
      </h1>
      <ThemeToggle />
    </div>
  );
};

export default Topbar;
