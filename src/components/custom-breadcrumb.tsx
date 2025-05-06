"use client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import { ChevronsRight } from "lucide-react";
import { Fragment } from "react";

const CustomBreadcrumb = (
  {
    routeList,
    header,
    description
  }: {
    routeList: {
      label: string;
      href: string;
    }[];
    header?: string;
    description?: string;
  }
) => {



  return (
    <div className="flex flex-col gap-2 mt-6">
      {header && <h1 className="text-3xl font-bold">{header}</h1>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Breadcrumb>
        <BreadcrumbList>
        {routeList.map((route, idx) => (
          <Fragment key={idx}>
            <BreadcrumbItem key={route.href}>
              {idx === routeList.length - 1 ? (
                <BreadcrumbPage>{route.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={route.href}>{route.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {idx < routeList.length - 1 && <BreadcrumbSeparator > <ChevronsRight /> </BreadcrumbSeparator> }
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
    </div>
    )
}

export default CustomBreadcrumb;