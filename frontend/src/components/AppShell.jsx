import React from 'react'

/*
  Coquille commune de l'espace Pro et de l'espace Admin :
  barre latérale sur ordinateur, barre du haut + onglets du bas sur mobile.

  sections : [{ label?, items: [{ id, label, icon, badge? }] }]
  footItems : [{ id, label, icon, onClick, danger? }]
  tabbarIds : identifiants affichés dans la barre d'onglets mobile
*/
export default function AppShell({
  brandTitle,
  brandSub,
  sections,
  active,
  onSelect,
  footItems = [],
  tabbarIds,
  topbarActions,
  children,
}) {
  const allItems = sections.flatMap(s => s.items)
  const tabItems = tabbarIds ? tabbarIds.map(id => allItems.find(i => i.id === id)).filter(Boolean) : allItems

  const brand = (
    <div className="app-brand">
      <img src="/logo-fidelyz.png" alt="" onError={e => (e.currentTarget.style.visibility = 'hidden')} />
      <div className="app-brand-text">
        <span className="app-brand-title">{brandTitle}</span>
        {brandSub && <span className="app-brand-sub">{brandSub}</span>}
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        {brand}
        <nav className="app-nav">
          {sections.map((section, si) => (
            <React.Fragment key={si}>
              {section.label && <div className="app-nav-label">{section.label}</div>}
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`app-nav-item${active === item.id ? ' active' : ''}`}
                  onClick={() => onSelect(item.id)}
                  title={item.label}
                  aria-current={active === item.id ? 'page' : undefined}
                >
                  <item.icon size={19} strokeWidth={1.9} />
                  <span>{item.label}</span>
                  {item.badge != null && <em className="app-nav-badge">{item.badge}</em>}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>
        {footItems.length > 0 && (
          <div className="app-sidebar-foot">
            {footItems.map(item => (
              <button
                key={item.id}
                className={`app-nav-item${item.danger ? ' danger' : ''}`}
                onClick={item.onClick}
                title={item.label}
              >
                <item.icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          {brand}
          <div className="app-topbar-actions">{topbarActions}</div>
        </header>
        <main className="app-content" key={active}>
          {children}
        </main>
      </div>

      <nav className="app-tabbar" aria-label="Navigation">
        <div className="app-tabbar-inner">
          {tabItems.map(item => (
            <button
              key={item.id}
              className={`app-tab${active === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <item.icon size={22} strokeWidth={1.9} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* En-tête de page standard */
export function PageHead({ eyebrow, title, sub, actions, onBack, backLabel }) {
  return (
    <>
      {onBack && (
        <button className="page-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
          {backLabel}
        </button>
      )}
      <div className="page-head">
        <div className="page-head-text">
          {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </>
  )
}
