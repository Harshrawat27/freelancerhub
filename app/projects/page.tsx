import { Sidebar } from '@/components/Sidebar';

const Projects = () => {
  return (
    <div className='min-h-screen bg-background transition-colors duration-300'>
      <Sidebar />
      <main className='ml-[270px] p-6'>
        <h1 className='text-2xl font-bold text-foreground'>Projects</h1>
        <p className='text-muted-foreground mt-2'>Here are all your projects</p>
      </main>
    </div>
  );
};

export default Projects;
