"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { track } from '@/lib/analytics'

const GetStartedBtn = (
  {
    children,
    cta,
  }: {
    children?: React.ReactNode,
    /** Which surface hosts this CTA (`header` / `hero` / `final`) — rides on `landing_cta_clicked`. */
    cta?: string,
  }
) => {

  const { id } = useUser()

  return (
    <Link
      href={`/dashboard/${id}`}
      onClick={() => track('landing_cta_clicked', { cta: cta ?? 'unknown' })}
    >
      {children ?? <Button size="sm">Catch Webhooks <ArrowRight className="ml-2 h-4 w-4" /></Button>}
    </Link>
  )
}

export default GetStartedBtn