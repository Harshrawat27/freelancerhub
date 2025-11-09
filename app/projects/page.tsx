import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const Projects = () => {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='margin-left-right-side p-6'>
        <Topbar pageName='Projects' />
        <p className='text-muted-foreground mt-2'>Here are all your projects</p>
      </main>
    </div>
  );
};

export default Projects;
