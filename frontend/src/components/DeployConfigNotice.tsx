/**
 * Shown on production builds when VITE_API_BASE_URL was not set at build time (e.g. Vercel env missing).
 */
export function DeployConfigNotice() {
    if (!import.meta.env.PROD || import.meta.env.VITE_API_BASE_URL) return null;

    return (
        <div className="deploy-notice" role="status">
            <strong>Configuration needed.</strong> In the Vercel project → Settings → Environment Variables, add{' '}
            <code>VITE_API_BASE_URL</code> with your live API base URL (must be <code>https://</code> and end with{' '}
            <code>/api/v1</code>
            ). Save, then trigger a new deployment (Redeploy). The backend must be deployed separately and list this
            site&apos;s origin in <code>CORS_ORIGINS</code>.
        </div>
    );
}
