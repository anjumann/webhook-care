"use client"

/**
 * Page heading (title + description). The breadcrumb trail now lives in the
 * console topbar (components/console/console-breadcrumb.tsx), so this only
 * renders the H1/description to avoid a duplicate trail. `routeList` is kept in
 * the signature for backward compatibility with existing call sites.
 */
const CustomBreadcrumb = (
  {
    header,
    description,
  }: {
    routeList?: {
      label: string;
      href: string;
    }[];
    header?: string;
    description?: string;
  }
) => {
  if (!header && !description) return null;

  return (
    <div className="flex flex-col gap-2 mt-6">
      {header && <h1 className="text-3xl font-bold">{header}</h1>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export default CustomBreadcrumb;
