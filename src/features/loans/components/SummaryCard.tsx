import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Props = {
  icon: IconDefinition;
  iconClass: string;
  labelClass: string;
  cardClass: string;
  ringClass: string;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
};

export function SummaryCard({
  icon, iconClass, labelClass, cardClass, ringClass,
  label, value, subtitle, detail,
  selected, onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`block h-full w-full rounded-2xl text-left transition-all duration-150 focus:outline-none ${
        selected ? `ring-2 ${ringClass} shadow-md` : 'hover:opacity-90'
      }`}
    >
      <div className={`flex h-full flex-col rounded-2xl border shadow-sm ${cardClass} ${selected ? 'border-transparent' : ''}`}>
        <div className='border-b border-black/5 p-4'>
          <div className={`text-sm ${labelClass}`}>
            <FontAwesomeIcon icon={icon} className={`mr-1.5 ${iconClass}`} />
            {label}
          </div>
          <div className='text-xl font-bold mt-0.5'>{value}</div>
        </div>
        <div className='p-4'>
          {subtitle && <div className='text-sm text-slate-600'>{subtitle}</div>}
          {detail && <div className='mt-0.5 text-xs text-slate-400'>{detail}</div>}
        </div>
      </div>
    </button>
  );
}
