import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className='border-b border-border'>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className='p-4'>
              <Skeleton className='h-5 w-full' />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
