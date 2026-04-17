'use client';

import type { PropsWithChildren } from 'react';
import { FormProvider, type FieldValues, type SubmitHandler, type UseFormReturn } from 'react-hook-form';

type UIFormProps<TFieldValues extends FieldValues> = PropsWithChildren<{
  methods: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  id?: string;
}>;

export function UIForm<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  id,
  children
}: UIFormProps<TFieldValues>) {
  return (
    <FormProvider {...methods}>
      <form id={id} onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
