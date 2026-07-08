import {
  Check_icon,
  Icon_Wait,
  Time_Icon,
  Money_icon,
  Process_icon,
  Accept_icon,
  Gift_icon,
  ReciveCustomer_icon,
  AgentSend_icon,
} from '@/components/common/Icon';
import { States } from '@/types/Home';
import { Fragment, useMemo } from 'react';

// mapping بین code های states و آیکن‌های levelsStatusSend
const statusCodeToIconMap: Record<string, React.ComponentType<any>> = {
  pending_payment_state: Money_icon,
  processing_state: Process_icon,
  confirmation_state: Accept_icon,
  preparation_state: Gift_icon,
  confirm_exit_from_warehouse_state: ReciveCustomer_icon,
  delivery_to_the_sending_agent_state: AgentSend_icon,
  delivery_to_the_user_state: ReciveCustomer_icon,
};

interface Props {
  states: States;
  stateTitle?: string;
}

const StatusSendProduct = ({ states, stateTitle }: Props) => {
  // map کردن states و اضافه کردن آیکن
  const mappedStates = useMemo(() => {
    if (!states || !Array.isArray(states) || states.length === 0) return [];
    return states.map((state) => ({
      ...state,
      icon: statusCodeToIconMap[state.code],
    }));
  }, [states]);

  // پیدا کردن ایندکس وضعیت فعلی
  const currentStatusIndex = useMemo(() => {
    if (!stateTitle || !mappedStates.length) return -1;
    return mappedStates.findIndex((state) => state.title === stateTitle);
  }, [stateTitle, mappedStates]);

  return (
    <div className="container_status_send_product flex h-[140px] w-full items-center justify-between overflow-auto border-zinc-100 bg-white px-4 py-4 md:rounded-[40px] md:border-2 md:px-14 lg:my-10">
      {mappedStates.map((status, idx) => {
        const isCompleted = idx < currentStatusIndex;
        const isCurrent = idx === currentStatusIndex;
        const IconComponent = status.icon;

        return (
          <Fragment key={status.id}>
            <div className="relative -mt-6 flex flex-1 flex-col items-center justify-center px-2">
              {/* دایره اصلی با آیکن */}
              <div
                className={`relative flex h-[70px] w-[70px] items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-400 shadow-lg shadow-green-400/50'
                    : isCurrent
                      ? 'bg-main shadow-lg shadow-main/50 ring-4 ring-main/20'
                      : 'bg-neutral-100'
                }`}
              >
                {IconComponent && (
                  <IconComponent
                    className={`h-8 w-8 transition-all duration-300 ${
                      isCompleted || isCurrent ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                )}
                {/* دایره کوچک برای وضعیت */}
              </div>

              {/* متن و آیکن وضعیت */}
              <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-400' : isCurrent ? 'bg-main' : 'bg-transparent'
                  }`}
                >
                  {isCompleted ? (
                    <Check_icon className="block h-5 w-5 text-white" />
                  ) : isCurrent ? (
                    <Time_Icon className="block h-5 w-5 text-white" />
                  ) : (
                    <Icon_Wait className="block h-5 w-5 text-zinc-400" />
                  )}
                </div>
                <p
                  className={`whitespace-nowrap text-center text-[12px] transition-colors duration-300 ${
                    isCompleted || isCurrent ? 'font-bold text-black' : 'font-medium text-zinc-400'
                  }`}
                >
                  {status.title}
                </p>
              </div>
            </div>

            {/* خط اتصال بین مراحل */}
            {idx < mappedStates.length - 1 && (
              <div
                className={`line_between_item -mt-6 h-[2px] !w-full min-w-[80px] transition-all duration-500 ${
                  isCompleted ? 'bg-green-400' : isCurrent ? 'bg-main' : 'bg-amber-200'
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default StatusSendProduct;
