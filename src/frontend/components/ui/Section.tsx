import React from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, subtitle, actions, children, className = '' }: SectionProps) {
  return (
    <section className={`ui-section ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="ui-section__header">
          <div className="min-w-0">
            {title ? <h2 className="ui-section__title">{title}</h2> : null}
            {subtitle ? <p className="ui-section__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ui-section__actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

