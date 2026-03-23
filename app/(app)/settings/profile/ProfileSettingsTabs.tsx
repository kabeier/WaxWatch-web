import Link from "next/link";

export default function ProfileSettingsTabs() {
  return (
    <div role="tablist" aria-label="Settings sections" className="ww-page-tabs">
      <Link
        href="/settings/profile"
        role="tab"
        aria-selected="true"
        className="ww-page-tab ww-page-tab--active"
      >
        Profile
      </Link>
      <Link href="/settings/alerts" role="tab" aria-selected="false" className="ww-page-tab">
        Alerts
      </Link>
      <Link href="/settings/danger" role="tab" aria-selected="false" className="ww-page-tab">
        Danger zone
      </Link>
    </div>
  );
}
