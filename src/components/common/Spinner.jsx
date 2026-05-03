import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
    </div>
  );
};

export default Spinner;