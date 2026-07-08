interface GlassLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  spinnerSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GlassLoading: React.FC<GlassLoadingProps> = ({
  size = 'md',
  spinnerSize = 'md',
  className = '',
}) => {
  const getContainerSize = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16';
      case 'md':
        return 'h-24 w-24';
      case 'lg':
        return 'h-32 w-32';
      default:
        return 'h-24 w-24';
    }
  };

  const getSpinnerSize = () => {
    switch (spinnerSize) {
      case 'sm':
        return 'h-6 w-6';
      case 'md':
        return 'h-8 w-8';
      case 'lg':
        return 'h-10 w-10';
      default:
        return 'h-8 w-8';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white ${className}`}>
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/20 bg-white/80 shadow-2xl ${getContainerSize()}`}
      >
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${getSpinnerSize()}`}
        ></div>
      </div>
    </div>
  );
};

export default GlassLoading;
