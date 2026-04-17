'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn
} from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

type UseUIFormConfig<TFieldValues extends FieldValues> = {
  schema?: ZodTypeAny;
  defaultValues?: DefaultValues<TFieldValues>;
  formOptions?: Omit<UseFormProps<TFieldValues>, 'resolver' | 'defaultValues'>;
};

export function useUIForm<TFieldValues extends FieldValues = FieldValues>(
  config?: UseUIFormConfig<TFieldValues>
): UseFormReturn<TFieldValues> {
  const formConfig: UseFormProps<TFieldValues> = {
    ...config?.formOptions
  };

  if (config?.defaultValues) {
    formConfig.defaultValues = config.defaultValues;
  }

  if (config?.schema) {
    formConfig.resolver = zodResolver(config.schema as never) as Resolver<TFieldValues>;
  }

  return useForm<TFieldValues>(formConfig);
}
