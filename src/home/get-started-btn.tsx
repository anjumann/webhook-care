"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const GetStartedBtn = (
  {
    children,
  }: {
    children?: React.ReactNode,
  }
) => {

  const { id } = useUser()

  return (
    <Link href={`/dashboard/${id}`}>
      {children ?? <Button size="sm">Catch Webhooks <ArrowRight className="ml-2 h-4 w-4" /></Button>}
    </Link>
  )
}

export default GetStartedBtn