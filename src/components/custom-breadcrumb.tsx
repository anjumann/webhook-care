"use client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import { Fragment } from "react";

const CustomBreadcrumb = (
  {
    routeList
  }: {
    routeList: {
      label: string;
      href: string;
    }[];
  }
) => {



  return (
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
            {idx < routeList.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
    )
}

export default CustomBreadcrumb;