import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="ui-field">
      {label ? (
        <label htmlFor={inputId} className="ui-field__label">
          {label}
        </label>
      ) : null}
      <input id={inputId} className={`ui-input ${className}`.trim()} {...props} />
      {error ? <p className="ui-field__error">{error}</p> : null}
    </div>
  );
}

