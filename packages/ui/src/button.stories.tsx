import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button.js';
const meta = { title: 'Foundation/Button', component: Button, args: { children: 'Continuar' } } satisfies Meta<typeof Button>;
export default meta;
export const Primary: StoryObj<typeof meta> = {};
