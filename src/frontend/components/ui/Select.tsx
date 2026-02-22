import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ label, error, className = '', options, id, ...props }: SelectProps) {
  const selectId = id || props.name;

  return (
    <div className="ui-field">
      {label ? (
        <label htmlFor={selectId} className="ui-field__label">
          {label}
        </label>
      ) : null}
      <select id={selectId} className={`ui-select ${className}`.trim()} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="ui-field__error">{error}</p> : null}
    </div>
  );
}

