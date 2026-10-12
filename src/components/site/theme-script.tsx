// Runs before paint so the stored or system theme applies without a flash.
const script = `(function(){try{var t=localStorage.getItem('tabled-theme');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
