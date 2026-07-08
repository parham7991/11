'use client';
import { Button as ReactButton } from '@heroui/react';
type Props = {
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset' | undefined;
};
const Button = ({ children, className, isLoading, onClick, disabled, type }: Props) => {
  const onPress = () => {
    if ((onClick && !disabled) || (onClick && !isLoading)) {
      setTimeout(() => {
        onClick();
      }, 200);
    }
  };
  return (
    <ReactButton
      type={type}
      isDisabled={disabled}
      onPress={onPress}
      isLoading={isLoading}
      className={`h-[48px] w-full bg-transparent !px-0 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-95 ${className}`}
    >
      {children}
    </ReactButton>
  );
};

export default Button;
