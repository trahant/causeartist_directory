"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { UserActions } from "~/app/admin/users/_components/user-actions"
import { Avatar, AvatarImage } from "~/components/common/avatar"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findUserById } from "~/server/admin/users/queries"
import { userSchema } from "~/server/admin/users/schema"

type UserFormProps = ComponentProps<"form"> & {
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>
}

export function UserForm({ className, title, user, ...props }: UserFormProps) {
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? "",
    },
  })

  const mutation = useMutation(
    orpc.users.update.mutationOptions({
      onSuccess: () => {
        toast.success("User successfully updated")
        queryClient.invalidateQueries({ queryKey: orpc.users.key() })
      },

      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => onSubmit()]], [], true)

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          <UserActions user={user} size="md" />
        </Stack>
      </Stack>

      <form
        onSubmit={onSubmit}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input id={field.name} data-1p-ignore {...field} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input id={field.name} {...field} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FormMedia form={form} field={field} path={`users/${user.id}/avatar`}>
                {field.value && (
                  <Avatar className="size-8 border box-content">
                    <AvatarImage src={field.value} />
                  </Avatar>
                )}
              </FormMedia>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/users">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={mutation.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Update user
          </Button>
        </div>
      </form>
    </Form>
  )
}
