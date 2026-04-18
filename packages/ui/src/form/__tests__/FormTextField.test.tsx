import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UIButton } from '../../components/Button';
import { UIForm } from '../Form';
import { UIFormTextField } from '../FormTextField';
import { useUIForm } from '../useUIForm';
import { z } from '../zod';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
});

type FormValues = z.infer<typeof schema>;

function FormFixture() {
  const methods = useUIForm<FormValues>({
    schema,
    defaultValues: {
      name: '',
    },
  });

  return (
    <UIForm methods={methods} onSubmit={() => undefined}>
      <UIFormTextField<FormValues> name="name" label="Name" methods={methods} />
      <UIButton type="submit">Submit</UIButton>
    </UIForm>
  );
}

describe('UIFormTextField', () => {
  it('shows validation error from zod schema after submit', async () => {
    render(<FormFixture />);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });
});
