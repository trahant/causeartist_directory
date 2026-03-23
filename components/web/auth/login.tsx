import { Stack } from "~/components/common/stack"
import { LoginForm } from "~/components/web/auth/login-form"

export const Login = () => {
  return (
    <Stack direction="column" className="items-stretch w-full">
      <LoginForm />
    </Stack>
  )
}
