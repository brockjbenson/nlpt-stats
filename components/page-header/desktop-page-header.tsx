import React from "react";

// Desktop's version of the page header. The mobile PageHeader is md:hidden,
// so pages that switch year or view with header controls repeat them here as
// rows of chips (LinkTabs variant="chips") under a title.
function DesktopPageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-md:hidden px-2 mb-6 flex flex-col gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export default DesktopPageHeader;
