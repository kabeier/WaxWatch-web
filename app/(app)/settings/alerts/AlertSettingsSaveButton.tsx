"use client";

import { Button } from "@/components/ui/primitives/base";

import { useAlertSettingsState } from "./AlertSettingsState";

export default function AlertSettingsSaveButton() {
  const { isSaveDisabled, updateProfileMutation } = useAlertSettingsState();

  return (
    <Button type="submit" form="alert-settings-form" disabled={isSaveDisabled}>
      {updateProfileMutation.isPending
        ? "Saving delivery settings…"
        : "Save alert delivery preferences"}
    </Button>
  );
}
