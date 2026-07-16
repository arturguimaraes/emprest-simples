const REPO_URL = 'https://github.com/arturguimaraes/emprest-simples';

export function Footer() {
  return (
    <footer className='mt-auto border-t border-slate-100 py-4 text-center text-xs text-slate-400'>
      v{__APP_VERSION__} (
      <a
        href={`${REPO_URL}/commit/${__COMMIT_SHA__}`}
        target='_blank'
        rel='noreferrer'
        className='underline hover:text-slate-600'
      >
        {__COMMIT_SHA__}
      </a>
      ) · {__BUILD_DATE__} {__BUILD_TIME__} UTC
    </footer>
  );
}
