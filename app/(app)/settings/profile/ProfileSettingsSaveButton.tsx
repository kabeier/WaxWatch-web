"use client";

import { Button } from "@/components/ui/primitives/base";

import { useProfileSettingsState } from "./ProfileSettingsState";

export default function ProfileSettingsSaveButton() {
  const { isRateLimited, isSaveDisabled, updateProfileMutation } = useProfileSettingsState();

  return (
    <Button type="submit" form="profile-settings-form" disabled={isSaveDisabled || isRateLimited}>
      {updateProfileMutation.isPending ? "Saving profile changes…" : "Save profile changes"}
    </Button>
  );
}
