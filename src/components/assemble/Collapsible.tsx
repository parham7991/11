'use client';

import React, { useState, type ReactNode } from 'react';
import './assemble.css';

export default function Collapsible({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`aw-collapsible${open ? 'aw-collapsible--open' : ''}`}>
      <button
        type="button"
        className="aw-collapsible__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {icon && <span className="aw-collapsible__icon">{icon}</span>}
        <span className="aw-collapsible__title">{title}</span>
        <span className="aw-collapsible__chev" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="aw-collapsible__body">{children}</div>}
    </div>
  );
}
