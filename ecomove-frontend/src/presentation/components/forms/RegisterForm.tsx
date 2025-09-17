// 🎨 REGISTER FORM COMPONENT
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Phone, CreditCard } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { VALIDATION_RULES } from '../../../shared/constants';

const registerSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(VALIDATION_RULES.EMAIL_MAX_LENGTH, 'Email is too long'),
  documentNumber: z
    .string()
    .min(VALIDATION_RULES.DOCUMENT_NUMBER_LENGTH.min, 'Document number is too short')
    .max(VALIDATION_RULES.DOCUMENT_NUMBER_LENGTH.max, 'Document number is too long')
    .regex(/^\d+$/, 'Document number can only contain numbers'),
  phone: z
    .string()
    .min(VALIDATION_RULES.PHONE_NUMBER_LENGTH, 'Phone number must be 10 digits')
    .max(VALIDATION_RULES.PHONE_NUMBER_LENGTH, 'Phone number must be 10 digits')
    .regex(/^3\d{9}$/, 'Phone number must start with 3 and have 10 digits'),
  password: z
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSubmit: (data: Omit<RegisterFormData, 'confirmPassword' | 'acceptTerms'>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  className,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const password = watch('password');

  const handleFormSubmit = async (data: RegisterFormData) => {
    clearErrors();
    try {
      const { confirmPassword, acceptTerms, ...submitData } = data;
      await onSubmit(submitData);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <Card className={className} variant="elevated">
      <CardHeader
        title="Crear Cuenta"
        subtitle="Únete a EcoMove y comienza a moverte de forma sostenible"
      />
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Global error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Name field */}
          <Input
            {...register('name')}
            label="Nombre completo"
            placeholder="Tu nombre completo"
            error={errors.name?.message}
            leftIcon={<User className="w-5 h-5" />}
            disabled={isLoading}
          />

          {/* Email field */}
          <Input
            {...register('email')}
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            leftIcon={<Mail className="w-5 h-5" />}
            disabled={isLoading}
          />

          {/* Document number field */}
          <Input
            {...register('documentNumber')}
            label="Número de documento"
            placeholder="12345678"
            error={errors.documentNumber?.message}
            helperText="Cédula de ciudadanía colombiana"
            leftIcon={<CreditCard className="w-5 h-5" />}
            disabled={isLoading}
          />

          {/* Phone field */}
          <Input
            {...register('phone')}
            label="Número de teléfono"
            placeholder="3001234567"
            error={errors.phone?.message}
            helperText="Número celular colombiano"
            leftIcon={<Phone className="w-5 h-5" />}
            disabled={isLoading}
          />

          {/* Password field */}
          <Input
            {...register('password')}
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tu contraseña"
            error={errors.password?.message}
            helperText="Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números"
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            disabled={isLoading}
          />

          {/* Confirm password field */}
          <Input
            {...register('confirmPassword')}
            label="Confirmar contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirma tu contraseña"
            error={errors.confirmPassword?.message}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            disabled={isLoading}
          />

          {/* Terms and conditions */}
          <div className="flex items-start">
            <input
              {...register('acceptTerms')}
              id="acceptTerms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              disabled={isLoading}
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
              Acepto los{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 underline"
                disabled={isLoading}
              >
                términos y condiciones
              </button>{' '}
              y la{' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 underline"
                disabled={isLoading}
              >
                política de privacidad
              </button>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600 mt-1">{errors.acceptTerms.message}</p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={!isValid}
          >
            Crear Cuenta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};