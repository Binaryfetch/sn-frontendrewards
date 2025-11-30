import React from "react";
import ContentManagement from "../../components/ContentManagement";

export default function CompanyContent() {
  return (
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-400">Content</p>
      <ContentManagement enableUploads={true} />
    </div>
  );
}

