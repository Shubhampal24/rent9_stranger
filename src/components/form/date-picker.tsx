import { useEffect } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: (dates: Date[]) => void;
  value?: Date;
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  required?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  value,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value || defaultDate,
      onChange: (selectedDates) => {
        if (onChange) {
          onChange(selectedDates);
        }
      },
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, id, defaultDate, value]); // Added value to dependencies

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          defaultValue={value ? (value instanceof Date ? value.toISOString().split('T')[0] : String(value)) : ''}
          className="h-10 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-[#121212] dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 pointer-events-none">
          <CalenderIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}
