const PROFILE_ENDPOINTS = {
  getMe: "GET /api/me",
  patchMe: "PATCH /api/me",
} as const;

export default function ProfileSettingsPage() {
  return (
    <section>
      <h1>Profile Settings Scaffold</h1>
      <p>
        Capability mapping: <code>{PROFILE_ENDPOINTS.getMe}</code> and <code>{PROFILE_ENDPOINTS.patchMe}</code>
      </p>

      <h2>{PROFILE_ENDPOINTS.getMe}</h2>
      <p>Loading state: requesting the current user profile...</p>
      <p>Empty state: no profile details are available yet.</p>
      <p>Error state: unable to load profile; retry should re-trigger {PROFILE_ENDPOINTS.getMe}.</p>
      <button type="button">Placeholder: Retry profile load</button>

      <h2>{PROFILE_ENDPOINTS.patchMe}</h2>
      <p>Form scaffold: display name, avatar URL, and notification preferences will live here.</p>
      <p>Saving state: disable submit action while {PROFILE_ENDPOINTS.patchMe} is in-flight.</p>
      <p>Error state: render validation + network feedback inline after submit failure.</p>
      <button type="button">Placeholder: Save profile changes</button>
    </section>
  );
}
