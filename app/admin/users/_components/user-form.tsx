"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { UserActions } from "~/app/admin/users/_components/user-actions"
import { Avatar, AvatarImage } from "~/components/common/avatar"
import { Button } from "~/components/common/button"
import { Kbd } from "~/components/common/kbd"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/common/form"
import { FormMedia } from "~/components/common/form-media"
import { H3 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { cx } from "~/lib/utils"
import { updateUser } from "~/server/admin/users/actions"
import type { findUserById } from "~/server/admin/users/queries"
import { userSchema } from "~/server/admin/users/schema"

type UserFormProps = ComponentProps<"form"> & {
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>
}

export function UserForm({ className, title, user, ...props }: UserFormProps) {
  const resolver = zodResolver(userSchema)

  // Update user
  const { form, action, handleSubmitWithAction } = useHookFormAction(updateUser, resolver, {
    formProps: {
      defaultValues: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? "",
      },
    },

    actionProps: {
      onSuccess: () => {
        toast.success("User successfully updated")
      },

      onError: ({ error }) => {
        toast.error(error.serverError)
      },
    },
  })

  useHotkeys([["mod+enter", () => handleSubmitWithAction()]], [], true)

  return (
    <Form {...form}>
      <Stack className="justify-between">
        <H3 className="flex-1 truncate">{title}</H3>

        <Stack size="sm" className="-my-0.5">
          <UserActions user={user} size="md" />
        </Stack>
      </Stack>

      <form
        onSubmit={handleSubmitWithAction}
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        noValidate
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input data-1p-ignore {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormMedia form={form} field={field} path={`users/${user.id}/avatar`}>
              {field.value && (
                <Avatar className="size-8 border box-content">
                  <AvatarImage src={field.value} />
                </Avatar>
              )}
            </FormMedia>
          )}
        />

        <div className="flex justify-between gap-4 col-span-full">
          <Button size="md" variant="secondary" asChild>
            <Link href="/admin/users">Cancel</Link>
          </Button>

          <Button
            size="md"
            isPending={action.isPending}
            suffix={<Kbd variant="outline" keys={["meta", "enter"]} />}
          >
            Update user
          </Button>
        </div>
      </form>
    </Form>
  )
}
