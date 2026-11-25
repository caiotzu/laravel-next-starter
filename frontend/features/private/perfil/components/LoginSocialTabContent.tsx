"use client";

import { LoginSocialSection } from "./login-social/LoginSocialSection";

export function LoginSocialTabContent() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-8">
        <LoginSocialSection />
      </div>
    </div>
  );
}
