'use client';

// src/app/(dashboard)/categories/new/page.tsx — A-4 Create category (04 §A.2.6).
// POST /categories via useCreateCategory. RHF + zod; slug auto-derives from name when
// left blank; 422 details and 409 DUPLICATE_RESOURCE map onto name/slug fields.
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Input,
  Textarea,
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui';
import { useCreateCategory } from '@/lib/hooks/useCategories';
import { slugSchema, urlSchema, applyServerErrors } from '@/lib/validation/common';
import { ApiError } from '@/lib/api/errors';
import type { UseFormSetError } from 'react-hook-form';
import type { CreateCategoryRequest } from '@/lib/api/categories';

// §A.2.6 form fields + 02 §8.4 validation rules.
const categorySchema = z.object({
  name: z.string().min(2, 'must be at least 2 characters').max(120, 'must be at most 120 characters'),
  slug: slugSchema,
  description: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
  icon_url: urlSchema,
  is_active: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Auto-derive a URL-safe slug from a name (used when slug is left blank).
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Maps an empty/whitespace string to undefined so the API treats it as omitted.
function blankToUndefined(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

// 409 DUPLICATE_RESOURCE → field error on name/slug; otherwise delegate (§A.2.6 Error).
function applyCategoryServerErrors(
  err: unknown,
  setError: UseFormSetError<CategoryFormValues>,
): void {
  if (err instanceof ApiError && err.code === 'DUPLICATE_RESOURCE') {
    const msg = err.message || 'A category with this name or slug already exists';
    const field = /slug/i.test(msg) ? 'slug' : 'name';
    setError(field, { message: msg });
    return;
  }
  applyServerErrors(
    err,
    (f, e) => setError(f as keyof CategoryFormValues, e),
    (m) => toast.error(m),
  );
}

function NewCategoryScreen() {
  const router = useRouter();
  const createMutation = useCreateCategory();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon_url: '',
      is_active: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const derivedSlug = blankToUndefined(values.slug) ?? slugify(values.name);
    const body: CreateCategoryRequest = {
      name: values.name.trim(),
      slug: derivedSlug,
      description: blankToUndefined(values.description) ?? null,
      icon_url: blankToUndefined(values.icon_url) ?? null,
      is_active: values.is_active,
    };
    try {
      const created = await createMutation.mutateAsync(body);
      toast.success(`Category "${created.name}" created`);
      router.push(`/categories/${created.id}`);
    } catch (err) {
      applyCategoryServerErrors(err, setError);
    }
  });

  return (
    <AppShell title="New category">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => router.push('/categories')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to categories
        </button>

        <form onSubmit={onSubmit} noValidate>
          <Card>
            <CardHeader>
              <CardTitle>Create category</CardTitle>
              <CardDescription>
                Add a new grouping for services. Leave the slug blank to derive it from the name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <Input
                  id="name"
                  invalid={Boolean(errors.name)}
                  placeholder="e.g. Cleaning"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="slug" className="text-sm font-medium text-slate-700">
                  Slug <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <Input
                  id="slug"
                  invalid={Boolean(errors.slug)}
                  placeholder="auto-derived from name"
                  className="font-mono"
                  {...register('slug')}
                />
                {errors.slug ? (
                  <p className="text-xs text-red-600">{errors.slug.message}</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Lowercase letters, numbers and hyphens only.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <Textarea
                  id="description"
                  invalid={Boolean(errors.description)}
                  placeholder="What kinds of services belong here?"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="icon_url" className="text-sm font-medium text-slate-700">
                  Icon URL <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <Input
                  id="icon_url"
                  type="url"
                  invalid={Boolean(errors.icon_url)}
                  placeholder="https://…"
                  {...register('icon_url')}
                />
                {errors.icon_url && (
                  <p className="text-xs text-red-600">{errors.icon_url.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">
                    Inactive categories are hidden from the public catalog.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Active"
                    />
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/categories')}
                disabled={isSubmitting || createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
                Create category
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}

export default function NewCategoryPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <NewCategoryScreen />
    </ProtectedRoute>
  );
}
