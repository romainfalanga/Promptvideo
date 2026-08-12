import { useEffect, useState } from 'react'
import { openProject, useActiveProject, useStore } from './store'
import Home from './views/Home'
import StudioMode from './views/StudioMode'
import CustomMode from './views/CustomMode'
import Workspace from './views/Workspace'
import { cx } from './lib/utils'

export type Route = 'accueil' | 'studio' | 'sur-mesure' | 'atelier'

export default function App() {
  const store = useStore()
  const active = useActiveProject()
  const [route, setRoute] = useState<Route>('accueil')

  // Ouvrir un projet bascule automatiquement dans l'atelier.
  useEffect(() => {
    if (active && route !== 'atelier') setRoute('atelier')
    if (!active && route === 'atelier') setRoute('accueil')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  const go = (r: Route) => {
    if (r !== 'atelier') openProject(null)
    setRoute(r)
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3">
          <button type="button" onClick={() => go('accueil')} className="group flex items-center gap-2.5 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-ink-950 font-display text-base font-bold">
              P
            </span>
            <span>
              <span className="block font-display text-[15px] leading-tight text-ink-100 group-hover:text-white">
                Promptvideo Studio
              </span>
              <span className="block text-[10.5px] uppercase tracking-[0.16em] text-ink-500">
                Comptes Seedance 2.5
              </span>
            </span>
          </button>

          <nav className="ml-2 flex items-center gap-1">
            <NavLink active={route === 'accueil'} onClick={() => go('accueil')}>
              Mes comptes{store.projects.length > 0 && ` (${store.projects.length})`}
            </NavLink>
            <NavLink active={route === 'studio'} onClick={() => go('studio')}>
              Mode Studio
            </NavLink>
            <NavLink active={route === 'sur-mesure'} onClick={() => go('sur-mesure')}>
              Mode Sur-Mesure
            </NavLink>
          </nav>

          {active && (
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[12px] text-ink-400 sm:block">
                Compte ouvert : <span className="text-ink-200">{active.name}</span>
              </span>
              <button type="button" className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => go('accueil')}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-7">
        {route === 'accueil' && <Home onStudio={() => go('studio')} onCustom={() => go('sur-mesure')} />}
        {route === 'studio' && <StudioMode />}
        {route === 'sur-mesure' && <CustomMode />}
        {route === 'atelier' && active && <Workspace project={active} />}
      </main>

      <footer className="border-t border-ink-800/70 px-5 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 text-[11.5px] text-ink-500">
          <span>
            Tout est stocke dans ce navigateur. Exporte tes comptes en JSON pour les conserver.
          </span>
          <span>
            Contraintes appliquees : 4–30 s · 30 images / 10 videos / 10 audio · references numerotees par ordre d&apos;envoi
          </span>
        </div>
      </footer>
    </div>
  )
}

function NavLink({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-lg px-3 py-1.5 text-[13px] transition',
        active ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
      )}
    >
      {children}
    </button>
  )
}
