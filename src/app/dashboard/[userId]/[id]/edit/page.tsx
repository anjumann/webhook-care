import EndpointEditForm from '@/endpoints/endpoint-edit-form'
import React from 'react'

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <EndpointEditForm id={id} />
  )
}

export default page