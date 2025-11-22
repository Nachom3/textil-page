declare module '@mui/lab';
declare module '@mui/icons-material';
declare module 'sonner';
declare module 'react-hook-form';
declare module '@hookform/resolvers/zod';

declare module 'react-hook-form' {
  export const FormProvider: any;
  export function useForm<T>(...args: any[]): any;
  export function useFormContext(): any;
  export function useFieldArray(args: any): any;
  export function Controller(props: any): JSX.Element;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}
