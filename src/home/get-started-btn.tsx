"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const GetStartedBtn = () => {

  const { id } = useUser()

  return (
    <Link href={`/dashboard/${id}`}>
      <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </Link>
  )
}

export default GetStartedBtn