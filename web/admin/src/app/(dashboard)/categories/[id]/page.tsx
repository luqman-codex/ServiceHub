'use client';

// src/app/(dashboard)/categories/[id]/page.tsx — A-4 Edit category (04 §A.2.6).
// GET /categories/:id (loading/error/success states), PATCH to save, DELETE (soft) to
// deactivate via ConfirmDialog. RHF + zod; 422 details + 409 DUPLICATE_RESOURCE → fields;
// 404 surfaces as an error/empty state.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ConfirmDialog,
} from '@/components/ui';
import { ActiveBadge } from '@/components/domain';
import { LoadingState, ErrorState, EmptyState } from '@/components/data';
import { useCategory, useUpdateCategory, useDeleteCategory } from '@/lib/hooks/useCategories';
import { slugSchema, urlSchema, applyServerErrors } from '@/lib/validation/common';
import { ApiError } from '@/lib/api/errors';
import type { UseFormSetError } from 'react-hook-form';
import type { CategoryDTO } from '@/types/api';
import type { UpdateCategoryRequest } from '@/lib/api/categories';

const categorySchema = z.object({
  name: z.string().min(2, 'must be at least 2 characters').max(120, 'must be at most 120 characters'),
  slug: slugSchema,
  description: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
  icon_url: urlSchema,
  is_active: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blankToUndefined(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

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

function EditCategoryForm({ category }: { category: CategoryDTO }) {
  const router = useRouter();
  const updateMutation = useUpdateCategory(category.id);
  const deleteMutation = useDeleteCategory(category.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      icon_url: category.icon_url ?? '',
      is_active: category.is_active,
    },
  });

  // Re-sync the form when the underlying category changes (e.g. after invalidation).
  useEffect(() => {
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      icon_url: category.icon_url ?? '',
      is_active: category.is_active,
    });
  }, [category, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const derivedSlug = blankToUndefined(values.slug) ?? slugify(values.name);
    const body: UpdateCategoryRequest = {
      name: values.name.trim(),
      slug: derivedSlug,
      description: blankToUndefined(values.description) ?? null,
      icon_url: blankToUndefined(values.icon_url) ?? null,
      is_active: values.is_active,
    };
    try {
      const updated = await updateMutation.mutateAsync(body);
      toast.success(`Category "${updated.name}" saved`);
    } catch (err) {
      applyCategoryServerErrors(err, setError);
    }
  });

  const onDeactivate = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success(`Category "${category.name}" deactivated`);
      setConfirmOpen(false);
      router.push('/categories');
    } catch (err) {
      setConfirmOpen(false);
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate category');
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>Edit category</CardTitle>
                <CardDescription>Category #{category.id}</CardDescription>
              </div>
              <ActiveBadge active={category.is_active} />
            </div>
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
                Slug
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
              {errors.icon_url && <p className="text-xs text-red-600">{errors.icon_url.message}</p>}
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
          <CardFooter className="justify-between">
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              disabled={!category.is_active || deleteMutation.isPending}
            >
              {category.is_active ? 'Deactivate' : 'Deactivated'}
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/categories')}
                disabled={isSubmitting || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting || updateMutation.isPending}
                disabled={!isDirty}
              >
                Save changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDeactivate}
        title="Deactivate category?"
        description={`"${category.name}" will be hidden from the catalog. Existing services keep their data, but this category will be marked inactive.`}
        confirmLabel="Deactivate"
        destructive
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

function EditCategoryScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const isValidId = Number.isFinite(id) && id > 0;

  const { data, isLoading, isError, error, refetch } = useCategory(id, isValidId);

  return (
    <AppShell title="Edit category">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => router.push('/categories')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to categories
        </button>

        {!isValidId ? (
          <EmptyState
            title="Category not found"
            description="The category id in the URL is not valid."
            action={
              <Button variant="outline" onClick={() => router.push('/categories')}>
                Back to categories
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState variant="lines" rows={6} />
        ) : isError ? (
          error instanceof ApiError && error.status === 404 ? (
            <EmptyState
              title="Category not found"
              description="This category may have been removed."
              action={
                <Button variant="outline" onClick={() => router.push('/categories')}>
                  Back to categories
                </Button>
              }
            />
          ) : (
            <ErrorState error={error} onRetry={() => refetch()} />
          )
        ) : data ? (
          <EditCategoryForm category={data} />
        ) : (
          <EmptyState title="Category not found" />
        )}
      </div>
    </AppShell>
  );
}

export default function EditCategoryPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <EditCategoryScreen />
    </ProtectedRoute>
  );
}
